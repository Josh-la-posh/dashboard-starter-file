import React, { createContext, useContext, useState, useEffect } from "react";
import type { EnvMode } from "../types/environment";

interface EnvCtx {
  mode: EnvMode;
  setMode: (m: EnvMode) => void;
  toggle: () => void;
}

const EnvironmentModeContext = createContext<EnvCtx | null>(null);

export function EnvironmentModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<EnvMode>("test");
  const [complianceComplete, setComplianceComplete] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("env:mode") as EnvMode | null;
    if (saved) setModeState(saved);
    const progress = localStorage.getItem('compliance:progress');
    setComplianceComplete(progress === '6');
  }, []);

  // React to compliance completion after initial mount
  useEffect(() => {
    const handle = () => {
      const p = localStorage.getItem('compliance:progress');
      setComplianceComplete(p === '6');
      if (p !== '6') {
        // force test mode if not complete
        setModeState('test');
        localStorage.setItem('env:mode', 'test');
      }
    };
    window.addEventListener('storage', handle);
    return () => window.removeEventListener('storage', handle);
  }, []);

  const setMode = (m: EnvMode) => {
    if (!complianceComplete && m === 'live') return; // block switching to live
    setModeState(m);
    localStorage.setItem("env:mode", m);
  };

  const toggle = () => setMode(mode === "live" ? "test" : "live");

  return (
    <EnvironmentModeContext.Provider value={{ mode, setMode, toggle }}>
      {children}
    </EnvironmentModeContext.Provider>
  );
}

export function useEnvMode() {
  const ctx = useContext(EnvironmentModeContext);
  if (!ctx) throw new Error("useEnvMode must be used within EnvironmentModeProvider");
  return ctx;
}