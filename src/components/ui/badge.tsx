import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-zinc-800 text-zinc-300 border border-zinc-700/50",
        blue: "bg-blue-900/40 text-blue-300 border border-blue-700/50",
        purple: "bg-purple-900/40 text-purple-300 border border-purple-700/50",
        green: "bg-emerald-900/40 text-emerald-300 border border-emerald-700/50",
        orange: "bg-orange-900/40 text-orange-300 border border-orange-700/50",
        red: "bg-red-900/40 text-red-300 border border-red-700/50",
        yellow: "bg-yellow-900/40 text-yellow-300 border border-yellow-700/50",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
