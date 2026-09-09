import { createId } from "@/domain/ids";

const DEVICE_KEY = "sahayak-device-id";

/**
 * Stable ID for this classroom device. Not a credential — it is how the
 * backend recognises a trusted shared device and binds it to a
 * teacher/classroom. The sensitive part (session token) lives in the
 * encrypted IndexedDB vault instead.
 */
export function getOrCreateDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;
    const id = createId("dev");
    localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    // Storage unavailable (private mode) — stable for this page load.
    if (typeof sessionStorage !== "undefined") {
      const existing = sessionStorage.getItem(DEVICE_KEY);
      if (existing) return existing;
    }
    const id = createId("dev");
    try {
      sessionStorage.setItem(DEVICE_KEY, id);
    } catch {
      /* ignore */
    }
    return id;
  }
}