import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Bell, LineChart, Target, Zap, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Ranking Tracker
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Track your brand's visibility across AI platforms like ChatGPT, Claude, Gemini, and Perplexity
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-6"
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-login"
          >
            Get Started - Login Free
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 mb-2 text-blue-600" />
              <CardTitle>AI Platform Tracking</CardTitle>
              <CardDescription>
                Monitor your brand mentions across all major AI platforms in real-time
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Bell className="h-8 w-8 mb-2 text-purple-600" />
              <CardTitle>Smart Alerts</CardTitle>
              <CardDescription>
                Get notified instantly when your ranking changes or competitors appear
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <LineChart className="h-8 w-8 mb-2 text-green-600" />
              <CardTitle>Trend Analysis</CardTitle>
              <CardDescription>
                Understand your visibility trends with detailed analytics and insights
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Target className="h-8 w-8 mb-2 text-orange-600" />
              <CardTitle>Keyword Tracking</CardTitle>
              <CardDescription>
                Track specific keywords and see how your brand performs in AI responses
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 mb-2 text-yellow-600" />
              <CardTitle>Multi-Brand Support</CardTitle>
              <CardDescription>
                Manage and track multiple brands from a single dashboard
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 mb-2 text-red-600" />
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                Your data is encrypted and secure with industry-standard protection
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-4">Ready to Track Your AI Visibility?</CardTitle>
            <CardDescription className="text-white/90 text-lg mb-6">
              Join thousands of brands monitoring their presence in AI platforms
            </CardDescription>
            <div>
              <Button 
                size="lg" 
                variant="secondary"
                className="text-lg px-8 py-6"
                onClick={() => window.location.href = '/api/login'}
                data-testid="button-login-cta"
              >
                Start Tracking Now
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2025 AI Ranking Tracker. Track your brand's AI visibility.</p>
        </div>
      </footer>
    </div>
  );
}
