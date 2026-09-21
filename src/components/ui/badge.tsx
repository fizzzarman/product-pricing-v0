import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border-transparent",
        secondary: "bg-secondary text-secondary-foreground border-transparent",
        outline: "text-foreground border-border",
        destructive: "bg-destructive text-white border-transparent",
        success: "bg-success/15 text-success border-success/30 dark:text-green-400",
        warning: "bg-warning/15 text-warning border-warning/30 dark:text-amber-400",
        muted: "bg-muted text-muted-foreground border-transparent",
        info: "bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant, className }))} {...props} />
  );
}

export { Badge, badgeVariants };
