import { Handler, ScheduledEvent } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const prisma = new PrismaClient();
const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });

interface NotificationData {
    type: 'assignment_due' | 'grade_update' | 'attendance_alert';
    recipientEmail: string;
    recipientName: string;
    subject: string;
    content: string;
    metadata?: any;
}

interface AttendanceRecord {
    id: string;
    studentId: string;
    classId: string;
    date: Date;
    status: string;
}

interface EmailNotificationResponse {
    statusCode: number;
    body: string;
}

export const handler: Handler<ScheduledEvent, EmailNotificationResponse> = async (event) => {
    console.log('Starting email notification processing', { event });

    try {
        const notifications: NotificationData[] = [];

        // Check for assignment due dates (next 24 hours)
        const dueSoonAssignments = await checkAssignmentDueDates();
        notifications.push(...dueSoonAssignments);

        // Check for new grade updates (last 24 hours)
        const gradeUpdates = await checkGradeUpdates();
        notifications.push(...gradeUpdates);

        // Check for attendance alerts (students with low attendance)
        const attendanceAlerts = await checkAttendanceAlerts();
        notifications.push(...attendanceAlerts);

        // Send all notifications
        const sentCount = await sendNotifications(notifications);

        console.log(`Successfully processed ${notifications.length} notifications, sent ${sentCount}`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Email notifications processed successfully',
                totalNotifications: notifications.length,
                sentCount,
            }),
        };
    } catch (error) {
        console.error('Error in email notification processing:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
};

async function checkAssignmentDueDates(): Promise<NotificationData[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get tests/assignments due in the next 24 hours
    const dueSoonTests = await prisma.test.findMany({
        where: {
            testDate: {
                gte: today,
                lte: tomorrow,
            },
        },
        include: {
            class: {
                include: {
                    enrollments: {
                        include: {
                            student: true,
                        },
                    },
                },
            },
        },
    });

    const notifications: NotificationData[] = [];

    for (const test of dueSoonTests) {
        for (const enrollment of test.class.enrollments) {
            const student = enrollment.student;

            notifications.push({
                type: 'assignment_due',
                recipientEmail: student.email,
                recipientName: student.name,
                subject: `Reminder: ${test.title} due tomorrow`,
                content: generateAssignmentDueEmail(student.name, test.title, test.class.name, test.testDate),
                metadata: {
                    testId: test.id,
                    studentId: student.id,
                    classId: test.classId,
                },
            });
        }
    }

    return notifications;
}

async function checkGradeUpdates(): Promise<NotificationData[]> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Get test results graded in the last 24 hours
    const recentGrades = await prisma.testResult.findMany({
        where: {
            gradedDate: {
                gte: yesterday,
            },
            grade: {
                not: null,
            },
        },
        include: {
            student: true,
            test: {
                include: {
                    class: true,
                },
            },
        },
    });

    const notifications: NotificationData[] = [];

    for (const result of recentGrades) {
        notifications.push({
            type: 'grade_update',
            recipientEmail: result.student.email,
            recipientName: result.student.name,
            subject: `Grade Update: ${result.test.title}`,
            content: generateGradeUpdateEmail(
                result.student.name,
                result.test.title,
                result.test.class.name,
                result.grade!,
                result.percentage || 0,
                result.feedback
            ),
            metadata: {
                testResultId: result.id,
                testId: result.testId,
                studentId: result.studentId,
            },
        });
    }

    return notifications;
}

