import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { initObservability } from "./lib/observability";
import { QueryProvider } from "./app/providers/QueryProvider";
import ThemeProvider from "./app/providers/ThemeProvider";
import { EnvironmentModeProvider } from "./context/EnvironmentModeContext";
import { RouteResetBoundary } from "./components/system/ErrorBoundary";
import App from "./App";
import OfflineBanner from "./components/system/OfflineBanner";

initObservability();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryProvider>
      <EnvironmentModeProvider>
        <ThemeProvider />
        <RouteResetBoundary>
          <OfflineBanner />
          <App />
        </RouteResetBoundary>
      </EnvironmentModeProvider>
    </QueryProvider>
  </React.StrictMode>
);
