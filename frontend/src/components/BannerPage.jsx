import React, { useEffect, useRef, useState } from "react";

/** ĐỔI 6 ảnh ở đây (ảnh ngang 1920×720 sẽ đẹp nhất; ảnh vuông vẫn chạy nhưng sẽ bị crop giữa) */
import b1 from "../assets/img/banner1.jpg";
import b2 from "../assets/img/banner2.jpg";
import b3 from "../assets/img/banner3.png";
import b4 from "../assets/img/banner4.png";
import b5 from "../assets/img/banner5.png";
import b6 from "../assets/img/banner6.png";

export default function BannerPage() {
  const images = [b1, b2, b3, b4, b5, b6];
  const n = images.length;

  const INTERVAL = 6000; // 6s/slide
  const FADE_MS  = 600;

  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    const step = Math.max(40, Math.floor(INTERVAL / 100));
    clearInterval(timer.current);
    if (!paused) {
      timer.current = setInterval(() => {
        setProgress(p => {
          const np = p + (step / INTERVAL) * 100;
          if (np >= 100) { setIndex(i => (i + 1) % n); return 0; }
          return np;
        });
      }, step);
    }
    return () => clearInterval(timer.current);
  }, [index, paused, n]);

  useEffect(() => {
    const onVis = () => setPaused(document.visibilityState !== "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const go   = (i) => { setIndex(((i % n) + n) % n); setProgress(0); };
  const next = () => go(index + 1);
  const prev = () => go(index - 1);

  return (
    // FULL-BLEED: phá khung container để tràn hết chiều ngang màn hình
    <div
      className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Tỉ lệ: mobile 16:9, desktop 21:9 (tăng/giảm độ cao bằng cách đổi các aspect bên dưới) */}
<div className="relative w-screen aspect-[16/5] md:aspect-[21/6]">
        {/* Các slide chồng lên nhau → fade mượt, nhìn “hero” */}
        {images.map((src, i) => (
          <div
            key={i}
            className="absolute inset-0"
            style={{ opacity: i === index ? 1 : 0, transition: `opacity ${FADE_MS}ms ease-in-out` }}
          >
            <img
              src={src}
              alt={`banner-${i + 1}`}
              className="h-full w-full object-cover object-center"
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
            />
          </div>
        ))}

        {/* Nút overlay (không viền) */}
        {n > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Ảnh trước"
              className="absolute left-4 top-1/2 -translate-y-1/2 grid place-items-center rounded-full
                         bg-black/35 hover:bg-black/50 text-white backdrop-blur-sm p-2"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M15 6 9 12l6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={next}
              aria-label="Ảnh kế"
              className="absolute right-4 top-1/2 -translate-y-1/2 grid place-items-center rounded-full
                         bg-black/35 hover:bg-black/50 text-white backdrop-blur-sm p-2"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}

        {/* Dots + timeline tinh gọn */}
        {n > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
            {images.map((_, i) => {
              const filled = i < index ? 100 : i > index ? 0 : progress;
              const active = i === index;
              return (
                <button
                  key={i}
                  onClick={() => go(i)}
                  className={`h-1.5 overflow-hidden rounded-full transition-all ${active ? "w-16 bg-white/70" : "w-10 bg-white/40 hover:bg-white/60"}`}
                  aria-label={`Chuyển ảnh ${i + 1}`}
                >
                  <div className="h-full bg-fuchsia-500 transition-[width] duration-150 ease-linear" style={{ width: `${Math.max(0, Math.min(100, filled))}%` }} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
