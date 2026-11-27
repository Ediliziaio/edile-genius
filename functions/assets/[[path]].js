// Stack-trace locations are not public pages or real build assets.
// Keep the application fallback for every other request.
export function onRequest({ request, next }) {
  const pathname = new URL(request.url).pathname;
  if (
    (request.method === "GET" || request.method === "HEAD") &&
    /^\/assets\/.+\.(?:m?js|css)(?::|%3a)\d+(?:(?::|%3a)\d+)?$/i.test(pathname)
  ) {
    return new Response(request.method === "HEAD" ? null : "Risorsa non trovata.\n", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Robots-Tag": "noindex, follow",
        "Cache-Control": "no-store",
      },
    });
  }
  return next();
}
