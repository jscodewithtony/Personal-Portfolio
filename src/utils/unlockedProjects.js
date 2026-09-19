const STORAGE_KEY = "unlocked_case_studies";

/**
 * Checks whether a project has been unlocked in this browser session.
 * Uses sessionStorage: persists across in-tab refreshes, but cleared
 * when the tab/window is closed. Never persists to localStorage.
 */
export function isProjectUnlocked(slug) {
  if (!slug || typeof window === "undefined") return false;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const list = JSON.parse(raw);
    return Array.isArray(list) && list.includes(slug);
  } catch {
    return false;
  }
}

/**
 * Records a project as unlocked in this browser session.
 */
export function unlockProject(slug) {
  if (!slug || typeof window === "undefined") return;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (Array.isArray(list)) {
      if (!list.includes(slug)) {
        list.push(slug);
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      }
    } else {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify([slug]));
    }
  } catch {
    // Graceful fallback if storage quota exceeded or disabled
  }
}
