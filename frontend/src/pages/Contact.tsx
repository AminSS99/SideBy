import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowRight, Check, LifeBuoy, Mail, MessagesSquare, Sparkles } from "lucide-react";
import { BrandFooter } from "@/components/brand/BrandFooter";
import { MarketingNav } from "@/components/brand/MarketingNav";
import { usePageTitle } from "@/hooks/usePageTitle";

type ContactIntent = "product" | "beta" | "support";
type FormState = { name: string; email: string; message: string };
type FormErrors = Partial<Record<keyof FormState, string>>;

const intents: { id: ContactIntent; label: string; description: string }[] = [
  { id: "product", label: "Product question", description: "How SideBy works or whether it fits your decision workflow." },
  { id: "beta", label: "Beta & teams", description: "Private beta access, team use, and plan questions." },
  { id: "support", label: "Support", description: "Help with an account, comparison run, export, or usage limit." },
];

const Contact = () => {
  usePageTitle("Contact");
  const [searchParams] = useSearchParams();
  const pageRef = useRef<HTMLDivElement>(null);
  const [intent, setIntent] = useState<ContactIntent>(searchParams.get("plan") === "team" ? "beta" : "product");
  const [form, setForm] = useState<FormState>({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<FormErrors>({});

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(".contact-reveal", { y: 30, duration: 0.75, stagger: 0.1, ease: "power3.out", clearProps: "transform" });
    },
    { scope: pageRef },
  );

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: FormErrors = {};
    if (form.name.trim().length < 2) nextErrors.name = "Please enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = "Enter a valid email address.";
    if (form.message.trim().length < 12) nextErrors.message = "Tell us a little more so we can route your note.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const selectedIntent = intents.find((item) => item.id === intent)?.label ?? "Product question";
    const recipient = intent === "beta" ? "sales@sideby.ink" : "support@sideby.ink";
    const subject = encodeURIComponent(`[SideBy ${selectedIntent}] ${form.name.trim()}`);
    const body = encodeURIComponent(`${form.message.trim()}\n\nFrom: ${form.name.trim()} <${form.email.trim()}>`);
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
  };

  const fieldClass = (hasError: boolean) => `min-h-12 w-full rounded-xl border bg-black/25 px-4 text-[16px] text-white outline-none transition placeholder:text-white/25 focus:ring-4 ${hasError ? "border-rose-400/70 focus:border-rose-300 focus:ring-rose-500/10" : "border-white/10 focus:border-orange-300/50 focus:ring-orange-500/10"}`;

  return (
    <div ref={pageRef} className="min-h-screen overflow-hidden bg-[#060504] text-[#fdfbf7] selection:bg-orange-500/30">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(249,115,22,0.16),transparent_33%),radial-gradient(circle_at_0%_55%,rgba(139,92,246,0.09),transparent_35%),linear-gradient(rgba(255,255,255,0.022)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.022)_1px,transparent_1px)] bg-[size:auto,auto,52px_52px,52px_52px]" />
      <MarketingNav />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-24 pt-10 sm:px-6 sm:pt-16 lg:px-8">
        <section className="contact-reveal mb-9 max-w-4xl sm:mb-12">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-200">
            <MessagesSquare className="h-3.5 w-3.5" /> Talk to a human
          </div>
          <h1 className="font-serif text-[2.75rem] leading-[0.96] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
            Tell us where your <span className="bg-gradient-to-r from-orange-200 via-amber-100 to-rose-200 bg-clip-text text-transparent">decision got stuck.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/58 sm:text-lg">
            Product fit, beta access, or a comparison that needs attention—we’ll route your note to the right SideBy inbox.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.35fr] lg:items-start">
          <aside className="contact-reveal space-y-4 lg:sticky lg:top-24">
            <a href="mailto:support@sideby.ink" className="group flex min-h-[108px] items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-orange-300/25 hover:bg-white/[0.055] focus:outline-none focus:ring-2 focus:ring-orange-300">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-orange-300/20 bg-orange-400/10 text-orange-200"><LifeBuoy className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-white">Product & support</span>
                <span className="mt-1 block break-all text-sm text-white/48">support@sideby.ink</span>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-orange-200">Open email <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
              </span>
            </a>
            <a href="mailto:sales@sideby.ink" className="group flex min-h-[108px] items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-violet-300/25 hover:bg-white/[0.055] focus:outline-none focus:ring-2 focus:ring-violet-300">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-400/10 text-violet-200"><Sparkles className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-white">Beta & teams</span>
                <span className="mt-1 block break-all text-sm text-white/48">sales@sideby.ink</span>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-violet-200">Open email <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
              </span>
            </a>
            <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.055] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-100"><Check className="h-4 w-4" /> What helps us help you</div>
              <p className="mt-2 text-sm leading-6 text-white/48">Include the comparison title, what you expected, and what happened. Please leave passwords and API keys out.</p>
            </div>
          </aside>

          <section className="contact-reveal overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] shadow-2xl shadow-orange-950/20">
            <div className="border-b border-white/10 px-5 py-6 sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-200/70">Start a conversation</p>
              <h2 className="mt-2 font-serif text-3xl text-white">What can we help with?</h2>
            </div>
            <form onSubmit={handleSubmit} noValidate className="space-y-6 p-5 sm:p-8">
              <fieldset>
                <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Choose a route</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {intents.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIntent(item.id)}
                      aria-pressed={intent === item.id}
                      className={`min-h-[82px] rounded-xl border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-orange-300 ${intent === item.id ? "border-orange-300/40 bg-orange-400/12" : "border-white/10 bg-black/15 hover:border-white/20"}`}
                    >
                      <span className={`block text-sm font-semibold ${intent === item.id ? "text-orange-100" : "text-white"}`}>{item.label}</span>
                      <span className="mt-1 block text-[11px] leading-4 text-white/40">{item.description}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className="mb-2 block text-xs font-semibold text-white/55">Your name</label>
                  <input id="contact-name" value={form.name} onChange={(event) => updateField("name", event.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "contact-name-error" : undefined} autoComplete="name" placeholder="Ada Lovelace" className={fieldClass(Boolean(errors.name))} />
                  {errors.name && <p id="contact-name-error" className="mt-2 text-xs text-rose-300">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="contact-email" className="mb-2 block text-xs font-semibold text-white/55">Email</label>
                  <input id="contact-email" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "contact-email-error" : undefined} autoComplete="email" inputMode="email" placeholder="ada@company.com" className={fieldClass(Boolean(errors.email))} />
                  {errors.email && <p id="contact-email-error" className="mt-2 text-xs text-rose-300">{errors.email}</p>}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="contact-message" className="text-xs font-semibold text-white/55">Your message</label>
                  <span className="text-[11px] text-white/30">No secrets or API keys</span>
                </div>
                <textarea id="contact-message" value={form.message} onChange={(event) => updateField("message", event.target.value)} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "contact-message-error" : "contact-message-hint"} rows={6} placeholder="I’m comparing… and I need help with…" className={`${fieldClass(Boolean(errors.message))} resize-y py-3`} />
                {errors.message ? <p id="contact-message-error" className="mt-2 text-xs text-rose-300">{errors.message}</p> : <p id="contact-message-hint" className="mt-2 text-xs leading-5 text-white/32">Submitting opens your default email app with the note pre-filled, so nothing disappears into a fake form.</p>}
              </div>

              <button type="submit" className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-200 via-amber-100 to-orange-200 px-6 text-sm font-bold text-[#1a0e07] shadow-lg shadow-orange-900/20 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 focus:ring-offset-[#15110e]">
                Continue in email <Mail className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <p className="text-center text-[11px] leading-5 text-white/30">Prefer to browse first? <Link to="/docs" className="text-white/55 underline decoration-white/20 underline-offset-4 hover:text-white">Visit the SideBy field guide.</Link></p>
            </form>
          </section>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-black/20 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <BrandFooter />
          <div className="flex gap-6">
            <Link to="/legal/privacy" className="text-[10px] font-bold uppercase tracking-widest text-white/40 transition hover:text-white">Privacy</Link>
            <Link to="/legal/terms" className="text-[10px] font-bold uppercase tracking-widest text-white/40 transition hover:text-white">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
