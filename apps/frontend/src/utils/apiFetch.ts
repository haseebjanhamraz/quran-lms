const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: any) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(true);
    }
  });
  failedQueue = [];
};

/**
 * Enhanced fetch wrapper with automatic token refresh on HTTP 401 Unauthorized errors.
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!isFormData && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Attach stored access token if present as fallback/supplement to cookie
  if (typeof window !== 'undefined' && !headers['Authorization'] && !headers['authorization']) {
    const savedToken = localStorage.getItem('quran_lms_access_token');
    if (savedToken) {
      headers['Authorization'] = `Bearer ${savedToken}`;
    }
  }

  const mergedOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  let response = await fetch(url, mergedOptions);

  if (response.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/refresh')) {
    if (isRefreshing) {
      try {
        await new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
        if (typeof window !== 'undefined') {
          const freshToken = localStorage.getItem('quran_lms_access_token');
          if (freshToken) {
            headers['Authorization'] = `Bearer ${freshToken}`;
          }
        }
        return await fetch(url, { ...mergedOptions, headers });
      } catch (err) {
        return response;
      }
    }

    isRefreshing = true;

    try {
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (refreshRes.ok) {
        let refreshData: any = null;
        try {
          refreshData = await refreshRes.json();
          if (typeof window !== 'undefined') {
            if (refreshData?.accessToken) {
              localStorage.setItem('quran_lms_access_token', refreshData.accessToken);
              headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
            }
            if (refreshData?.user) {
              localStorage.setItem('quran_lms_auth_user', JSON.stringify(refreshData.user));
              window.dispatchEvent(new CustomEvent('auth:user-refreshed', { detail: refreshData.user }));
            }
          }
        } catch (_) {}

        processQueue(null);

        // If the original request was /auth/me, we already have the fresh user from /auth/refresh!
        if (url.includes('/auth/me') && refreshData?.user) {
          return new Response(JSON.stringify({ user: refreshData.user }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        response = await fetch(url, { ...mergedOptions, headers });
      } else {
        processQueue(new Error('Session refresh failed'));
        if (typeof window !== 'undefined') {
          localStorage.removeItem('quran_lms_access_token');
          localStorage.removeItem('quran_lms_auth_user');
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
      }
    } catch (refreshErr) {
      processQueue(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }

  return response;
}
