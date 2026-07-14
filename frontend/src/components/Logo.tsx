import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  alt?: string;
}

export const Logo = ({ className, alt = "SideBy" }: LogoProps) => (
  <img
    src="/icon.svg"
    alt={alt}
    className={cn("object-contain", className)}
    loading="eager"
    decoding="async"
  />
);

export default Logo;
