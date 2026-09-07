export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

const API_BASE: string = process.env.NEXT_PUBLIC_API_URL ?? "";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  let body: ApiResponse<T> | null = null;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    body = null;
  }

  if (!res.ok) {
    if (
      res.status === 401 &&
      typeof window !== "undefined" &&
      !path.includes("/api/auth/")
    ) {
      window.dispatchEvent(new CustomEvent("workpulse:unauthorized"));
    }
    throw new ApiError(res.status, body?.message ?? res.statusText);
  }

  return body?.data as T;
}

export const api = {
  get<T>(path: string) {
    return request<T>(path);
  },
  post<T>(path: string, data?: unknown) {
    return request<T>(path, {
      method: "POST",
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  },
  put<T>(path: string, data?: unknown) {
    return request<T>(path, {
      method: "PUT",
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  },
  patch<T>(path: string, data?: unknown) {
    return request<T>(path, {
      method: "PATCH",
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  },
  delete(path: string) {
    return request<{ message?: string }>(path, { method: "DELETE" });
  },
};
