export type EnvMode = "live" | "test";

export function mapModeToApiEnv(mode: EnvMode): "Live" | "Test" {
  return mode === "live" ? "Live" : "Test";
}