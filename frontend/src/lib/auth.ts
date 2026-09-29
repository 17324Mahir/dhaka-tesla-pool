export type UserRole = "PASSENGER" | "DRIVER";

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
}

const USER_KEY = "user";

export function saveSession(token: string, user: AuthUser): void {
  localStorage.setItem("token", token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = localStorage.getItem(USER_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem("token");
  localStorage.removeItem(USER_KEY);
}
