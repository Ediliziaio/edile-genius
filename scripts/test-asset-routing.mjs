import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { onRequest } from "../functions/assets/[[path]].js";

const routes = JSON.parse(readFileSync(new URL("../public/_routes.json", import.meta.url)));
const match = (pattern, pathname) => new RegExp("^" + pattern.split("*").map(p => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$").test(pathname);
const invokesFunction = path => routes.include.some(p => match(p, path)) && !routes.exclude.some(p => match(p, path));
const broken = [
  "/assets/vendor-react-Ciy1NMBU.js:42:4217",
  "/assets/app-ViPGmznR.js:2:23445",
  ...[5190, 5561, 5019, 4625, 4551].map(column => `/assets/vendor-react-Ciy1NMBU.js:42:${column}`),
  "/assets/app-ViPGmznR.js%3A2%3A23445",
  "/assets/style.css:1:20",
];
for (const path of broken) {
  assert.equal(invokesFunction(path), true, path);
  for (const method of ["GET", "HEAD"]) {
    const response = await onRequest({ request: new Request(`https://edilizia.io${path}`, { method }), next: () => { throw new Error("Unexpected SPA fallback"); } });
    assert.equal(response.status, 404, path);
    assert.match(response.headers.get("X-Robots-Tag"), /noindex/);
    if (method === "HEAD") assert.equal(await response.text(), "");
  }
}
for (const path of ["/assets/app-real.js", "/assets/style.css", "/assets/cover.webp", "/", "/servizi", "/blog/esempio", "/login", "/app/cantieri"]) {
  assert.equal(invokesFunction(path), false, path);
  const original = new Response("Existing route", { status: 200 });
  assert.equal(await onRequest({ request: new Request(`https://edilizia.io${path}`), next: () => original }), original);
}
const original = new Response("Original method handler", { status: 405 });
assert.equal(await onRequest({ request: new Request(`https://edilizia.io${broken[0]}`, { method: "POST" }), next: () => original }), original);
console.log("Asset routing verified: seven reported URLs, encoded locations, HEAD, real assets and application routes.");
