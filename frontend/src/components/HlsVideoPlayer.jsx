import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function HlsVideoPlayer({ src }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // If it's a plain mp4, just set src directly
    if (src.includes('.mp4') || (!src.includes('.m3u8') && !src.includes('m3u8'))) {
      video.src = src;
      return;
    }

    let hls;
    if (Hls.isSupported()) {
      hls = new Hls({ debug: false });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    }

    return () => { if (hls) hls.destroy(); };
  }, [src]);

  return (
    <video
      ref={videoRef}
      controls
      style={{ width: "100%", background: "black", borderRadius: "8px" }}
    />
  );
}