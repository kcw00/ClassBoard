-- CreateIndex
CREATE INDEX "students_email_idx" ON "students"("email");

-- CreateIndex
CREATE INDEX "students_name_idx" ON "students"("name");

-- CreateIndex
CREATE INDEX "students_grade_idx" ON "students"("grade");

-- CreateIndex
CREATE INDEX "students_created_at_idx" ON "students"("created_at");

-- CreateIndex
CREATE INDEX "classes_subject_idx" ON "classes"("subject");

-- CreateIndex
CREATE INDEX "classes_name_idx" ON "classes"("name");

-- CreateIndex
CREATE INDEX "classes_created_at_idx" ON "classes"("created_at");

-- CreateIndex
CREATE INDEX "classes_room_idx" ON "classes"("room");

-- CreateIndex
CREATE INDEX "tests_class_id_idx" ON "tests"("class_id");

-- CreateIndex
CREATE INDEX "tests_test_date_idx" ON "tests"("test_date");

-- CreateIndex
CREATE INDEX "tests_test_type_idx" ON "tests"("test_type");

-- CreateIndex
CREATE INDEX "tests_created_at_idx" ON "tests"("created_at");

-- CreateIndex
CREATE INDEX "test_results_test_id_idx" ON "test_results"("test_id");

-- CreateIndex
CREATE INDEX "test_results_student_id_idx" ON "test_results"("student_id");

-- CreateIndex
CREATE INDEX "test_results_grade_idx" ON "test_results"("grade");

-- CreateIndex
CREATE INDEX "test_results_graded_date_idx" ON "test_results"("graded_date");

-- CreateIndex
CREATE INDEX "homework_assignments_class_id_idx" ON "homework_assignments"("class_id");

-- CreateIndex
CREATE INDEX "homework_assignments_due_date_idx" ON "homework_assignments"("due_date");

-- CreateIndex
CREATE INDEX "homework_assignments_assigned_date_idx" ON "homework_assignments"("assigned_date");

-- CreateIndex
CREATE INDEX "homework_assignments_created_at_idx" ON "homework_assignments"("created_at");

-- CreateIndex
CREATE INDEX "attendance_records_class_id_idx" ON "attendance_records"("class_id");

-- CreateIndex
CREATE INDEX "attendance_records_date_idx" ON "attendance_records"("date");

-- CreateIndex
CREATE INDEX "attendance_records_created_at_idx" ON "attendance_records"("created_at");