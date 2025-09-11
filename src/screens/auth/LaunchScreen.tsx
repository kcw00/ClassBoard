import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Users, Calendar, BarChart3, CheckCircle } from "lucide-react"

interface LaunchScreenProps {
  onGetStarted: () => void
}

export default function LaunchScreen({ onGetStarted }: LaunchScreenProps) {
  const features = [
    {
      icon: BookOpen,
      title: "Class Management",
      description: "Organize and manage all your classes in one place"
    },
    {
      icon: Users,
      title: "Student Tracking", 
      description: "Keep detailed records of student progress and information"
    },
    {
      icon: Calendar,
      title: "Schedule Planning",
      description: "Plan lessons, meetings, and events with an integrated calendar"
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Track attendance, performance, and generate insights"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-6"
          >
            <BookOpen className="w-10 h-10 text-primary-foreground" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-4xl md:text-6xl font-bold text-primary mb-4"
          >
            Classboard
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            The complete classroom management solution for modern educators. 
            Streamline your teaching workflow and focus on what matters most.
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1 + index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          className="bg-white rounded-2xl p-8 mb-12 shadow-sm border"
        >
          <h2 className="text-2xl font-semibold text-center mb-8">Why Choose Classboard?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              "Save 5+ hours weekly on administrative tasks",
              "Improve student engagement and tracking", 
              "Generate detailed reports and insights"
            ].map((benefit, index) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 1.6 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-muted-foreground">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.8 }}
          className="text-center"
        >
          <Button 
            size="lg" 
            onClick={onGetStarted}
            className="px-8 py-3 text-lg font-medium"
          >
            Get Started
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Start managing your classroom more effectively today
          </p>
        </motion.div>
      </div>
    </div>
  )
}