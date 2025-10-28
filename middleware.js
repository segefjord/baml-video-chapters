// middleware.js
export const config = {
  matcher: '/_app/immutable/workers/:path*',
}

/**
 * Runs in Vercel Edge Runtime
 * @param {Request} request
 */
export default async function middleware(request) {
  // Clone the original request and forward it
  const res = await fetch(request);

  console.log("MIDDLEWARE!")

  // Clone the response so we can modify headers
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
