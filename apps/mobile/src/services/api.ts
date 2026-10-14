
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export type FikraUser = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  xp: number;
  level: number;
};

export type FikraProject = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type LoginResponse = {
  success: boolean;
  message: string;
  accessToken: string;
  user: FikraUser;
};

type ProjectsResponse = {
  success: boolean;
  projects: FikraProject[];
};

type CurrentUserResponse = {
  success: boolean;
  user: FikraUser;
};

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  if (!API_URL) {
    throw new Error(
      "Fikra API URL is not configured."
    );
  }

  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Unable to connect to Fikra API. Check your connection."
    );
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        "Your session has expired or your login details are incorrect."
      );
    }

    let message = "The request could not be completed.";

    try {
      const data = await response.json();

      if (typeof data.message === "string") {
        message = data.message;
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function loginUser(
  email: string,
  password: string
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email: email.trim(),
        password,
      }),
    }
  );
}

export async function getCurrentUser(
  token: string
): Promise<FikraUser> {
  const response = await apiRequest<CurrentUserResponse>(
    "/api/auth/me",
    { method: "GET" },
    token
  );

  return response.user;
}

export async function getProjects(
  token: string
): Promise<FikraProject[]> {
  const response = await apiRequest<ProjectsResponse>(
    "/api/projects",
    { method: "GET" },
    token
  );

  return response.projects;
}
