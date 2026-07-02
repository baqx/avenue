import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "navy";

const variants: Record<BadgeVariant, string> = {
  default: "bg-[#f0fdf4] text-[#6a6c6c] border-[#bbbdbd]",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  error:   "bg-red-50 text-red-700 border-red-200",
  info:    "bg-[#ecfdf5] text-[#064e3b] border-[#10b981]/30",
  navy:    "bg-[#022c22] text-white border-[#022c22]",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export function Badge({ variant = "default", children, className, dot = false }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variants[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            variant === "success" ? "bg-emerald-500" :
            variant === "warning" ? "bg-amber-500" :
            variant === "error"   ? "bg-red-500"   :
            variant === "info"    ? "bg-[#10b981]" :
            variant === "navy"    ? "bg-white"      : "bg-[#bbbdbd]"
          )}
        />
      )}
      {children}
    </span>
  );
}
