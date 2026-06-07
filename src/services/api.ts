const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5010/api"
).replace(/\/$/, "");
const DEFAULT_REQUEST_TIMEOUT_MS = Number(
  import.meta.env.VITE_API_TIMEOUT_MS || 120000,
);

export const API_LONG_REQUEST_TIMEOUT_MS = Number(
  import.meta.env.VITE_API_LONG_TIMEOUT_MS || 600000,
);

export const AUTH_TOKEN_KEY = "vehicle_marketing_client_token";
export const AUTH_USER_KEY = "vehicle_marketing_client_user";

type QueryValue = string | number | boolean | null | undefined;

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: Record<string, unknown>;
  query?: Record<string, QueryValue>;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  timeout?: number;
};

type DownloadOptions = {
  query?: Record<string, QueryValue>;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  timeout?: number;
  fileName?: string;
};

type UploadOptions = {
  filePath: string;
  name?: string;
  fileName?: string;
  formData?: Record<string, string>;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  timeout?: number;
};

type BrowserUploadOptions = {
  file: Blob;
  name?: string;
  fileName?: string;
  formData?: Record<string, string>;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  timeout?: number;
};

type UploadFileItem = {
  filePath: string;
  name?: string;
  fileName?: string;
};

type MultiUploadOptions = {
  files: UploadFileItem[];
  formData?: Record<string, string>;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  timeout?: number;
};

type BrowserUploadFileItem = {
  file: Blob;
  name?: string;
  fileName?: string;
};

type BrowserMultiUploadOptions = {
  files: BrowserUploadFileItem[];
  formData?: Record<string, string>;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  timeout?: number;
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
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    )
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join("&");

  return `${API_BASE_URL}${normalizedPath}${params ? `?${params}` : ""}`;
}

function resolveFilenameFromDisposition(value: string | null) {
  if (!value) {
    return "";
  }

  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(value)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      return encoded;
    }
  }

  return /filename="?([^";]+)"?/i.exec(value)?.[1] ?? "";
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
    const message = String((payload as { message: unknown }).message);

    if (/file too large|too large/i.test(message)) {
      return "文件大小超过限制";
    }

    return message;
  }

  if (status === 413) {
    return "文件大小超过限制";
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
      timeout: options.timeout ?? DEFAULT_REQUEST_TIMEOUT_MS,
      success: (response) => {
        const status = response.statusCode;
        const payload = normalizePayload(response.data);

        if (status < 200 || status >= 300) {
          reject(
            new ApiError(resolveErrorMessage(payload, status), status, payload),
          );
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
      timeout: options.timeout ?? API_LONG_REQUEST_TIMEOUT_MS,
      success: (response) => {
        const status = response.statusCode;
        const payload = normalizePayload(response.data);

        if (status < 200 || status >= 300) {
          reject(
            new ApiError(resolveErrorMessage(payload, status), status, payload),
          );
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

export function uploadFiles<T>(path: string, options: MultiUploadOptions) {
  return new Promise<T>((resolve, reject) => {
    const uploadOptions = {
      url: buildUrl(path),
      files: options.files.map((file) => ({
        name: file.name ?? "file",
        uri: file.filePath,
        fileName: file.fileName,
      })),
      formData: options.formData,
      header: getAuthHeaders(options.skipAuth, options.headers),
      timeout: options.timeout ?? API_LONG_REQUEST_TIMEOUT_MS,
      success: (response: UniApp.UploadFileSuccessCallbackResult) => {
        const status = response.statusCode;
        const payload = normalizePayload(response.data);

        if (status < 200 || status >= 300) {
          reject(
            new ApiError(resolveErrorMessage(payload, status), status, payload),
          );
          return;
        }

        resolve(payload as T);
      },
      fail: (err: UniApp.GeneralCallbackResult) => {
        reject(new ApiError(err.errMsg || "文件上传失败", 0, err));
      },
    };

    uni.uploadFile(uploadOptions as unknown as UniApp.UploadFileOption);
  });
}

export async function uploadBrowserFile<T>(
  path: string,
  options: BrowserUploadOptions,
) {
  const body = new FormData();

  Object.entries(options.formData ?? {}).forEach(([key, value]) => {
    body.append(key, value);
  });
  if (options.fileName) {
    body.append(options.name ?? "file", options.file, options.fileName);
  } else {
    body.append(options.name ?? "file", options.file);
  }

  const controller =
    typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutMs = options.timeout ?? API_LONG_REQUEST_TIMEOUT_MS;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    const response = await fetch(buildUrl(path), {
      method: "POST",
      body,
      headers: getAuthHeaders(options.skipAuth, options.headers),
      signal: controller?.signal,
    });
    const responseText = await response.text();
    const payload = normalizePayload(responseText);

    if (!response.ok) {
      throw new ApiError(
        resolveErrorMessage(payload, response.status),
        response.status,
        payload,
      );
    }

    return payload as T;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }

    const message =
      err instanceof DOMException && err.name === "AbortError"
        ? "文件上传超时"
        : err instanceof Error
          ? err.message
          : "文件上传失败";
    throw new ApiError(message, 0, err);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function uploadBrowserFiles<T>(
  path: string,
  options: BrowserMultiUploadOptions,
) {
  const body = new FormData();

  Object.entries(options.formData ?? {}).forEach(([key, value]) => {
    body.append(key, value);
  });
  options.files.forEach((file) => {
    if (file.fileName) {
      body.append(file.name ?? "file", file.file, file.fileName);
    } else {
      body.append(file.name ?? "file", file.file);
    }
  });

  const controller =
    typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutMs = options.timeout ?? API_LONG_REQUEST_TIMEOUT_MS;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    const response = await fetch(buildUrl(path), {
      method: "POST",
      body,
      headers: getAuthHeaders(options.skipAuth, options.headers),
      signal: controller?.signal,
    });
    const responseText = await response.text();
    const payload = normalizePayload(responseText);

    if (!response.ok) {
      throw new ApiError(
        resolveErrorMessage(payload, response.status),
        response.status,
        payload,
      );
    }

    return payload as T;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }

    const message =
      err instanceof DOMException && err.name === "AbortError"
        ? "文件上传超时"
        : err instanceof Error
          ? err.message
          : "文件上传失败";
    throw new ApiError(message, 0, err);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export function download(path: string, options: DownloadOptions = {}) {
  const url = buildUrl(path, options.query);
  const headers = getAuthHeaders(options.skipAuth, options.headers);

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    return fetch(url, {
      method: "GET",
      headers,
    }).then(async (response) => {
      if (!response.ok) {
        const payload = normalizePayload(await response.text());
        throw new ApiError(
          resolveErrorMessage(payload, response.status),
          response.status,
          payload,
        );
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download =
        options.fileName ||
        resolveFilenameFromDisposition(
          response.headers.get("content-disposition"),
        ) ||
        "download";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    });
  }

  return new Promise<void>((resolve, reject) => {
    uni.downloadFile({
      url,
      header: headers,
      timeout: options.timeout ?? API_LONG_REQUEST_TIMEOUT_MS,
      success: (response) => {
        const status = response.statusCode;

        if (status < 200 || status >= 300) {
          reject(new ApiError(`下载失败：${status}`, status, response));
          return;
        }

        uni.openDocument({
          filePath: response.tempFilePath,
          fileType: "pdf",
          success: () => resolve(),
          fail: (err) => reject(new ApiError(err.errMsg || "打开文件失败", 0, err)),
        });
      },
      fail: (err) => {
        reject(new ApiError(err.errMsg || "下载失败", 0, err));
      },
    });
  });
}
