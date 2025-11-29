import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-bg-surface-hover dark:bg-border-subtle", className)}
      {...props}
    />
  )
}

export { Skeleton }
