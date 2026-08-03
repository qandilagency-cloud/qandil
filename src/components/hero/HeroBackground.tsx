"use client";

import { useEffect, useRef } from "react";
import styles from "./HeroBackground.module.css";

const WATER_SPEED = 0.12;
const WAVE_STRENGTH = 0.085;
const WAVE_SCALE = 2.6;
const SURFACE_BRIGHTNESS = 1.15;
const FRESNEL_STRENGTH = 0.65;
const LIGHT_RAY_OPACITY = 0.18;
const LIGHT_RAY_SPEED = 0.045;
const SURFACE_POSITION = 0.22;

const vertexShader = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  uniform vec2 uResolution;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uMotion;
  uniform float uSurfaceY;
  uniform float uDesktopQuality;

  #define WATER_SPEED ${WATER_SPEED.toFixed(2)}
  #define WAVE_STRENGTH ${WAVE_STRENGTH.toFixed(2)}
  #define WAVE_SCALE ${WAVE_SCALE.toFixed(1)}
  #define SURFACE_BRIGHTNESS ${SURFACE_BRIGHTNESS.toFixed(2)}
  #define FRESNEL_STRENGTH ${FRESNEL_STRENGTH.toFixed(2)}
  #define RAY_OPACITY ${LIGHT_RAY_OPACITY.toFixed(2)}
  #define RAY_SPEED ${LIGHT_RAY_SPEED.toFixed(2)}

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + 1.0), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    mat2 rotation = mat2(0.84, -0.54, 0.54, 0.84);
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p = rotation * p * 2.03 + 7.1;
      amplitude *= 0.5;
    }
    return value;
  }

  float softRay(vec2 uv, float center, float width, float lean, float phase, float strength) {
    float belowSurface = smoothstep(uSurfaceY - 0.01, uSurfaceY + 0.08, uv.y);
    float depth = clamp((uv.y - uSurfaceY) / (1.0 - uSurfaceY), 0.0, 1.0);
    float shimmer = sin(uTime * RAY_SPEED * 6.283 + phase) * 0.014 * uMotion;
    float x = center + lean * depth + shimmer;
    float coneWidth = mix(width * 0.28, width, depth);
    float beam = exp(-pow(abs(uv.x - x) / max(coneWidth, 0.008), 1.75));
    float broken = mix(0.78, 1.0, noise(vec2(uv.y * 8.0 + phase, uTime * 0.025 * uMotion)));
    return beam * belowSurface * (1.0 - depth * 0.76) * broken * strength;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    uv.y = 1.0 - uv.y;
    float aspect = uResolution.x / uResolution.y;
    vec2 centered = vec2((uv.x - 0.5) * aspect, uv.y - 0.44);

    float t = uTime * WATER_SPEED * uMotion;
    vec2 surfaceUv = vec2(uv.x * WAVE_SCALE * 4.2, uv.y * 28.0);
    float broadWave = fbm(vec2(surfaceUv.x + t, surfaceUv.y - t * 0.42));
    float fineWave = fbm(vec2(surfaceUv.x * 2.35 - t * 0.72, surfaceUv.y * 1.55 + t * 0.84));
    float ripple = broadWave * 0.68 + fineWave * 0.32;
    float surfaceEdge = uSurfaceY + (ripple - 0.5) * WAVE_STRENGTH;

    vec3 surface = vec3(0.7255, 1.0, 0.9804);
    vec3 turquoise = vec3(0.0, 0.6824, 0.7451);
    vec3 cyan = vec3(0.0314, 0.4980, 0.6196);
    vec3 mid = vec3(0.0275, 0.3569, 0.4902);
    vec3 deep = vec3(0.0118, 0.1765, 0.3176);
    vec3 abyss = vec3(0.0039, 0.0863, 0.1843);

    vec3 color = mix(surface * 0.94, turquoise, smoothstep(0.0, 0.2, uv.y));
    color = mix(color, cyan, smoothstep(0.18, 0.42, uv.y));
    color = mix(color, mid, smoothstep(0.36, 0.62, uv.y));
    color = mix(color, deep, smoothstep(0.56, 0.84, uv.y));
    color = mix(color, abyss, smoothstep(0.82, 1.08, uv.y));

    float surfaceZone = 1.0 - smoothstep(surfaceEdge - 0.02, surfaceEdge + 0.065, uv.y);
    vec2 warpedUv = vec2(uv.x * 13.0, uv.y * 52.0);
    warpedUv += vec2(broadWave - 0.5, fineWave - 0.5) * vec2(1.15, 0.36);
    float surfaceFlowA = fbm(warpedUv + vec2(t * 1.4, -t * 0.32));
    float surfaceFlowB = fbm(warpedUv * vec2(1.75, 0.72) + vec2(-t * 0.9, t * 0.46));
    float flowingRidges = 1.0 - abs(surfaceFlowA * 2.0 - 1.0);
    flowingRidges *= 1.0 - abs(surfaceFlowB * 2.0 - 1.0);
    float thinHighlights = smoothstep(0.69, 0.91, flowingRidges);
    float brokenHighlights = thinHighlights * smoothstep(0.34, 0.78, fineWave);
    float localSlope = clamp(abs(surfaceFlowA - surfaceFlowB) * 2.8, 0.0, 1.0);
    float fresnel = pow(1.0 - localSlope, 3.0) * FRESNEL_STRENGTH;
    vec3 surfaceDark = vec3(0.0196, 0.4039, 0.4902);
    vec3 surfaceMid = vec3(0.0627, 0.7255, 0.7569);
    vec3 surfaceColor = mix(surfaceDark, surfaceMid, ripple);
    color = mix(color, surfaceColor, surfaceZone * 0.9);
    color += vec3(0.9098, 1.0, 0.9922) * brokenHighlights * surfaceZone * (0.48 + fresnel * 0.42);
    float edgeGlint = 1.0 - smoothstep(0.01, 0.055, abs(uv.y - surfaceEdge));
    color += surface * edgeGlint * (0.14 + ripple * 0.18);

    vec2 rayUv = uv;
    rayUv.x -= uPointer.x * 0.02;
    float rays = 0.0;
    rays += softRay(rayUv, 0.14, 0.090,  0.08, 0.3, 0.46);
    rays += softRay(rayUv, 0.25, 0.062,  0.05, 2.1, 0.72);
    rays += softRay(rayUv, 0.36, 0.105,  0.03, 4.3, 0.60);
    rays += softRay(rayUv, 0.46, 0.075,  0.01, 1.4, 1.00);
    rays += softRay(rayUv, 0.55, 0.090, -0.02, 3.5, 0.82);
    rays += softRay(rayUv, 0.65, 0.115, -0.05, 5.2, 0.62);
    rays += softRay(rayUv, 0.76, 0.070, -0.07, 6.1, 0.48) * uDesktopQuality;
    rays += softRay(rayUv, 0.86, 0.095, -0.09, 2.8, 0.36) * uDesktopQuality;
    rays *= RAY_OPACITY;
    color += vec3(0.6353, 1.0, 0.9686) * rays;

    float halo = exp(-dot(centered / vec2(0.48 * aspect, 0.38), centered / vec2(0.48 * aspect, 0.38)));
    color += vec3(0.1333, 0.8784, 0.8824) * halo * 0.105;

    float depthHaze = smoothstep(0.3, 1.0, uv.y);
    float hazeNoise = fbm(uv * vec2(3.0, 5.0) + vec2(t * 0.15, -t * 0.08));
    color = mix(color, mid, depthHaze * (0.055 + hazeNoise * 0.035));

    float vignette = smoothstep(0.42, 0.93, length(vec2((uv.x - 0.5) * 0.86, uv.y - 0.48)));
    color = mix(color, deep, vignette * 0.26);

    float grain = hash21(gl_FragCoord.xy + fract(uTime) * 17.0) - 0.5;
    color += grain * 0.008;
    gl_FragColor = vec4(color, 1.0);
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export default function HeroBackground() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      powerPreference: "high-performance",
    });
    if (!gl) return;

    const vertex = createShader(gl, gl.VERTEX_SHADER, vertexShader);
    const fragment = createShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return;

    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const resolutionUniform = gl.getUniformLocation(program, "uResolution");
    const timeUniform = gl.getUniformLocation(program, "uTime");
    const pointerUniform = gl.getUniformLocation(program, "uPointer");
    const motionUniform = gl.getUniformLocation(program, "uMotion");
    const surfaceUniform = gl.getUniformLocation(program, "uSurfaceY");
    const desktopQualityUniform = gl.getUniformLocation(program, "uDesktopQuality");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerTarget = { x: 0, y: 0 };
    const pointerCurrent = { x: 0, y: 0 };
    let visible = true;
    let frame = 0;
    const start = performance.now();
    let last = start;
    let desktopQuality = window.innerWidth > 768 ? 1 : 0;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const qualityCap = window.innerWidth <= 768 ? 1 : 1.5;
      desktopQuality = window.innerWidth > 768 ? 1 : 0;
      const dpr = Math.min(window.devicePixelRatio || 1, qualityCap);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerTarget.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointerTarget.y = (event.clientY / window.innerHeight) * 2 - 1;
    };

    const render = (now: number) => {
      if (!visible) return;
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      const smooth = 1 - Math.exp(-2.0 * delta);
      pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * smooth;
      pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * smooth;

      gl.uniform2f(resolutionUniform, canvas.width, canvas.height);
      gl.uniform1f(timeUniform, (now - start) / 1000);
      gl.uniform2f(pointerUniform, pointerCurrent.x, pointerCurrent.y);
      gl.uniform1f(motionUniform, reducedMotion.matches ? 0 : 1);
      gl.uniform1f(surfaceUniform, SURFACE_POSITION);
      gl.uniform1f(desktopQualityUniform, desktopQuality);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      frame = requestAnimationFrame(render);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) {
        last = performance.now();
        frame = requestAnimationFrame(render);
      } else if (!visible && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    }, { threshold: 0.01 });

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    observer.observe(wrap);
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, []);

  return (
    <div ref={wrapRef} className={styles.wrap} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.oceanCanvas} />
      <div className={styles.oceanDepth} />
      <div className={styles.oceanFog} />
      <div className={styles.atmosphere} />
    </div>
  );
}
