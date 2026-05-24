const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5010/api";
const AUTH_TOKEN_KEY = "vehicle_marketing_client_token";

type RequestOptions = {
  method?: string;
  body?: BodyInit | Record<string, unknown>;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | null | undefined>;
  skipAuth?: boolean;
};

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(message: string, status: number, detail: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export async function request<T>(path: string, options: RequestOptions = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);

  Object.entries(options.query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  };
  const init: RequestInit = {
    method: options.method ?? "GET",
    headers,
    credentials: "include",
  };

  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (!options.skipAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body instanceof FormData) {
    init.body = options.body;
  } else if (options.body) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, init);
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message: unknown }).message)
        : `请求失败：${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}
