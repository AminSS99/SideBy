export const panelClass = "rounded-2xl border border-white/[0.09] bg-[#0d0b0a]/90 shadow-[0_20px_70px_rgba(0,0,0,.24)] backdrop-blur-xl";

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
