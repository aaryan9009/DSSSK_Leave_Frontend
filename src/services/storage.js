// ============================================================================
// Persistent key/value storage for the app's login session.
//
// WHY NOT sessionStorage/localStorage directly:
// - sessionStorage lives only as long as the WebView instance. On Android,
//   swiping the app away from Recents (or the OS killing it in the
//   background) destroys that WebView instance, which wipes sessionStorage —
//   this was the cause of users getting logged out just from closing the app.
// - Capacitor's Preferences plugin stores data natively (SharedPreferences on
//   Android / UserDefaults on iOS), completely independent of the WebView
//   lifecycle, so it survives the app being closed, swiped from recents, or
//   the OS reclaiming memory. On plain web (e.g. `vite dev` in a browser)
//   Preferences transparently falls back to localStorage.
// ============================================================================
import { Preferences } from '@capacitor/preferences';

export async function getItem(key) {
  const { value } = await Preferences.get({ key });
  return value;
}

export async function setItem(key, value) {
  await Preferences.set({ key, value });
}

export async function removeItem(key) {
  await Preferences.remove({ key });
}
