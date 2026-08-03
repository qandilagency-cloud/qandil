"use client";

import { useEffect, useRef } from "react";
import Scene from "@/components/scene/Scene";
import HeroBackground from "./HeroBackground";
import OceanEffects from "./OceanEffects";
import styles from "./Hero.module.css";

export default function Hero() {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const title = titleRef.current;
    if (!title) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const onPointerMove = (event: PointerEvent) => {
      if (reducedMotion.matches) return;
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = ((event.clientX / window.innerWidth) * 2 - 1) * -6;
        const y = ((event.clientY / window.innerHeight) * 2 - 1) * -4;
        title.style.setProperty("--title-x", `${x.toFixed(2)}px`);
        title.style.setProperty("--title-y", `${y.toFixed(2)}px`);
      });
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section className={styles.hero}>
      <HeroBackground />
      <OceanEffects />
      <div className={styles.oceanVignette} aria-hidden="true" />
      <h1
        ref={titleRef}
        className={styles.heroGiantTitle}
        aria-label="من عمق الفكرة نصنع علامة تضيء"
        dir="rtl"
      >
        <span>من عمق الفكرة</span>
        <span>نصنع علامة</span>
        <span>تضيء</span>
      </h1>
      <div className={styles.canvasLayer}>
        <Scene />
      </div>
    </section>
  );
}
