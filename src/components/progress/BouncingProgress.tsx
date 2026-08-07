"use client";

import { type AnimationEvent, useCallback, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import SceneEnvironment from "@/components/scene/SceneEnvironment";
import MiniJellyfish from "./MiniJellyfish";
import styles from "./BouncingProgress.module.css";

const STEP_COUNT = 9;
const SERVICES = [
  "التصميم",
  "التصوير",
  "التسويق",
  "تسمية العلامة التجارية",
  "تصميم العلامة التجارية",
  "تصميم الشعارات",
  "طباعة التصاميم",
  "تصميم وبرمجة مواقع الويب",
  "تصميم UX/UI للمنتجات الرقمية",
] as const;

export default function BouncingProgress() {
  const reducedMotion = usePrefersReducedMotion();
  const [currentStep, setCurrentStep] = useState(0);
  const [jumping, setJumping] = useState(false);

  useEffect(() => {
    if (reducedMotion || jumping) return;
    const pause = window.setTimeout(() => setJumping(true), 250);
    return () => window.clearTimeout(pause);
  }, [jumping, reducedMotion]);

  const handleLanding = useCallback(
    (event: AnimationEvent<HTMLDivElement>) => {
      if (event.currentTarget !== event.target || reducedMotion) return;
      setCurrentStep((current) => (current + 1) % STEP_COUNT);
      setJumping(false);
    },
    [reducedMotion]
  );

  const position = (currentStep / (STEP_COUNT - 1)) * 100;
  const progressStyle = { "--position": `${position}%` } as React.CSSProperties;

  return (
    <section className={styles.section} aria-label="مراحل التقدم">
      <div className={styles.progress} style={progressStyle}>
        <div className={styles.line}>
          {Array.from({ length: STEP_COUNT }, (_, index) => (
            <i
              key={index}
              className={`${styles.step} ${index === currentStep ? styles.stepActive : ""}`}
              style={{ left: `${(index / (STEP_COUNT - 1)) * 100}%` }}
              data-service={SERVICES[index]}
            />
          ))}
          <div className={styles.dot} />
          <div className={styles.serviceLabel} aria-live="polite">
            <span key={`current-${currentStep}`} className={styles.serviceActive}>
              {SERVICES[currentStep]}
            </span>
          </div>
        </div>

        <div className={styles.jellyPosition} aria-hidden="true">
          <div
            className={`${styles.jellyBounce} ${jumping ? styles.jumping : ""}`}
            onAnimationEnd={handleLanding}
          >
            <Canvas
              className={styles.canvas}
              dpr={[1, 1.35]}
              frameloop={jumping ? "always" : "demand"}
              gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
              camera={{ position: [0, 0, 5.2], fov: 42 }}
            >
              <SceneEnvironment />
              <ambientLight intensity={0.18} color="#151c2b" />
              <hemisphereLight color="#21d9ff" groundColor="#070a12" intensity={0.45} />
              <MiniJellyfish active={jumping && !reducedMotion} />
            </Canvas>
            <span className={styles.shadow} />
          </div>
        </div>
      </div>
    </section>
  );
}
