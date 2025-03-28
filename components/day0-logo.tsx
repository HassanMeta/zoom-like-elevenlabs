import { cn } from "@/lib/utils"

interface Day0LogoProps {
  className?: string
  showText?: boolean
}

export function Day0Logo({ className, showText = true }: Day0LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold shadow-sm">
        D0
      </div>
      {showText && <span className="font-semibold text-xl tracking-tight">Day0 Recruit</span>}
    </div>
  )
}

