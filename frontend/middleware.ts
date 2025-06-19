import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // 只拦截 /profile 相关页面
  if (request.nextUrl.pathname.startsWith('/profile')) {
    // 读取 cookie
    const token = request.cookies.get('token')?.value;
    if (!token) {
      // 未登录，重定向到登录页
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  // 其他情况放行
  return NextResponse.next();
}

// 配置拦截的路由
export const config = {
  matcher: ['/profile/:path*'],
}; 