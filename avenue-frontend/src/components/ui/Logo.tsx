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
  // Since we are using an image logo now, the variant color overrides might not apply perfectly 
  // but we will apply the size classes and a potential brightness/invert for dark mode if needed.
  // For now, we will just use the logo.png.

  return (
    <img 
      src="/logo.png" 
      alt="Avenue Logo" 
      className={cn("select-none object-contain w-auto max-w-full", {
        "h-6": size === "sm",
        "h-8": size === "md",
        "h-12": size === "lg"
      }, className)} 
    />
  );
}
