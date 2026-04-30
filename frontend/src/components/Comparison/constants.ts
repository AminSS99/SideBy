export const panelClass = "border border-[#2a2a2a] bg-[#0c0b0a] rounded-sm";

export const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.4, ease: "easeOut" },
};

export const stagger = (index: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay: index * 0.06, ease: "easeOut" },
});