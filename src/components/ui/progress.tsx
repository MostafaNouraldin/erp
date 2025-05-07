
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => {
  const [dir, setDir] = React.useState<"ltr" | "rtl">("ltr");

  React.useEffect(() => {
    // Ensure this runs only on the client
    const currentDir = document.documentElement.dir as "ltr" | "rtl" || "ltr";
    setDir(currentDir);
  }, []);

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      // Pass dir attribute for clarity, though transform logic is custom.
      // dir={dir} 
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: dir === "rtl" ? `translateX(${100 - (value || 0)}%)` : `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }

