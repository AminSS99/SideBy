import React from "react";

export const SnapsolveFloatingWidget = () => {
  return (
    <a
      href="https://snapsolve.ink"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="SideBy is part of the SnapSolve ecosystem"
      draggable={false}
      onDragStart={(event) => event.preventDefault()}
      className="group inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-[10px] font-semibold uppercase leading-none tracking-[0.14em] text-white/45 transition-colors hover:border-red-400/25 hover:bg-red-500/[0.06] hover:text-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70"
    >
      <span className="grid size-5 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-[0_0_0_1px_rgba(255,255,255,0.18)]">
        <img
          src="/snapsolve-icon.png"
          alt=""
          aria-hidden="true"
          draggable={false}
          className="size-full object-cover"
        />
      </span>
      <span>Part of SnapSolve</span>
    </a>
  );
};
