// middleware.js
import { NextResponse } from 'next/server'

export const config = {
  // match your generated worker files
  matcher: '/_app/immutable/workers/:path*',
};

export function middleware(req) {
  const res = NextResponse.next()
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  res.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
  res.headers.set('Cross-Origin-Resource-Policy', 'cross-origin')
  return res
}
