import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Maximize, Minimize, Pause, Play, RotateCcw, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

const videoPlayerVariants = cva("group relative w-full overflow-hidden rounded-2xl bg-black", {
  variants: { size: { sm: "max-w-md", default: "max-w-2xl", lg: "max-w-4xl", full: "w-full" } },
  defaultVariants: { size: "default" },
});

export interface VideoPlayerProps extends React.VideoHTMLAttributes<HTMLVideoElement>, VariantProps<typeof videoPlayerVariants> {
  src: string;
  showControls?: boolean;
  autoHide?: boolean;
  label?: string;
}

const formatTime = (seconds: number) => {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
};

/** Custom controls follow native media events, including external pause/fullscreen changes. */
const VideoPlayer = React.forwardRef<HTMLVideoElement, VideoPlayerProps>(function VideoPlayer(
  { className, size, src, poster, showControls = true, autoHide = true, label = "Video player", children, ...props }, ref,
) {
  const video = React.useRef<HTMLVideoElement>(null);
  const container = React.useRef<HTMLDivElement>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout>>();
  const [playing, setPlaying] = React.useState(false);
  const [ended, setEnded] = React.useState(false);
  const [current, setCurrent] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(1);
  const [muted, setMuted] = React.useState(props.muted ?? false);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [visible, setVisible] = React.useState(true);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  React.useImperativeHandle(ref, () => video.current!, []);

  const reveal = React.useCallback(() => {
    setVisible(true);
    clearTimeout(timer.current);
    if (playing && autoHide) timer.current = setTimeout(() => {
      if (!container.current?.contains(document.activeElement)) setVisible(false);
    }, 3000);
  }, [playing, autoHide]);

  React.useEffect(() => { reveal(); return () => clearTimeout(timer.current); }, [reveal]);
  React.useEffect(() => {
    const update = () => setFullscreen(document.fullscreenElement === container.current);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  const togglePlay = async () => {
    const el = video.current;
    if (!el) return;
    setNotice("");
    if (!el.paused) el.pause();
    else {
      if (el.ended) el.currentTime = 0;
      try { await el.play(); } catch { setNotice("Playback could not start. Press play to try again."); }
    }
    reveal();
  };
  const seek = (value: number) => {
    if (video.current && duration > 0) video.current.currentTime = Math.max(0, Math.min(duration, value));
    reveal();
  };
  const changeVolume = (value: number) => {
    if (!video.current) return;
    video.current.volume = Math.max(0, Math.min(1, value));
    video.current.muted = value === 0;
    reveal();
  };
  const toggleMute = () => { if (video.current) video.current.muted = !video.current.muted; reveal(); };
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement === container.current) await document.exitFullscreen();
      else if (container.current?.requestFullscreen) await container.current.requestFullscreen();
      else {
        const iosVideo = video.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
        if (iosVideo?.webkitEnterFullscreen) iosVideo.webkitEnterFullscreen();
        else setNotice("Fullscreen is unavailable in this browser.");
      }
    } catch { setNotice("Fullscreen is unavailable in this browser."); }
    reveal();
  };
  const buttonClass = "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300";
  const rangeClass = "h-5 min-w-0 cursor-pointer accent-orange-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-300 disabled:cursor-default";

  return <div ref={container} role="group" aria-label={label} tabIndex={0}
    className={cn(videoPlayerVariants({ size }), "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 [&:fullscreen]:flex [&:fullscreen]:items-center [&:fullscreen]:justify-center [&:fullscreen]:rounded-none", className)}
    onPointerMove={reveal} onPointerDown={reveal} onFocus={reveal}
    onKeyDown={(event) => {
      if (event.target instanceof HTMLInputElement || event.altKey || event.metaKey || event.ctrlKey) return;
      // Let focused buttons keep their native Space/Enter activation.
      if (event.target instanceof HTMLButtonElement && (event.key === " " || event.key === "Enter")) return;
      const action: Record<string, () => void> = {
        " ": () => void togglePlay(), k: () => void togglePlay(), m: toggleMute,
        f: () => void toggleFullscreen(), ArrowLeft: () => seek((video.current?.currentTime ?? 0) - 10),
        ArrowRight: () => seek((video.current?.currentTime ?? 0) + 10),
        ArrowUp: () => changeVolume((video.current?.volume ?? 1) + 0.1),
        ArrowDown: () => changeVolume((video.current?.volume ?? 1) - 0.1),
      };
      if (action[event.key]) { event.preventDefault(); action[event.key](); }
    }}>
    <video {...props} ref={video} src={src} poster={poster} controls={false}
      className="h-full w-full object-contain" onClick={() => void togglePlay()}
      onLoadedMetadata={(event) => { const value = event.currentTarget.duration; setDuration(Number.isFinite(value) ? value : 0); props.onLoadedMetadata?.(event); }}
      onTimeUpdate={(event) => { setCurrent(event.currentTarget.currentTime); props.onTimeUpdate?.(event); }}
      onPlay={(event) => { setPlaying(true); setEnded(false); setError(""); props.onPlay?.(event); }}
      onPause={(event) => { setPlaying(false); props.onPause?.(event); }}
      onEnded={(event) => { setPlaying(false); setEnded(true); props.onEnded?.(event); }}
      onVolumeChange={(event) => { setVolume(event.currentTarget.volume); setMuted(event.currentTarget.muted); props.onVolumeChange?.(event); }}
      onError={(event) => { setError("The video couldn't load."); setPlaying(false); props.onError?.(event); }}>
      {children}
    </video>
    {showControls && !error && <>
      {!playing && <button type="button" aria-label={ended ? "Replay video" : "Play video"} onClick={() => void togglePlay()}
        className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-black/65 text-white shadow-xl backdrop-blur-sm transition-colors hover:bg-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 sm:h-20 sm:w-20">
        {ended ? <RotateCcw className="h-6 w-6"/> : <Play className="ml-1 h-7 w-7"/>}
      </button>}
      <div className={cn("absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent px-3 pb-2 pt-8 text-white transition-opacity motion-reduce:transition-none sm:px-4", visible || !playing ? "opacity-100" : "pointer-events-none opacity-0")}>
        <div className="flex items-center gap-3 text-[11px] tabular-nums">
          <span>{formatTime(current)}</span>
          <input aria-label="Seek video" className={cn(rangeClass, "flex-1")} type="range" min={0} max={duration || 0} step={0.1} value={Math.min(current, duration)} disabled={!duration} onChange={(event) => seek(Number(event.target.value))}/>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center">
            <button type="button" aria-label={playing ? "Pause video" : ended ? "Replay video" : "Play video"} title="Play / pause (K)" onClick={() => void togglePlay()} className={buttonClass}>{playing ? <Pause size={18}/> : <Play size={18}/>}</button>
            <button type="button" aria-label="Skip back 10 seconds" onClick={() => seek(current - 10)} className={buttonClass}><SkipBack size={17}/></button>
            <button type="button" aria-label="Skip forward 10 seconds" onClick={() => seek(current + 10)} className={buttonClass}><SkipForward size={17}/></button>
            <button type="button" aria-label={muted || volume === 0 ? "Unmute video" : "Mute video"} title="Mute (M)" onClick={toggleMute} className={buttonClass}>{muted || volume === 0 ? <VolumeX size={18}/> : <Volume2 size={18}/>}</button>
            <input aria-label="Video volume" type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={(event) => changeVolume(Number(event.target.value))} className={cn(rangeClass, "hidden w-16 sm:block")}/>
          </div>
          <button type="button" aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"} title="Fullscreen (F)" onClick={() => void toggleFullscreen()} className={buttonClass}>{fullscreen ? <Minimize size={18}/> : <Maximize size={18}/>}</button>
        </div>
      </div>
    </>}
    {(error || notice) && <div role="status" className="absolute inset-x-3 top-3 rounded-lg bg-black/90 p-3 text-center text-sm text-white">{error || notice} {error && <a href={src} className="underline underline-offset-4">Open video</a>}</div>}
  </div>;
});

// eslint-disable-next-line react-refresh/only-export-components -- CVA variants are part of the supplied reusable player API.
export { VideoPlayer, videoPlayerVariants };
