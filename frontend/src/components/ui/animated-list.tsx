"use client";

import { Children, type ComponentPropsWithoutRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/** Animated List adapted from Magic UI. All content stays mounted and accessible immediately. */
export function AnimatedList({ children, className, delay = 90, ...props }:
  ComponentPropsWithoutRef<"div"> & { delay?: number }) {
  const reduced = useReducedMotion();
  return <div className={cn("flex flex-col gap-3", className)} {...props}>
    {Children.toArray(children).map((child, index) => (
      <motion.div key={typeof child === "object" && child !== null && "key" in child ? child.key ?? index : index}
        className="min-w-0" initial={false}
        whileInView={reduced ? { opacity: 1, y: 0 } : { y: [8, 0], opacity: [.65, 1] }}
        style={{ opacity: 1 }}
        viewport={{ once: true, amount: .1 }}
        transition={{ duration: reduced ? 0 : .35, delay: reduced ? 0 : Math.min(index * delay / 1000, .45), ease: [.22, 1, .36, 1] }}>
        {child}
      </motion.div>
    ))}
  </div>;
}
