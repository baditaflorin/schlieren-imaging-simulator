import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import {
  Activity,
  Cpu,
  ExternalLink,
  Flame,
  Gauge,
  HeartHandshake,
  Mic,
  Pause,
  Play,
  Radio,
  RotateCcw,
  SlidersHorizontal,
  Square,
  Star,
  Upload,
  Volume2,
  Wind,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useAudioMeter } from "./features/audio/useAudioMeter";
import {
  defaultSettings,
  scenarioPresets,
} from "./features/simulation/presets";
import type {
  ScenarioId,
  SimulationSettings,
  SolverTelemetry,
} from "./features/simulation/types";
import { loadSettings, saveSettings } from "./features/settings/storage";

const SchlierenViewport = lazy(
  () => import("./features/rendering/SchlierenViewport"),
);

const initialTelemetry: SolverTelemetry = {
  solverKind: "cpu",
  fps: 0,
  grid: "160 x 96",
  webgpuMessage: "Initializing solver.",
};

const scenarioIcons = {
  heat: Flame,
  sound: Radio,
  gas: Wind,
};

const buildInfoSchema = z.object({
  commit: z.string().min(7),
  version: z.string().min(1),
});

async function fetchBuildInfo() {
  const response = await fetch(`${import.meta.env.BASE_URL}build-info.json`);
  if (!response.ok) {
    throw new Error("Build metadata lookup failed");
  }
  return buildInfoSchema.parse(await response.json());
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

function Slider({ label, value, onChange }: SliderProps) {
  return (
    <label className="control-row">
      <span>
        {label}
        <strong>{percent(value)}</strong>
      </span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  );
}

function App() {
  const [settings, setSettings] = useState<SimulationSettings>(() =>
    loadSettings(),
  );
  const [telemetry, setTelemetry] = useState<SolverTelemetry>(initialTelemetry);
  const audio = useAudioMeter();
  const buildInfoQuery = useQuery({
    queryKey: ["build-info"],
    queryFn: fetchBuildInfo,
  });
  const displayedCommit = buildInfoQuery.data?.commit ?? __BUILD_COMMIT__;
  const displayedVersion = buildInfoQuery.data?.version ?? __APP_VERSION__;

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const selectedPreset = useMemo(
    () =>
      scenarioPresets.find((preset) => preset.id === settings.scenario) ??
      scenarioPresets[0],
    [settings.scenario],
  );

  const updateSettings = useCallback(
    <K extends keyof SimulationSettings>(
      key: K,
      value: SimulationSettings[K],
    ) => {
      setSettings((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const chooseScenario = useCallback((scenario: ScenarioId) => {
    setSettings((current) => ({ ...current, scenario }));
  }, []);

  const reset = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const handleFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.currentTarget.files?.[0];
      if (file) {
        await audio.loadFile(file);
        event.currentTarget.value = "";
      }
    },
    [audio],
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <Activity size={22} />
          </span>
          <div>
            <h1>Schlieren Imaging Simulator</h1>
            <p>
              Visualize air-density gradients from heat, sound, and gas flow.
            </p>
          </div>
        </div>

        <nav className="header-actions" aria-label="Project links">
          <a href={__REPO_URL__} target="_blank" rel="noreferrer">
            <Star size={18} />
            GitHub
            <ExternalLink size={14} />
          </a>
          <a href={__PAYPAL_URL__} target="_blank" rel="noreferrer">
            <HeartHandshake size={18} />
            PayPal
            <ExternalLink size={14} />
          </a>
        </nav>
      </header>

      <main className="simulator-layout">
        <section className="stage" aria-label="Schlieren visualization">
          <Suspense
            fallback={
              <div className="viewport-loading">
                <Gauge size={28} />
                <span>Loading optical bench</span>
              </div>
            }
          >
            <SchlierenViewport
              settings={settings}
              audioLevel={audio.level}
              onTelemetry={setTelemetry}
            />
          </Suspense>

          <div className="stage-toolbar" aria-label="Simulation status">
            <span>
              <Cpu size={16} />
              {telemetry.solverKind.toUpperCase()}
            </span>
            <span>{Math.round(telemetry.fps)} FPS</span>
            <span>{telemetry.grid}</span>
            <span>v{displayedVersion}</span>
            <span>commit {displayedCommit}</span>
          </div>
        </section>

        <aside className="control-panel" aria-label="Simulation controls">
          <section className="panel-section">
            <div className="section-title">
              <SlidersHorizontal size={17} />
              <h2>Scene</h2>
            </div>
            <div
              className="segmented-control"
              role="tablist"
              aria-label="Density source"
            >
              {scenarioPresets.map((preset) => {
                const Icon = scenarioIcons[preset.id];
                return (
                  <button
                    key={preset.id}
                    type="button"
                    role="tab"
                    aria-selected={settings.scenario === preset.id}
                    className={
                      settings.scenario === preset.id ? "selected" : ""
                    }
                    onClick={() => chooseScenario(preset.id)}
                  >
                    <Icon size={17} />
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <div className="readout-grid">
              <span>Source</span>
              <strong>{selectedPreset.sourceLabel}</strong>
              <span>Pattern</span>
              <strong>{selectedPreset.reading}</strong>
            </div>
          </section>

          <section className="panel-section">
            <div className="section-title">
              <Gauge size={17} />
              <h2>Field</h2>
            </div>
            <Slider
              label="Gradient strength"
              value={settings.strength}
              onChange={(value) => updateSettings("strength", value)}
            />
            <Slider
              label="Frequency"
              value={settings.frequency}
              onChange={(value) => updateSettings("frequency", value)}
            />
            <Slider
              label="Flow speed"
              value={settings.flow}
              onChange={(value) => updateSettings("flow", value)}
            />
            <Slider
              label="Turbulence"
              value={settings.turbulence}
              onChange={(value) => updateSettings("turbulence", value)}
            />
          </section>

          <section className="panel-section">
            <div className="section-title">
              <Activity size={17} />
              <h2>Optics</h2>
            </div>
            <Slider
              label="Knife edge"
              value={settings.knifeEdge}
              onChange={(value) => updateSettings("knifeEdge", value)}
            />
            <Slider
              label="Contrast"
              value={settings.contrast}
              onChange={(value) => updateSettings("contrast", value)}
            />
            <div className="button-row">
              <button
                type="button"
                className="primary-button"
                onClick={() => updateSettings("running", !settings.running)}
              >
                {settings.running ? <Pause size={17} /> : <Play size={17} />}
                {settings.running ? "Pause" : "Run"}
              </button>
              <button
                type="button"
                className="icon-button"
                onClick={reset}
                aria-label="Reset simulation"
              >
                <RotateCcw size={17} />
              </button>
            </div>
          </section>

          <section className="panel-section">
            <div className="section-title">
              <Volume2 size={17} />
              <h2>Audio</h2>
            </div>
            <div className="audio-meter" aria-label="Audio influence">
              <span
                style={{ transform: `scaleX(${Math.max(0.02, audio.level)})` }}
              />
            </div>
            <div className="button-row">
              <button
                type="button"
                className="primary-button"
                onClick={audio.startMicrophone}
              >
                <Mic size={17} />
                Mic
              </button>
              <label className="file-button">
                <Upload size={17} />
                Upload
                <input type="file" accept="audio/*" onChange={handleFile} />
              </label>
              <button
                type="button"
                className="icon-button"
                onClick={audio.stop}
                aria-label="Stop audio"
              >
                <Square size={15} />
              </button>
            </div>
            <div className="readout-grid">
              <span>Audio mode</span>
              <strong>{audio.active ? audio.mode : "idle"}</strong>
              <span>Influence</span>
              <strong>{percent(audio.level)}</strong>
            </div>
            {audio.error ? <p className="inline-error">{audio.error}</p> : null}
          </section>

          <section className="panel-section status-section">
            <div className="section-title">
              <Cpu size={17} />
              <h2>Runtime</h2>
            </div>
            <p>{telemetry.webgpuMessage}</p>
            <div className="readout-grid">
              <span>Build date</span>
              <strong>{new Date(__BUILD_DATE__).toLocaleDateString()}</strong>
              <span>Build commit</span>
              <strong>{displayedCommit}</strong>
              <span>Repository</span>
              <a href={__REPO_URL__} target="_blank" rel="noreferrer">
                baditaflorin
              </a>
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

export default App;
