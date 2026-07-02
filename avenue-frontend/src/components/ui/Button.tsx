import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: boolean;
  asChild?: boolean;
  href?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#022c22] text-white hover:bg-[#064e3b] active:scale-[0.98] shadow-sm",
  secondary:
    "bg-[#10b981] text-[#022c22] hover:bg-[#059669] active:scale-[0.98] font-semibold",
  ghost:
    "bg-transparent text-[#022c22] hover:bg-[#f0fdf4] active:scale-[0.98]",
  outline:
    "bg-transparent border border-[#bbbdbd] text-[#022c22] hover:border-[#022c22] hover:bg-[#f7f9fb] active:scale-[0.98]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm:  "px-3.5 py-1.5 text-sm gap-1.5",
  md:  "px-5 py-2.5 text-sm gap-2",
  lg:  "px-7 py-3.5 text-base gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  icon = false,
  className,
  children,
  href,
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 whitespace-nowrap cursor-pointer select-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981] focus-visible:ring-offset-2",
    variantStyles[variant],
    sizeStyles[size],
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
        {icon && <ArrowRight weight="bold" className="shrink-0" />}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
      {icon && <ArrowRight weight="bold" className="shrink-0" />}
    </button>
  );
}
