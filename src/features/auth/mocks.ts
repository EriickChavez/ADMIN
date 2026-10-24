import { http, HttpResponse } from "msw";
import { API_URL } from "../../api/client";
import { errorResponse } from "../../mocks/utils";
import { DEMO_USER_ID, SESSION_KEY } from "../../mocks/session";
import type { LoginRequest, RegisterRequest, User } from "./types";

type StoredUser = User & { password: string };

const USERS_KEY = "mock_users";

const seed: StoredUser[] = [
  {
    id: DEMO_USER_ID,
    email: "demo@example.com",
    displayName: "Usuario Demo",
    avatarUrl: null,
    isActive: true,
    password: "123456",
  },
];

const getUsers = (): StoredUser[] => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw) as StoredUser[];
  } catch {
    // si el JSON está corrupto, se usa el seed
  }
  return seed;
};

const saveUsers = (users: StoredUser[]) =>
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

const toPublic = ({ password: _password, ...user }: StoredUser): User => user;

const currentUser = () => {
  const id = localStorage.getItem(SESSION_KEY);
  return getUsers().find((u) => u.id === id) ?? null;
};

export const authHandlers = [
  http.post(`${API_URL}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as RegisterRequest;
    const users = getUsers();
    if (users.some((u) => u.email === body.email)) {
      return errorResponse(409, "EMAIL_ALREADY_EXISTS", "El correo ya está registrado");
    }
    const user: StoredUser = {
      id: crypto.randomUUID(),
      email: body.email,
      displayName: body.displayName,
      avatarUrl: null,
      isActive: true,
      password: body.password,
    };
    saveUsers([...users, user]);
    localStorage.setItem(SESSION_KEY, user.id);
    return HttpResponse.json({ user: toPublic(user) }, { status: 201 });
  }),

  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as LoginRequest;
    const user = getUsers().find(
      (u) => u.email === body.email && u.password === body.password
    );
    if (!user) {
      return errorResponse(401, "INVALID_CREDENTIALS", "Correo o contraseña incorrectos");
    }
    localStorage.setItem(SESSION_KEY, user.id);
    return HttpResponse.json({ user: toPublic(user) });
  }),

  http.post(`${API_URL}/auth/logout`, () => {
    localStorage.removeItem(SESSION_KEY);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${API_URL}/auth/logout-all`, () => {
    localStorage.removeItem(SESSION_KEY);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API_URL}/auth/me`, () => {
    const user = currentUser();
    if (!user) return errorResponse(401, "UNAUTHORIZED", "No hay sesión activa");
    return HttpResponse.json({ user: toPublic(user) });
  }),
];