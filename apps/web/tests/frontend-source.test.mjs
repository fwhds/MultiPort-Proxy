import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageUrl = new URL("../app/page.tsx", import.meta.url);
const layoutUrl = new URL("../app/layout.tsx", import.meta.url);

test("ships the bilingual converter interface without starter content", async () => {
  const [page, layout] = await Promise.all([
    readFile(pageUrl, "utf8"),
    readFile(layoutUrl, "utf8"),
  ]);

  assert.match(page, /仅在浏览器本地处理/);
  assert.match(page, /Local-only browser processing/);
  assert.match(page, /browser-profiles\.json/);
  assert.match(page, /parseClashYaml/);
  assert.match(page, /parseShareLinks/);
  assert.match(page, /multiport-proxy-bundle\.zip/);
  assert.match(page, /useState<ListenerType>\("socks"\)/);
  assert.match(page, /multiport-theme/);
  assert.match(layout, /MultiPort-Proxy/);
  assert.doesNotMatch(page + layout, /Your site is taking shape|codex-preview|SkeletonPreview/);
});

test("keeps upstream secrets out of the browser profile explanation", async () => {
  const page = await readFile(pageUrl, "utf8");
  assert.match(page, /不包含上游 UUID、密码或服务器地址/);
  assert.match(page, /never upstream UUIDs, passwords, or server addresses/);
});
