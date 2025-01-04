import { cn } from "@/app/lib/utils"
import { ButtonHTMLAttributes, forwardRef } from "react"

interface ToolbarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

export const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  ({ className, active, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "p-2 hover:bg-gray-100/10 rounded-lg transition-colors",
          active && "bg-gray-100/10",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
ToolbarButton.displayName = "ToolbarButton"

