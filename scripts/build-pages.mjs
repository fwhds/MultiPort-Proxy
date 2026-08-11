import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const web = path.join(root, "apps", "web");
const client = path.join(web, "dist", "client");
const output = path.join(web, "dist", "pages");
const workerPath = path.join(web, "dist", "server", "index.js");

await mkdir(output, { recursive: true });
await cp(client, output, { recursive: true, force: true });

const { default: worker } = await import(`${pathToFileURL(workerPath).href}?pages=${Date.now()}`);
const response = await worker.fetch(
  new Request("https://multiport-proxy.pages.dev/", { headers: { accept: "text/html" } }),
  { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
  { waitUntil() {}, passThroughOnException() {} },
);

if (!response.ok) throw new Error(`Unable to prerender /: HTTP ${response.status}`);
const html = await response.text();
if (!html.includes("MULTIPORT") || !html.includes("browser-profiles.json")) {
  throw new Error("Prerendered HTML did not contain the converter application");
}
await writeFile(path.join(output, "index.html"), html);
await writeFile(path.join(output, "404.html"), html);

const headers = await readFile(path.join(client, "_headers"), "utf8").catch(() => "");
if (headers) await writeFile(path.join(output, "_headers"), headers);
console.log(`Cloudflare Pages output: ${output}`);
