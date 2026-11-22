const rawUrl = import.meta.env.VITE_API_URL || "";
export const API_BASE_URL = rawUrl.replace(/\/$/, "");

export const APK_URL = `${API_BASE_URL}/downloads/monitoreo-servicios.apk`;
