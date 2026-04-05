import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function HlsVideoPlayer({ src }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls;

    // 1. Check if the browser needs hls.js (Chrome, Firefox, Edge)
    if (Hls.isSupported()) {
      hls = new Hls({ debug: false });
      hls.loadSource(src);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(err => console.log("Auto-play prevented by browser:", err));
      });
    } 
    // 2. Fallback for browsers that support HLS natively (Safari)
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(err => console.log("Auto-play prevented by browser:", err));
      });
    }

    // Cleanup to prevent memory leaks when changing videos
    return () => {
      if (hls) hls.destroy();
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      controls
      style={{ width: "100%", background: "black", borderRadius: "8px" }}
    />
  );
}