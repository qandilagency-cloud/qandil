"use client";

import { useEffect, useRef } from "react";

export interface PointerState {
  x: number; // normalized -1..1, left to right
  y: number; // normalized -1..1, bottom to top
  vx: number; // instantaneous velocity, NDC units / second
  vy: number;
}

/**
 * Listens globally so the canvas can remain pointer-events:none, while
 * normalizing the coordinates against the Hero section itself.
 */
export function usePointer(): React.MutableRefObject<PointerState> {
  const state = useRef<PointerState>({ x: 0, y: 0, vx: 0, vy: 0 });

  useEffect(() => {
    let lastX = 0;
    let lastY = 0;
    let lastT = performance.now();
    let primed = false;

    const handleMove = (e: PointerEvent) => {
      const container = document.querySelector("section");
      const rect = container?.getBoundingClientRect();
      if (!rect || e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
        return;
      }

      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      const now = performance.now();
      const dt = Math.max((now - lastT) / 1000, 1 / 240);

      if (primed) {
        state.current.vx = (nx - lastX) / dt;
        state.current.vy = (ny - lastY) / dt;
      }
      state.current.x = nx;
      state.current.y = ny;

      lastX = nx;
      lastY = ny;
      lastT = now;
      primed = true;
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => window.removeEventListener("pointermove", handleMove);
  }, []);

  return state;
}
