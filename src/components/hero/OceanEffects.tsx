"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import styles from "./OceanEffects.module.css";

type SeededItem = CSSProperties & Record<`--${string}`, string | number>;

function seeded(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

const bubbles: SeededItem[] = Array.from({ length: 24 }, (_, index) => {
  const sizeBias = seeded(index + 31) ** 2;
  const sway = 8 + seeded(index + 117) * 15;
  return {
    "--x": `${2 + seeded(index + 3) * 96}%`,
    "--size": `${3 + sizeBias * 15}px`,
    "--opacity": 0.2 + seeded(index + 51) * 0.32,
    "--duration": `${10 + seeded(index + 73) * 12}s`,
    "--delay": `${-seeded(index + 91) * 22}s`,
    "--sway": `${sway}px`,
    "--sway-negative": `${sway * -0.5}px`,
    "--blur": index % 7 === 0 ? "1.3px" : index % 5 === 0 ? "0.55px" : "0px",
  };
});

const particles: SeededItem[] = Array.from({ length: 62 }, (_, index) => ({
  "--x": `${seeded(index + 201) * 100}%`,
  "--y": `${8 + seeded(index + 233) * 88}%`,
  "--size": `${0.65 + seeded(index + 271) * 2.1}px`,
  "--opacity": 0.05 + seeded(index + 307) * 0.13,
  "--duration": `${18 + seeded(index + 331) * 22}s`,
  "--delay": `${-seeded(index + 367) * 35}s`,
  "--blur": `${seeded(index + 389) * 0.8}px`,
}));

export default function OceanEffects() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = true;
    let frame = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const draw = () => {
      frame = 0;
      if (!visible || reduceMotion.matches) return;
      currentX += (targetX - currentX) * 0.055;
      currentY += (targetY - currentY) * 0.055;
      root.style.setProperty("--pointer-x", currentX.toFixed(3));
      root.style.setProperty("--pointer-y", currentY.toFixed(3));
      if (Math.abs(targetX - currentX) > 0.01 || Math.abs(targetY - currentY) > 0.01) {
        frame = requestAnimationFrame(draw);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      targetX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      targetY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      if (!frame && visible && !reduceMotion.matches) frame = requestAnimationFrame(draw);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      root.classList.toggle(styles.paused, !visible);
      if (!visible && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    }, { threshold: 0.01 });

    observer.observe(root);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={rootRef} className={styles.root} aria-hidden="true">
      <div className={styles.farLayer}>
        <div className={styles.particles}>
          {particles.map((style, index) => <i key={index} style={style} />)}
        </div>
      </div>
      <div className={styles.middleLayer}>
        {bubbles.map((style, index) => <i key={index} className={styles.bubble} style={style} />)}
      </div>
      <div className={styles.nearLayer}>
        {bubbles.slice(0, 4).map((style, index) => (
          <i key={index} className={`${styles.bubble} ${styles.nearBubble}`} style={{ ...style, "--size": `${12 + index * 2}px` } as SeededItem} />
        ))}
      </div>
    </div>
  );
}
