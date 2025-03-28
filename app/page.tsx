import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight, Briefcase, Cpu, MessageSquare } from "lucide-react"
import { Day0Logo } from "@/components/day0-logo"

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md shadow-lg border-opacity-50">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-6">
            <Day0Logo className="scale-125" />
          </div>
          <CardTitle className="text-center text-2xl">AI Recruitment Assistant</CardTitle>
          <CardDescription className="text-center">
            Streamline your candidate interviews with our AI-powered recruitment assistant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium text-lg mb-3">Enterprise Features:</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="mr-3 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <span className="font-medium block text-sm">Structured Interviews</span>
                  <span className="text-xs text-muted-foreground">Consistent candidate evaluation process</span>
                </div>
              </li>
              <li className="flex items-start">
                <div className="mr-3 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Cpu className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <span className="font-medium block text-sm">AI-Powered Analysis</span>
                  <span className="text-xs text-muted-foreground">Objective skill assessment and insights</span>
                </div>
              </li>
              <li className="flex items-start">
                <div className="mr-3 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <span className="font-medium block text-sm">Detailed Transcripts</span>
                  <span className="text-xs text-muted-foreground">Complete record of every interview</span>
                </div>
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/onboarding">
              Start Interview <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

