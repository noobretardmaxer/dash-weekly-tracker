"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

function subscribeOnlineStatus(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getOnlineServerSnapshot() {
  return true;
}

type UiSimulationContextValue = {
  simulateError: boolean;
  setSimulateError: (value: boolean) => void;
  simulateOffline: boolean;
  setSimulateOffline: (value: boolean) => void;
  isOffline: boolean;
};

const UiSimulationContext = createContext<UiSimulationContextValue | null>(null);

export function UiSimulationProvider({ children }: { children: ReactNode }) {
  const [simulateError, setSimulateError] = useState(false);
  const [simulateOffline, setSimulateOffline] = useState(false);
  const isBrowserOnline = useSyncExternalStore(subscribeOnlineStatus, getOnlineSnapshot, getOnlineServerSnapshot);

  const value = useMemo(
    () => ({
      simulateError,
      setSimulateError,
      simulateOffline,
      setSimulateOffline,
      isOffline: simulateOffline || !isBrowserOnline,
    }),
    [simulateError, simulateOffline, isBrowserOnline]
  );

  return <UiSimulationContext.Provider value={value}>{children}</UiSimulationContext.Provider>;
}

export function useUiSimulation() {
  const ctx = useContext(UiSimulationContext);
  if (!ctx) throw new Error("useUiSimulation must be used within a UiSimulationProvider");
  return ctx;
}
