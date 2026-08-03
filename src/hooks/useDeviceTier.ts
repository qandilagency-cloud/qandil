"use client";

import { useEffect, useState } from "react";

export interface TierSettings {
  dpr: [number, number];
  antialias: boolean;
  bellRings: number;
  bellRadialSegments: number;
  massCount: number;
  massTubularSegments: number;
  massRadialSegments: number;
  tendrilCount: number;
  tendrilTubularSegments: number;
  tendrilRadialSegments: number;
}

const HIGH: TierSettings = {
  dpr: [1, 1.75],
  antialias: true,
  bellRings: 26,
  bellRadialSegments: 40,
  massCount: 12,
  massTubularSegments: 14,
  massRadialSegments: 8,
  tendrilCount: 5,
  tendrilTubularSegments: 14,
  tendrilRadialSegments: 6,
};

const LOW: TierSettings = {
  dpr: [1, 1.25],
  antialias: false,
  bellRings: 16,
  bellRadialSegments: 22,
  massCount: 8,
  massTubularSegments: 9,
  massRadialSegments: 6,
  tendrilCount: 3,
  tendrilTubularSegments: 9,
  tendrilRadialSegments: 5,
};

function detectTier(): TierSettings {
  if (typeof window === "undefined") return HIGH;
  const narrow = window.innerWidth < 820;
  const cores = navigator.hardwareConcurrency ?? 8;
  const lowPower = narrow || cores <= 4;
  return lowPower ? LOW : HIGH;
}

export function useDeviceTier(): TierSettings {
  const [tier, setTier] = useState<TierSettings>(HIGH);

  useEffect(() => {
    setTier(detectTier());
  }, []);

  return tier;
}
