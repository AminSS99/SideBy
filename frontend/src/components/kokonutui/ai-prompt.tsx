"use client";

/**
 * @author: @kokonutui (SideBy Obsidian Edition)
 * @description: Editorial AI prompt bar with warm obsidian glass border, animated focus aura, suggestion chips, and status footer
 * @version: 1.0.0
 * @license: MIT
 */

import React, { useState } from "react";
import { ArrowRight, Loader2, Send, Sparkles } from "@/components/icons";
import { cn } from "@/lib/utils";

export interface AiPromptProps {
  /** Controlled input value. */
  value: string;
  /** Controlled input change handler. */
  onChange: (value: string) => void;
  /** Invoked when the user submits via Enter, button click, or suggestion chip click. */
  onSubmit: (value: string) => void;
  /** Input placeholder text. */
  placeholder?: string;
  /** Accessible label for the submit button. Default: "Send follow-up question". */
  submitAriaLabel?: string;
  /** Optional suggestion chip strings rendered above the prompt bar. */
  suggestions?: string[];
  /** Optional heading label above the suggestion chips. */
  suggestionsLabel?: string;
  /** Optional class applied to each suggestion chip (e.g., for GSAP selectors like "fu-suggestion"). */
  suggestionClassName?: string;
  /** Optional disclaimer / quota / status note rendered in the footer. */
  footerNote?: React.ReactNode;
  /** Optional maximum character count indicator in the footer. */
  maxLength?: number;
  /** Whether a submission is currently in flight. */
  isLoading?: boolean;
  /** Disables the prompt input and submit action. */
  disabled?: boolean;
  /** Optional wrapper class name (e.g., "fu-input"). */
  className?: string;
}

export function AiPrompt({
  value,
  onChange,
  onSubmit,
  placeholder = "Ask a follow-up question...",
  submitAriaLabel = "Send follow-up question",
  suggestions,
  suggestionsLabel,
  suggestionClassName,
  footerNote,
  maxLength,
  isLoading = false,
  disabled = false,
  className,
}: AiPromptProps) {
  const [isFocused, setIsFocused] = useState(false);
  const isBlocked = disabled || isLoading;
  const trimmed = value.trim();

  const triggerSubmit = (query: string) => {
    const clean = query.trim();
    if (!clean || isBlocked) return;
    onSubmit(query);
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    triggerSubmit(value);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {suggestions && suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestionsLabel && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
              {suggestionsLabel}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            {suggestions.map((suggestion, idx) => (
              <button
                key={`${suggestion}-${idx}`}
                type="button"
                disabled={isBlocked}
                onClick={() => triggerSubmit(suggestion)}
                className={cn(
                  "group/chip flex items-center gap-2 rounded-sm border border-[#333] bg-[#0c0b0a] px-4 py-2 text-left text-sm text-[#fdfbf7]/75 transition-all duration-200 hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-orange-300 disabled:cursor-not-allowed disabled:opacity-50",
                  suggestionClassName
                )}
              >
                <span>{suggestion}</span>
                <ArrowRight className="h-3 w-3 shrink-0 opacity-50 transition-transform duration-200 group-hover/chip:translate-x-0.5 group-hover/chip:opacity-90" />
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="relative">
        {/* Warm obsidian focus aura */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -inset-px rounded-sm bg-gradient-to-r from-orange-500/25 via-amber-400/15 to-rose-500/25 opacity-0 blur-md transition-opacity duration-300",
            isFocused && !isBlocked && "opacity-100"
          )}
        />

        <div
          data-focused={isFocused ? "true" : "false"}
          className={cn(
            "relative flex items-end gap-3 rounded-sm border bg-[#0c0b0a]/95 p-2 backdrop-blur-md transition-[border-color,box-shadow] duration-200",
            isFocused
              ? "border-orange-500/55 ring-1 ring-orange-500/45"
              : "border-[#333] hover:border-white/20"
          )}
        >
          <div className="hidden pl-2 pb-3 text-orange-400/60 sm:flex" aria-hidden="true">
            <Sparkles className="h-4 w-4" />
          </div>

          <textarea
            value={value}
            maxLength={maxLength}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                triggerSubmit(value);
              }
            }}
            placeholder={placeholder}
            rows={1}
            disabled={isBlocked}
            className="max-h-32 min-h-[44px] w-full resize-none bg-transparent px-3 py-3 font-serif text-sm text-[#fdfbf7] outline-none placeholder:text-[#fdfbf7]/30 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={!trimmed || isBlocked}
            aria-label={submitAriaLabel}
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-sm bg-[#fdfbf7] text-black transition-all duration-200 hover:bg-orange-400 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#fdfbf7]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>

        {(footerNote || typeof maxLength === "number" || value.length > 0) && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#fdfbf7]/30">
              {footerNote}
            </p>
            <span
              aria-live="polite"
              className="ml-auto font-mono text-[9px] uppercase tracking-widest text-[#fdfbf7]/25 tabular-nums"
            >
              {typeof maxLength === "number"
                ? `${value.length}/${maxLength}`
                : `${value.length} chars`}
            </span>
          </div>
        )}
      </form>
    </div>
  );
}

export default AiPrompt;
