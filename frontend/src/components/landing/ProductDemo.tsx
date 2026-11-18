import { useEffect, useRef, useState } from "react";
import { VideoPlayer } from "@/components/ui/video-player";
import { useT } from "@/i18n";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Hero film: autoplays muted and looped so visitors see the product at once.
 * Picks the recomposed vertical cut on phones, pauses off-screen, and never
 * autoplays for visitors who prefer reduced motion.
 */
export function ProductDemo() {
  const t = useT();
  const [portrait, setPortrait] = useState(() => window.matchMedia("(max-width: 639px)").matches);
  const [started, setStarted] = useState(false);
  const [autoPlay] = useState(() => !reducedMotion());
  const video = useRef<HTMLVideoElement>(null);
  const onScreen = useRef(true);
  const userPaused = useRef(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => { if (!started) setPortrait(media.matches); };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [started]);

  // Save battery and data: pause when scrolled away, resume unless the visitor paused it.
  useEffect(() => {
    const el = video.current;
    if (!el || !autoPlay) return;
    const observer = new IntersectionObserver(([entry]) => {
      onScreen.current = entry.isIntersecting;
      if (!entry.isIntersecting) el.pause();
      else if (!userPaused.current) void el.play().catch(() => undefined);
    }, { threshold: 0.35 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [autoPlay, portrait]);

  return <figure className="mx-auto w-full max-w-md sm:max-w-none" aria-labelledby="product-demo-title">
    <div className="mb-3 flex items-center justify-between gap-3 px-1">
      <h2 id="product-demo-title" className="text-sm font-medium text-[#fffaf1]">{t("mkt.demo.title")}</h2>
      <span className="shrink-0 text-xs text-white/60">{t("mkt.demo.tour")}</span>
    </div>
    <VideoPlayer ref={video} key={portrait ? "portrait" : "wide"} size="full" label={t("mkt.demo.videoLabel")}
      src={portrait ? "/media/sideby-demo-mobile.mp4?v=3" : "/media/sideby-demo-wide.mp4?v=3"}
      poster={portrait ? "/media/sideby-poster-mobile.jpg?v=3" : "/media/sideby-poster-wide.jpg?v=3"}
      autoPlay={autoPlay} loop muted playsInline preload="metadata"
      onPlay={() => { setStarted(true); userPaused.current = false; }}
      onPause={() => { if (onScreen.current) userPaused.current = true; }}
      className="aspect-[9/16] border border-orange-200/20 shadow-[0_30px_100px_rgba(0,0,0,.45)] sm:aspect-video">
      <track kind="captions" src="/media/sideby-demo.ru.vtt?v=3" srcLang="ru" label="Русский"/>
      <track kind="captions" src="/media/sideby-demo.en.vtt?v=3" srcLang="en" label="English"/>
    </VideoPlayer>
    <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1 text-[11px] leading-5 text-white/60">
      <span>{t("mkt.demo.caption")}</span>
      <a href="#start-comparing" className="inline-flex min-h-11 items-center text-orange-200 underline decoration-orange-200/30 underline-offset-4 hover:text-orange-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-300">{t("mkt.demo.ownLink")}</a>
    </figcaption>
  </figure>;
}
