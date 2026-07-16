import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  const hasTokens = accessToken || refreshToken;

  const isDashboardRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/teacher') ||
    pathname.startsWith('/student') ||
    pathname.startsWith('/reviewer');

  // 1. Redirect unauthenticated users trying to access dashboard routes to login page
  if (isDashboardRoute && !hasTokens) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Redirect logged-in users trying to access /login to their corresponding dashboards
  if (pathname === '/login' && hasTokens) {
    let role = 'STUDENT';
    const decoded = accessToken ? decodeJwt(accessToken) : (refreshToken ? decodeJwt(refreshToken) : null);
    if (decoded && decoded.role) {
      role = decoded.role;
    }

    const redirectPath = `/${role.toLowerCase()}/dashboard`;
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // 3. Simple Client-Side Role Guard redirection to prevent accessing other portal layers
  if (isDashboardRoute && hasTokens) {
    const token = accessToken || refreshToken;
    const decoded = token ? decodeJwt(token) : null;
    if (decoded && decoded.role) {
      const userRole = decoded.role.toLowerCase();

      if (pathname.startsWith('/admin') && userRole !== 'admin') {
        return NextResponse.redirect(new URL(`/${userRole}/dashboard`, request.url));
      }
      if (pathname.startsWith('/teacher') && userRole !== 'teacher') {
        return NextResponse.redirect(new URL(`/${userRole}/dashboard`, request.url));
      }
      if (pathname.startsWith('/student') && userRole !== 'student') {
        return NextResponse.redirect(new URL(`/${userRole}/dashboard`, request.url));
      }
      if (pathname.startsWith('/reviewer') && userRole !== 'reviewer') {
        return NextResponse.redirect(new URL(`/${userRole}/dashboard`, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/admin/:path*', '/teacher/:path*', '/student/:path*', '/reviewer/:path*'],
};
