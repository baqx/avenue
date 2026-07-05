import React from "react";
import { cn } from "@/lib/utils";

export function SnapScroll({ children, className }: { children: React.ReactNode, className?: string }) {
  // Flatten fragments if any are passed
  const flatChildren = React.Children.toArray(children).flatMap((child: any) => {
    if (child.type === React.Fragment) {
      return React.Children.toArray(child.props.children);
    }
    return child;
  });

  return (
    <div className={cn(
      "flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
      "md:grid md:grid-cols-3 md:gap-6 md:pb-0 md:mx-0 md:px-0 md:overflow-visible md:snap-none md:flex-none",
      className
    )}>
      {flatChildren.map((child, idx) => (
        <div key={idx} className="snap-start shrink-0 w-[85vw] max-w-[320px] md:w-auto md:max-w-none">
          {child}
        </div>
      ))}
    </div>
  );
}
