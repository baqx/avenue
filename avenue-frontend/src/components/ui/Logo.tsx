import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "dark" | "light" | "accent";
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { text: "text-lg", dot: "w-2 h-2" },
  md: { text: "text-2xl", dot: "w-2.5 h-2.5" },
  lg: { text: "text-4xl", dot: "w-3.5 h-3.5" },
};

export function Logo({ className, variant = "dark", size = "md" }: LogoProps) {
  const colors = {
    dark:   { text: "text-[#022c22]",  dot: "bg-[#10b981]" },
    light:  { text: "text-white",       dot: "bg-[#10b981]" },
    accent: { text: "text-[#10b981]",  dot: "bg-[#022c22]" },
  }[variant];

  return (
    <span className={cn("inline-flex items-center gap-1.5 font-semibold tracking-tight select-none", sizes[size].text, colors.text, className)}>
      <span className={cn("rounded-full", sizes[size].dot, colors.dot)} />
      avenue
    </span>
  );
}
