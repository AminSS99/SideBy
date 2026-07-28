import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  alt?: string;
}

export const Logo = ({ className, alt = "SideBy" }: LogoProps) => (
  <img
    src="/sideby.ico?v=20260728-real"
    alt={alt}
    className={cn("object-contain", className)}
    loading="eager"
    decoding="async"
  />
);

export default Logo;
