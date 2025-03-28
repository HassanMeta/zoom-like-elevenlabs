import { OnboardingForm } from "@/components/onboarding-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Day0Logo } from "@/components/day0-logo"

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-secondary/20 p-4">
      <Card className="w-full max-w-2xl shadow-lg border-opacity-50">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <Day0Logo />
          </div>
          <CardTitle className="text-xl">Interview Setup</CardTitle>
          <CardDescription>
            Please provide the candidate and job information to prepare the AI-powered interview.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm />
        </CardContent>
      </Card>
    </div>
  )
}

