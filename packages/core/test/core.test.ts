import assert from "node:assert/strict";
import test from "node:test";
import { generateBundle, parseClashYaml, parseShareLinks, validateExtensionManifest } from "../src/index";

const sample = `proxies:\n  - name: Demo\n    type: vless\n    server: example.com\n    port: 443\n    uuid: 00000000-0000-0000-0000-000000000001\n  - name: Demo\n    type: trojan\n    server: 192.0.2.10\n    port: 443\n    password: redacted`;

test("parses Clash YAML, deduplicates names, and generates stable ports", () => {
  const result = parseClashYaml(sample);
  assert.equal(result.issues.length, 0);
  assert.deepEqual(result.nodes.map(n => n.name), ["Demo", "Demo (2)"]);
  const generated = generateBundle(result.nodes, { startPort: 42000, listenerType: "mixed" });
  assert.match(generated.mihomoYaml, /port: 42001/);
  assert.deepEqual(generated.extensionManifest.profiles.map(p => p.port), [42000, 42001]);
  assert.doesNotThrow(() => validateExtensionManifest(generated.extensionManifest));
});

test("parses URI nodes and reports malformed input", () => {
  const result = parseShareLinks("vless://id@example.com:443?security=tls#Alpha\nnot-a-url");
  assert.equal(result.nodes[0].name, "Alpha");
  assert.equal(result.issues[0].line, 2);
});

test("rejects overflowing generated ports", () => {
  const nodes = parseClashYaml(sample).nodes;
  assert.throws(() => generateBundle(nodes, { startPort: 65535 }), /port range/);
});
