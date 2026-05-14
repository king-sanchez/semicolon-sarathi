export interface SessionUser {
  userId: string;
  userName: string;
  username: string;
}

const TAB_SESSION_KEY = "gov_scheme_session";
const TAB_ID_KEY = "gov_scheme_tab_id";
const LAST_ACTIVITY_KEY = "gov_scheme_last_activity";
const TAB_CLOSE_GRACE_MS = 1500;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function createTabId(): string {
  return `tab_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function ensureTabId(): string {
  if (!isBrowser()) {
    return "";
  }

  let tabId = sessionStorage.getItem(TAB_ID_KEY);

  if (!tabId) {
    tabId = createTabId();
    sessionStorage.setItem(TAB_ID_KEY, tabId);
  }

  return tabId;
}

export function getStoredSession(): SessionUser | null {
  if (!isBrowser()) {
    return null;
  }

  const rawValue = sessionStorage.getItem(TAB_SESSION_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as SessionUser;
  } catch {
    sessionStorage.removeItem(TAB_SESSION_KEY);
    return null;
  }
}

export function setStoredSession(session: SessionUser): void {
  if (!isBrowser()) {
    return;
  }

  sessionStorage.setItem(TAB_SESSION_KEY, JSON.stringify(session));
  ensureTabId();
  markTabActive();
}

export function clearStoredSession(): void {
  if (!isBrowser()) {
    return;
  }

  sessionStorage.removeItem(TAB_SESSION_KEY);
  localStorage.removeItem(LAST_ACTIVITY_KEY);
}

export function getStoredUserId(): string {
  return getStoredSession()?.userId || "";
}

export function getStoredUserName(): string {
  return getStoredSession()?.userName || "";
}

export function getStoredUsername(): string {
  return getStoredSession()?.username || "";
}

export function isAuthenticated(): boolean {
  return Boolean(getStoredSession()?.userId);
}

export function markTabActive(): void {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
}

export function shouldInvalidateClosedTabSession(): boolean {
  if (!isBrowser()) {
    return false;
  }

  const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);

  if (!lastActivity) {
    return false;
  }

  const elapsed = Date.now() - Number(lastActivity);

  return Number.isFinite(elapsed) && elapsed > TAB_CLOSE_GRACE_MS;
}

export function initializeTabSession(): SessionUser | null {
  if (!isBrowser()) {
    return null;
  }

  ensureTabId();

  if (shouldInvalidateClosedTabSession()) {
    clearStoredSession();
    return null;
  }

  markTabActive();

  return getStoredSession();
}

// Made with Bob
