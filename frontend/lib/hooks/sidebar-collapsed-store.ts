const STORAGE_KEY = "hydradb.sidebar-collapsed";

type Listener = () => void;

let collapsed = false;
let hydrated = false;
const listeners = new Set<Listener>();

function hydrateFromStorage() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  collapsed = window.localStorage.getItem(STORAGE_KEY) === "true";
}

export function getSidebarCollapsed(): boolean {
  hydrateFromStorage();
  return collapsed;
}

export function getSidebarCollapsedServerSnapshot(): boolean {
  return false;
}

export function setSidebarCollapsed(value: boolean) {
  collapsed = value;
  hydrated = true;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, String(value));
  }
  listeners.forEach((listener) => listener());
}

export function subscribeSidebarCollapsed(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
