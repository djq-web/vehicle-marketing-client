const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5010/api"
).replace(/\/$/, "");

export const AUTH_TOKEN_KEY = "vehicle_marketing_client_token";
export const AUTH_USER_KEY = "vehicle_marketing_client_user";

type QueryValue = string | number | boolean | null | undefined;

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: Record<string, unknown>;
  query?: Record<string, QueryValue>;
  headers?: Record<string, string>;
  skipAuth?: boolean;
};

type UploadOptions = {
  filePath: string;
  name?: string;
  fileName?: string;
  formData?: Record<string, string>;
  headers?: Record<string, string>;
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

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const params = Object.entries(query ?? {})
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join("&");

  return `${API_BASE_URL}${normalizedPath}${params ? `?${params}` : ""}`;
}

function getAuthHeaders(skipAuth?: boolean, headers?: Record<string, string>) {
  const mergedHeaders = {
    ...(headers ?? {}),
  };
  const token = uni.getStorageSync(AUTH_TOKEN_KEY);

  if (!skipAuth && token) {
    mergedHeaders.Authorization = `Bearer ${token}`;
  }

  return mergedHeaders;
}

function normalizePayload(data: unknown) {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  return data;
}

function resolveErrorMessage(payload: unknown, status: number) {
  if (payload && typeof payload === "object" && "message" in payload) {
    return String((payload as { message: unknown }).message);
  }

  return `请求失败：${status}`;
}

export function request<T>(path: string, options: RequestOptions = {}) {
  return new Promise<T>((resolve, reject) => {
    uni.request({
      url: buildUrl(path, options.query),
      method: options.method ?? "GET",
      data: options.data,
      header: getAuthHeaders(options.skipAuth, options.headers),
      success: (response) => {
        const status = response.statusCode;
        const payload = normalizePayload(response.data);

        if (status < 200 || status >= 300) {
          reject(new ApiError(resolveErrorMessage(payload, status), status, payload));
          return;
        }

        resolve(payload as T);
      },
      fail: (err) => {
        reject(new ApiError(err.errMsg || "网络请求失败", 0, err));
      },
    });
  });
}

export function upload<T>(path: string, options: UploadOptions) {
  return new Promise<T>((resolve, reject) => {
    uni.uploadFile({
      url: buildUrl(path),
      filePath: options.filePath,
      name: options.name ?? "file",
      fileName: options.fileName,
      formData: options.formData,
      header: getAuthHeaders(options.skipAuth, options.headers),
      success: (response) => {
        const status = response.statusCode;
        const payload = normalizePayload(response.data);

        if (status < 200 || status >= 300) {
          reject(new ApiError(resolveErrorMessage(payload, status), status, payload));
          return;
        }

        resolve(payload as T);
      },
      fail: (err) => {
        reject(new ApiError(err.errMsg || "文件上传失败", 0, err));
      },
    });
  });
}
