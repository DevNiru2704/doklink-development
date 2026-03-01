/**
 * Django REST API client for the hospital dashboard.
 *
 * All Next.js API routes proxy through here to the Django backend,
 * replacing the old MongoDB direct-access pattern.
 *
 * The base URL should point to the Django server, e.g.
 *   http://localhost:8000/api/v1/hospital-dashboard
 */

const DJANGO_API_URL =
    process.env.DJANGO_API_URL || "http://localhost:8000/api/v1/hospital-dashboard";

interface FetchOptions {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
}

/**
 * Generic helper that forwards a request to Django and returns the parsed JSON.
 * Hospital / user context is passed via custom headers (same pattern as the
 * middleware already sets: x-hospital-id, x-user-id, x-user-role).
 */
export async function djangoFetch<T = any>(
    path: string,
    opts: FetchOptions = {},
    contextHeaders?: Record<string, string>
): Promise<{ data: T; status: number }> {
    const url = `${DJANGO_API_URL}${path}`;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(contextHeaders ?? {}),
        ...(opts.headers ?? {}),
    };

    const res = await fetch(url, {
        method: opts.method ?? "GET",
        headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        cache: "no-store",
    });

    const data = (await res.json().catch(() => null)) as T;
    return { data, status: res.status };
}

/**
 * Build the standard context headers from a Next.js request
 * (middleware injects x-hospital-id / x-user-role / x-user-id).
 */
export function extractContextHeaders(request: Request): Record<string, string> {
    const h: Record<string, string> = {};
    const hospitalId = request.headers.get("x-hospital-id");
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    if (hospitalId) h["X-Hospital-Id"] = hospitalId;
    if (userId) h["X-User-Id"] = userId;
    if (userRole) h["X-User-Role"] = userRole;
    return h;
}
