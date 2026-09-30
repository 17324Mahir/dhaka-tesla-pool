export type UserRole = "PASSENGER" | "DRIVER";

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
}

const USER_KEY = "user";
const TOKEN_KEY = "token";

interface TokenPayload {
  id?: string;
  role?: UserRole;
  exp?: number;
}

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const user = value as Partial<AuthUser>;

  return (
    typeof user.id === "string" &&
    typeof user.name === "string" &&
    (user.role === "PASSENGER" || user.role === "DRIVER")
  );
}

function decodeTokenPayload(token: string): TokenPayload | null {
  try {
    const encodedPayload = token.split(".")[1];

    if (!encodedPayload) {
      return null;
    }

    const base64 = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

    return JSON.parse(window.atob(paddedBase64)) as TokenPayload;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    return null;
  }

  const payload = decodeTokenPayload(token);

  if (!payload?.exp || payload.exp * 1000 <= Date.now()) {
    clearSession();
    return null;
  }

  return token;
}

export function saveSession(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const token = getStoredToken();
  const value = localStorage.getItem(USER_KEY);

  if (!token || !value) {
    clearSession();
    return null;
  }

  try {
    const user: unknown = JSON.parse(value);
    const payload = decodeTokenPayload(token);

    if (
      !isAuthUser(user) ||
      payload?.id !== user.id ||
      payload.role !== user.role
    ) {
      clearSession();
      return null;
    }

    return user;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
