const KEY = "doc2struct_notifications_enabled";

export function notificationsEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem(KEY);
  return v === null ? true : v === "true";
}

export function setNotificationsEnabled(enabled: boolean): void {
  localStorage.setItem(KEY, String(enabled));
}
