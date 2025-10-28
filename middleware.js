// middleware.js
export const config = {
  matcher: '/_app/immutable/workers/:path*',
};

/**
 * Vercel Edge Middleware that adds COEP/COOP headers.
 */
export default async function middleware(req) {
  console.log('MIDDLEWARE! running for', req.nextUrl.pathname);

  // Let the asset pipeline handle the request normally,
  // but wrap the response so we can modify headers.
  const res = await fetch(req);

  const newHeaders = new Headers(res.headers);
  newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
  newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
  newHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: newHeaders,
  });
}
