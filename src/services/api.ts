const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5010/api"
).replace(/\/$/, "");
const DEFAULT_REQUEST_TIMEOUT_MS = Number(
  import.meta.env.VITE_API_TIMEOUT_MS || 120000,
);

export const API_LONG_REQUEST_TIMEOUT_MS = Number(
  import.meta.env.VITE_API_LONG_TIMEOUT_MS || 1800000,
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

const exactErrorMessages: Record<string, string> = {
  "Missing auth user": "登录状态已失效，请重新登录",
  "Missing auth token": "登录状态已失效，请重新登录",
  "Invalid auth token": "登录状态已失效，请重新登录",
  "Invalid email or password": "账号或密码错误",
  "Admin account is not configured": "管理员账号未配置，请联系管理员",
  "Account not found": "账号不存在",
  "Current password is incorrect": "当前密码不正确",
  "Account is disabled": "账号已停用，请联系管理员",
  "Tenant is frozen or unavailable": "企业空间已冻结或不可用，请联系管理员",
  "Permission denied": "当前账号暂无操作权限",
  "Tenant user required": "请使用企业账号操作",
  "tenantId is required": "缺少企业信息，请重新登录后再试",
  "Feedback description is required": "请输入问题描述",
  "Feedback ticket not found": "反馈记录不存在",
  "Feedback attachments must be images": "反馈附件仅支持图片",
  "Failed to generate feedback ticket number": "反馈编号生成失败，请稍后重试",
  "Avatar file is required": "请选择头像图片",
  "Avatar must be an image": "头像文件必须是图片",
  "Invalid avatar file name": "头像文件名不合法",
  "Strategy framework not found": "未找到战略框架",
  "Strategy file is required": "请选择要上传的资料",
  "Strategy file cannot be empty": "上传资料不能为空",
  "Strategy file not found": "未找到该资料",
  "Strategy file is not linked to a tenant": "资料未关联企业，请重新上传",
  "Invalid strategy file path": "资料路径不合法",
  "Strategy diagnosis not found": "未找到战略诊断",
  "Strategy report not found": "未找到战略报告",
  "Strategy report content is empty": "战略报告内容为空",
  "Strategy framework content is invalid": "战略框架内容格式不正确",
  "Strategy tenant context is required": "缺少企业上下文，请重新登录后再试",
  "Strategy chat session not found": "未找到当前会话，请新建对话后再试",
  "Agent session does not belong to current user": "不能访问其他用户的会话",
  "Agent message not found": "未找到消息记录",
  "Agent session not found": "未找到会话记录",
  "Web search is disabled": "联网搜索服务暂未启用",
  "Search query is empty": "请输入搜索内容",
  "Bailian API key is not configured": "大模型服务暂未配置，请联系管理员",
  "Bailian response did not include assistant content":
    "大模型返回内容为空，请稍后重试",
  "LLM output is not a JSON object": "大模型返回格式异常，请稍后重试",
  "LLM output does not contain a JSON object": "大模型返回格式异常，请稍后重试",
  "OSS access key is not configured": "文件存储服务暂未配置，请联系管理员",
};

const errorMessageRules: Array<[RegExp, string]> = [
  [/file too large|too large|413/i, "文件大小超过限制"],
  [/failed to fetch|network\s*error|request:fail|net::/i, "网络请求失败，请检查网络后重试"],
  [/timeout|timed out|aborterror|aborted/i, "请求超时，请稍后重试"],
  [/unauthorized|forbidden/i, "当前账号暂无操作权限或登录已失效"],
  [/permission denied/i, "当前账号暂无操作权限"],
  [/cannot access .*another tenant/i, "不能访问其他企业的数据"],
  [/not found/i, "请求的内容不存在或已被删除"],
  [/currentpassword and newpassword are required/i, "请填写当前密码和新密码"],
  [/loginname, email or phone is required/i, "请输入账号"],
  [/bootstrap account profile cannot be updated/i, "内置管理员账号不支持修改资料"],
  [/strategy framework can only be confirmed/i, "请先生成当前企业战略框架，再确认"],
  [/strategy framework can only be updated/i, "请先确认当前企业战略框架，再提交修改"],
  [/strategy reports can only be generated/i, "请先确认当前企业战略框架，再生成报告"],
  [/only enterprise diagnosis and enterprise solution reports/i, "当前报告不需要在会话中确认"],
  [/must be generated before it can be confirmed/i, "请先生成报告，再进行确认"],
  [/enterprise diagnosis report must be confirmed/i, "请先确认企业战略诊断报告"],
  [/please specify a strategy point code/i, "请指定要修改的战略模块"],
  [/please specify a valid strategy point/i, "请指定有效的战略模块"],
  [/skill not found/i, "未找到对应能力，请联系管理员"],
  [/web search .*configured|search provider/i, "联网搜索服务暂不可用，请联系管理员"],
  [/bailian|dashscope|llm/i, "大模型服务暂不可用，请稍后重试"],
  [/oss .*not configured|storage .*not configured/i, "文件存储服务暂不可用，请联系管理员"],
  [/is invalid$/i, "输入内容格式不正确"],
];

function hasChineseText(value: string) {
  return /[\u3400-\u9fff]/.test(value);
}

function fallbackByStatus(status: number, fallback: string) {
  if (status === 400) {
    return "请求参数不正确，请检查后重试";
  }

  if (status === 401) {
    return "登录状态已失效，请重新登录";
  }

  if (status === 403) {
    return "当前账号暂无操作权限";
  }

  if (status === 404) {
    return "请求的内容不存在或已被删除";
  }

  if (status === 413) {
    return "文件大小超过限制";
  }

  if (status >= 500) {
    return "服务暂时不可用，请稍后重试";
  }

  return fallback;
}

export function toChineseErrorMessage(
  message: unknown,
  fallback = "操作失败，请稍后重试",
  status = 0,
) {
  const text = typeof message === "string" ? message.trim() : "";

  if (!text) {
    return fallbackByStatus(status, fallback);
  }

  const exact = exactErrorMessages[text];
  if (exact) {
    return exact;
  }

  for (const [pattern, translated] of errorMessageRules) {
    if (pattern.test(text)) {
      return translated;
    }
  }

  if (!hasChineseText(text) && /[A-Za-z]/.test(text)) {
    return fallbackByStatus(status, fallback);
  }

  return text;
}

export function getUserErrorMessage(
  error: unknown,
  fallback = "操作失败，请稍后重试",
) {
  if (error instanceof ApiError) {
    return toChineseErrorMessage(error.message, fallback, error.status);
  }

  if (error instanceof Error) {
    return toChineseErrorMessage(error.message, fallback);
  }

  if (typeof error === "string") {
    return toChineseErrorMessage(error, fallback);
  }

  return fallback;
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
    const rawMessage = (payload as { message: unknown }).message;
    const messages = Array.isArray(rawMessage) ? rawMessage : [rawMessage];
    const message = messages
      .map((item) => toChineseErrorMessage(item, "", status))
      .filter(Boolean)
      .join("；");

    return message || fallbackByStatus(status, `请求失败：${status}`);
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
          ? toChineseErrorMessage(err.message, "文件上传失败")
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
          ? toChineseErrorMessage(err.message, "文件上传失败")
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

export function fetchBlob(path: string, options: DownloadOptions = {}) {
  const url = buildUrl(path, options.query);
  const headers = getAuthHeaders(options.skipAuth, options.headers);

  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new ApiError("当前端暂不支持资料预览", 0, null));
  }

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

    return response.blob();
  });
}
