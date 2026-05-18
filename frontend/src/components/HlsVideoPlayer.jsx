import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2 } from 'lucide-react';

function fmt(s) {
  if (!s || isNaN(s)) return '0:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`;
}

export default function HlsVideoPlayer({ qualities, defaultQuality = '720p' }) {
  const videoRef      = useRef(null);
  const containerRef  = useRef(null);
  const hlsRef        = useRef(null);
  const hideTimerRef  = useRef(null);

  const available = useMemo(
    () => ['1080p', '720p', '480p'].filter((q) => qualities?.[q]),
    [qualities]
  );

  const [activeQ, setActiveQ] = useState(
    () => (available.includes(defaultQuality) ? defaultQuality : available[0] ?? '720p')
  );
  const [isPlaying,       setIsPlaying]       = useState(false);
  const [currentTime,     setCurrentTime]     = useState(0);
  const [duration,        setDuration]        = useState(0);
  const [volume,          setVolume]          = useState(1);
  const [isMuted,         setIsMuted]         = useState(false);
  const [isLoading,       setIsLoading]       = useState(true);
  const [isBuffering,     setIsBuffering]     = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen,    setIsFullscreen]    = useState(false);
  const [showQMenu,       setShowQMenu]       = useState(false);

  // ── Load / reload source, preserving playback position ──────────────────
  useEffect(() => {
    const video = videoRef.current;
    const src   = qualities?.[activeQ];
    if (!video || !src) return;

    const savedTime  = video.readyState >= 1 ? video.currentTime : 0;
    const wasPlaying = !video.paused && video.readyState >= 1;

    setIsLoading(true);

    // Tear down previous HLS instance
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    if (src.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({ startPosition: savedTime });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (wasPlaying) video.play().catch(() => {});
      });
    } else {
      // Plain MP4 or native HLS (Safari)
      video.src = src;
      const resume = () => {
        if (savedTime > 0) video.currentTime = savedTime;
        if (wasPlaying) video.play().catch(() => {});
      };
      video.addEventListener('loadedmetadata', resume, { once: true });
    }

    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [activeQ, qualities]);

  // ── Fullscreen change detection ──────────────────────────────────────────
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // ── Controls auto-hide ────────────────────────────────────────────────────
  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setControlsVisible(false);
        setShowQMenu(false);
      }
    }, 3000);
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !v.muted;
    v.muted = next;
    setIsMuted(next);
    if (!next && volume === 0) { v.volume = 0.7; setVolume(0.7); }
  };

  const handleSeek = (e) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = parseFloat(e.target.value);
    setCurrentTime(parseFloat(e.target.value));
  };

  const handleVolume = (e) => {
    const v   = videoRef.current;
    const val = parseFloat(e.target.value);
    if (!v) return;
    v.volume = val;
    v.muted  = val === 0;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const switchQuality = (q) => {
    setActiveQ(q);
    setShowQMenu(false);
  };

  const seekPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volPct  = isMuted ? 0 : volume * 100;
  const busy    = isLoading || isBuffering;

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black overflow-hidden"
      style={{ aspectRatio: '16 / 9' }}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => { if (isPlaying) { setControlsVisible(false); setShowQMenu(false); } }}
      onTouchStart={resetHideTimer}
    >
      {/* ── Video element (hidden native controls) ─────────────────────── */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain"
        playsInline
        onClick={togglePlay}
        onPlay={() => { setIsPlaying(true); resetHideTimer(); }}
        onPause={() => { setIsPlaying(false); setControlsVisible(true); clearTimeout(hideTimerRef.current); }}
        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime ?? 0)}
        onDurationChange={() => setDuration(videoRef.current?.duration ?? 0)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => { setIsBuffering(false); setIsLoading(false); }}
        onCanPlay={() => setIsLoading(false)}
        onEnded={() => { setIsPlaying(false); setControlsVisible(true); }}
      />

      {/* ── Loading / buffering spinner ────────────────────────────────── */}
      {busy && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 size={48} className="animate-spin text-white/60" />
        </div>
      )}

      {/* ── Centre play button (paused, not loading) ───────────────────── */}
      {!isPlaying && !busy && (
        <button
          onClick={togglePlay}
          aria-label="Play"
          className="absolute inset-0 flex items-center justify-center group"
        >
          <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/60 transition-all duration-200 ring-2 ring-white/20">
            <Play size={28} className="text-white ml-1" fill="white" />
          </div>
        </button>
      )}

      {/* ── Controls overlay ───────────────────────────────────────────── */}
      <div
        className={`absolute inset-x-0 bottom-0 transition-opacity duration-300 ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Gradient scrim so controls are legible over any video */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        <div className="relative px-4 pb-3 pt-10 space-y-2">

          {/* ── Seek bar ─────────────────────────────────────────────── */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            aria-label="Seek"
            className="player-range w-full cursor-pointer"
            style={{
              background: `linear-gradient(to right,#8b5cf6 ${seekPct}%,rgba(255,255,255,0.25) ${seekPct}%)`,
            }}
          />

          {/* ── Bottom row ───────────────────────────────────────────── */}
          <div className="flex items-center gap-3">

            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="text-white hover:text-violet-300 transition-colors flex-shrink-0"
            >
              {isPlaying
                ? <Pause  size={18} fill="currentColor" />
                : <Play   size={18} fill="currentColor" />}
            </button>

            {/* Time */}
            <span className="text-white/70 text-xs font-mono tabular-nums flex-shrink-0 select-none">
              {fmt(currentTime)} / {fmt(duration)}
            </span>

            <div className="flex-1" />

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                aria-label="Toggle mute"
                className="text-white hover:text-violet-300 transition-colors flex-shrink-0"
              >
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={isMuted ? 0 : volume}
                onChange={handleVolume}
                aria-label="Volume"
                className="player-range w-20 cursor-pointer hidden sm:block"
                style={{
                  background: `linear-gradient(to right,rgba(255,255,255,0.9) ${volPct}%,rgba(255,255,255,0.2) ${volPct}%)`,
                }}
              />
            </div>

            {/* Quality selector */}
            {available.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowQMenu((p) => !p)}
                  className="text-white/70 hover:text-white text-[11px] font-black uppercase tracking-wide px-2 py-1 border border-white/20 hover:border-white/50 transition-all flex-shrink-0"
                >
                  {activeQ}
                </button>
                {showQMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-slate-900/95 backdrop-blur-sm border border-white/10 overflow-hidden shadow-2xl min-w-[5rem]">
                    {available.map((q) => (
                      <button
                        key={q}
                        onClick={() => switchQuality(q)}
                        className={`block w-full px-4 py-2 text-[11px] font-black uppercase text-left transition-colors ${
                          q === activeQ
                            ? 'bg-violet-600 text-white'
                            : 'text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              aria-label="Toggle fullscreen"
              className="text-white hover:text-violet-300 transition-colors flex-shrink-0"
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
