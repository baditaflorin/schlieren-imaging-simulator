import { useEffect, useRef } from "react";
import * as THREE from "three";
import { densityToByte } from "../simulation/densityField";
import { createDensitySolver } from "../simulation/webgpuDensity";
import type { SimulationSettings, SolverTelemetry } from "../simulation/types";

interface SchlierenViewportProps {
  settings: SimulationSettings;
  audioLevel: number;
  onTelemetry: (telemetry: SolverTelemetry) => void;
}

const gridWidth = 160;
const gridHeight = 96;

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform sampler2D uDensity;
uniform float uTime;
uniform float uKnife;
uniform float uContrast;
uniform float uScenario;
uniform vec2 uTexel;
varying vec2 vUv;

float gridLine(float value, float scale, float width) {
  float line = abs(fract(value * scale) - 0.5);
  return smoothstep(width, 0.0, line);
}

vec3 background(vec2 uv) {
  float horizontal = gridLine(uv.y + sin(uv.x * 4.0) * 0.01, 9.0, 0.035);
  float vertical = gridLine(uv.x, 14.0, 0.026);
  float bands = smoothstep(0.15, 0.95, uv.x) * (0.4 + 0.6 * sin(uv.y * 18.0 + uTime * 0.18));
  vec3 warm = vec3(0.95, 0.74, 0.42);
  vec3 cyan = vec3(0.23, 0.78, 0.82);
  vec3 rose = vec3(0.9, 0.32, 0.42);
  vec3 ink = vec3(0.05, 0.07, 0.08);
  vec3 base = mix(ink, mix(cyan, warm, uv.y), 0.42);
  base = mix(base, rose, bands * 0.12);
  base += vec3(horizontal * 0.16 + vertical * 0.11);
  float opticalBench = smoothstep(0.055, 0.0, abs(uv.y - 0.16)) * smoothstep(0.08, 0.18, uv.x) * smoothstep(0.96, 0.78, uv.x);
  base += opticalBench * vec3(0.28, 0.28, 0.24);
  return base;
}

void main() {
  float left = texture2D(uDensity, vUv - vec2(uTexel.x, 0.0)).r;
  float right = texture2D(uDensity, vUv + vec2(uTexel.x, 0.0)).r;
  float down = texture2D(uDensity, vUv - vec2(0.0, uTexel.y)).r;
  float up = texture2D(uDensity, vUv + vec2(0.0, uTexel.y)).r;
  vec2 grad = vec2(right - left, up - down);

  float knife = mix(grad.y, grad.x, uKnife);
  vec2 refractedUv = clamp(vUv + grad * (0.09 + uContrast * 0.08), vec2(0.0), vec2(1.0));
  vec3 base = background(refractedUv);
  float schlieren = 0.52 + knife * (9.0 + uContrast * 24.0);
  vec3 tint = mix(vec3(0.74, 0.9, 1.0), vec3(1.0, 0.78, 0.48), smoothstep(0.0, 2.0, uScenario));
  vec3 color = base * schlieren + tint * abs(knife) * (1.4 + uContrast);
  float vignette = smoothstep(0.92, 0.25, distance(vUv, vec2(0.5)));
  gl_FragColor = vec4(color * vignette, 1.0);
}
`;

export default function SchlierenViewport({
  settings,
  audioLevel,
  onTelemetry,
}: SchlierenViewportProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const settingsRef = useRef(settings);
  const audioRef = useRef(audioLevel);
  const telemetryRef = useRef(onTelemetry);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    audioRef.current = audioLevel;
  }, [audioLevel]);

  useEffect(() => {
    telemetryRef.current = onTelemetry;
  }, [onTelemetry]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    let active = true;
    let animationFrame = 0;
    let last = performance.now();
    let elapsed = 0;
    let fpsAverage = 60;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0c1116);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const bytes = new Uint8Array(gridWidth * gridHeight);
    bytes.fill(128);
    const densityTexture = new THREE.DataTexture(
      bytes,
      gridWidth,
      gridHeight,
      THREE.RedFormat,
      THREE.UnsignedByteType,
    );
    densityTexture.minFilter = THREE.LinearFilter;
    densityTexture.magFilter = THREE.LinearFilter;
    densityTexture.wrapS = THREE.ClampToEdgeWrapping;
    densityTexture.wrapT = THREE.ClampToEdgeWrapping;
    densityTexture.needsUpdate = true;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uDensity: { value: densityTexture },
        uTime: { value: 0 },
        uKnife: { value: settingsRef.current.knifeEdge },
        uContrast: { value: settingsRef.current.contrast },
        uScenario: { value: 0 },
        uTexel: { value: new THREE.Vector2(1 / gridWidth, 1 / gridHeight) },
      },
      vertexShader,
      fragmentShader,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const resize = () => {
      const rect = mount.getBoundingClientRect();
      renderer.setSize(
        Math.max(1, rect.width),
        Math.max(1, rect.height),
        false,
      );
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    let solverCleanup: () => void = () => {};

    void createDensitySolver(gridWidth, gridHeight).then(
      ({ solver, message }) => {
        telemetryRef.current({
          solverKind: solver.kind,
          fps: fpsAverage,
          grid: `${gridWidth} x ${gridHeight}`,
          webgpuMessage: message,
        });

        const frame = async (now: number) => {
          if (!active) {
            return;
          }

          const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
          last = now;
          const current = settingsRef.current;
          if (current.running) {
            elapsed += dt;
          }
          fpsAverage = fpsAverage * 0.92 + (1 / dt) * 0.08;

          const field = await solver.step({
            time: elapsed,
            dt,
            scenario: current.scenario,
            strength: current.strength,
            frequency: current.frequency,
            flow: current.flow,
            turbulence: current.turbulence,
            audioLevel: audioRef.current,
          });

          for (let index = 0; index < field.length; index += 1) {
            bytes[index] = densityToByte(field[index]);
          }

          densityTexture.needsUpdate = true;
          material.uniforms.uTime.value = elapsed;
          material.uniforms.uKnife.value = current.knifeEdge;
          material.uniforms.uContrast.value = current.contrast;
          material.uniforms.uScenario.value =
            current.scenario === "heat"
              ? 0
              : current.scenario === "sound"
                ? 1
                : 2;
          renderer.render(scene, camera);

          telemetryRef.current({
            solverKind: solver.kind,
            fps: fpsAverage,
            grid: `${gridWidth} x ${gridHeight}`,
            webgpuMessage: message,
          });
          animationFrame = window.requestAnimationFrame(frame);
        };

        animationFrame = window.requestAnimationFrame(frame);
        solverCleanup = () => solver.dispose();
      },
    );

    return () => {
      active = false;
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
      solverCleanup();
      densityTexture.dispose();
      material.dispose();
      mesh.geometry.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="schlieren-viewport"
      aria-label="Schlieren simulation viewport"
    />
  );
}