async function checkAttendanceAlerts(): Promise<NotificationData[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get students with low attendance (< 80%) in the last 30 days
    const classes = await prisma.class.findMany({
        include: {
            enrollments: {
                include: {
                    student: true,
                },
            },
            attendanceRecords: {
                where: {
                    date: {
                        gte: thirtyDaysAgo,
                    },
                },
            },
        },
    });

    const notifications: NotificationData[] = [];

    for (const classItem of classes) {
        const totalSessions = await prisma.attendanceRecord.count({
            where: {
                classId: classItem.id,
                date: {
                    gte: thirtyDaysAgo,
                },
            },
            distinct: ['date'],
        });

        if (totalSessions < 5) continue; // Skip if too few sessions to be meaningful

        for (const enrollment of classItem.enrollments) {
            const studentAttendance = classItem.attendanceRecords.filter(
                (record: AttendanceRecord) => record.studentId === enrollment.studentId && record.status === 'present'
            ).length;

            const attendanceRate = (studentAttendance / totalSessions) * 100;

            if (attendanceRate < 80) {
                notifications.push({
                    type: 'attendance_alert',
                    recipientEmail: enrollment.student.email,
                    recipientName: enrollment.student.name,
                    subject: `Attendance Alert: ${classItem.name}`,
                    content: generateAttendanceAlertEmail(
                        enrollment.student.name,
                        classItem.name,
                        attendanceRate,
                        studentAttendance,
                        totalSessions
                    ),
                    metadata: {
                        studentId: enrollment.studentId,
                        classId: classItem.id,
                        attendanceRate,
                    },
                });
            }
        }
    }

    return notifications;
}

async function sendNotifications(notifications: NotificationData[]): Promise<number> {
    const fromEmail = process.env.FROM_EMAIL || 'noreply@classboard.app';
    let sentCount = 0;

    for (const notification of notifications) {
        try {
            const command = new SendEmailCommand({
                Source: fromEmail,
                Destination: {
                    ToAddresses: [notification.recipientEmail],
                },
                Message: {
                    Subject: {
                        Data: notification.subject,
                        Charset: 'UTF-8',
                    },
                    Body: {
                        Html: {
                            Data: notification.content,
                            Charset: 'UTF-8',
                        },
                    },
                },
            });

            await sesClient.send(command);
            sentCount++;

            console.log(`Sent ${notification.type} notification to ${notification.recipientEmail}`);
        } catch (error) {
            console.error(`Failed to send notification to ${notification.recipientEmail}:`, error);
        }
    }

    return sentCount;
}

function generateAssignmentDueEmail(studentName: string, testTitle: string, className: string, dueDate: Date): string {
    return `
    <html>
      <body>
        <h2>Assignment Reminder</h2>
        <p>Hi ${studentName},</p>
        <p>This is a friendly reminder that your assignment <strong>${testTitle}</strong> for <strong>${className}</strong> is due tomorrow (${dueDate.toLocaleDateString()}).</p>
        <p>Please make sure to submit your work on time.</p>
        <p>Good luck!</p>
        <p>Best regards,<br>ClassBoard Team</p>
      </body>
    </html>
  `;
}

function generateGradeUpdateEmail(
    studentName: string,
    testTitle: string,
    className: string,
    grade: string,
    percentage: number,
    feedback?: string | null
): string {
    return `
    <html>
      <body>
        <h2>Grade Update</h2>
        <p>Hi ${studentName},</p>
        <p>Your grade for <strong>${testTitle}</strong> in <strong>${className}</strong> has been updated:</p>
        <ul>
          <li><strong>Grade:</strong> ${grade}</li>
          <li><strong>Score:</strong> ${percentage.toFixed(1)}%</li>
        </ul>
        ${feedback ? `<p><strong>Feedback:</strong> ${feedback}</p>` : ''}
        <p>Keep up the great work!</p>
        <p>Best regards,<br>ClassBoard Team</p>
      </body>
    </html>
  `;
}

function generateAttendanceAlertEmail(
    studentName: string,
    className: string,
    attendanceRate: number,
    presentDays: number,
    totalDays: number
): string {
    return `
    <html>
      <body>
        <h2>Attendance Alert</h2>
        <p>Hi ${studentName},</p>
        <p>We wanted to let you know that your attendance in <strong>${className}</strong> has fallen below our recommended threshold.</p>
        <ul>
          <li><strong>Current Attendance Rate:</strong> ${attendanceRate.toFixed(1)}%</li>
          <li><strong>Days Present:</strong> ${presentDays} out of ${totalDays}</li>
        </ul>
        <p>Regular attendance is important for your academic success. If you're facing any challenges, please don't hesitate to reach out to your instructor.</p>
        <p>Best regards,<br>ClassBoard Team</p>
      </body>
    </html>
  `;
}