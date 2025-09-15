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
      <div className="max-w-4xl w-full animate-fade-in">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-6 animate-scale-bounce">
            <BookOpen className="w-10 h-10 text-primary-foreground" />
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-primary mb-4 animate-slide-up-delay-1">
            Classboard
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up-delay-2">
            The complete classroom management solution for modern educators.
            Streamline your teaching workflow and focus on what matters most.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`animate-slide-up-delay-${3 + index} hover:translate-y-[-4px] transition-transform duration-200`}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-200">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-2xl p-8 mb-12 shadow-sm border animate-slide-up-delay-7">
          <h2 className="text-2xl font-semibold text-center mb-8">
            Why Choose Classboard?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              "Save 5+ hours weekly on administrative tasks",
              "Improve student engagement and tracking",
              "Generate detailed reports and insights"
            ].map((benefit, index) => (
              <div
                key={benefit}
                className={`flex items-center gap-3 animate-slide-in-delay-${8 + index}`}
              >
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-muted-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center animate-slide-up-delay-11">
          <Button
            size="lg"
            onClick={onGetStarted}
            className="px-8 py-3 text-lg font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            Get Started
          </Button>
          <p className="text-sm text-muted-foreground mt-4 animate-fade-in-delay-12">
            Start managing your classroom more effectively today
          </p>
        </div>
      </div>

      <style>{`
        @keyframes launch-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes launch-slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes launch-slide-in {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes launch-scale-bounce {
          from { opacity: 0; transform: scale(0.8) rotate(-10deg); }
          to { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        
        .animate-fade-in { animation: launch-fade-in 0.8s ease-out; }
        .animate-scale-bounce { animation: launch-scale-bounce 0.6s ease-out 0.2s both; }
        .animate-slide-up-delay-1 { animation: launch-slide-up 0.8s ease-out 0.5s both; }
        .animate-slide-up-delay-2 { animation: launch-slide-up 0.6s ease-out 0.7s both; }
        .animate-slide-up-delay-3 { animation: launch-slide-up 0.5s ease-out 0.9s both; }
        .animate-slide-up-delay-4 { animation: launch-slide-up 0.5s ease-out 1.05s both; }
        .animate-slide-up-delay-5 { animation: launch-slide-up 0.5s ease-out 1.2s both; }
        .animate-slide-up-delay-6 { animation: launch-slide-up 0.5s ease-out 1.35s both; }
        .animate-slide-up-delay-7 { animation: launch-slide-up 0.6s ease-out 1.5s both; }
        .animate-slide-in-delay-8 { animation: launch-slide-in 0.4s ease-out 1.9s both; }
        .animate-slide-in-delay-9 { animation: launch-slide-in 0.4s ease-out 2.0s both; }
        .animate-slide-in-delay-10 { animation: launch-slide-in 0.4s ease-out 2.1s both; }
        .animate-slide-up-delay-11 { animation: launch-slide-up 0.6s ease-out 2.3s both; }
        .animate-fade-in-delay-12 { animation: launch-fade-in 0.3s ease-out 2.5s both; }
      `}</style>
    </div>
  )
}