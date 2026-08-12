import assert from "node:assert/strict";
import test from "node:test";
import { parse as parseYaml } from "yaml";
import { generateBundle, mergeParsedNodes, parseClashYaml, parseShareLinks, validateExtensionManifest, validateNodesForExport } from "../src/index";

const sample = `proxies:\n  - name: Demo\n    type: vless\n    server: example.com\n    port: 443\n    uuid: 00000000-0000-0000-0000-000000000001\n  - name: Demo\n    type: trojan\n    server: 192.0.2.10\n    port: 443\n    password: redacted`;

test("parses Clash YAML, deduplicates names, and generates stable ports", () => {
  const result = parseClashYaml(sample);
  assert.equal(result.issues.length, 0);
  assert.deepEqual(result.nodes.map(n => n.name), ["Demo", "Demo (2)"]);
  const generated = generateBundle(result.nodes, { startPort: 42000, listenerType: "mixed" });
  assert.match(generated.mihomoYaml, /port: 42001/);
  assert.deepEqual(generated.extensionManifest.profiles.map(p => p.port), [42000, 42000, 42001, 42001]);
  assert.deepEqual(generated.extensionManifest.profiles.map(p => p.scheme), ["http", "socks5", "http", "socks5"]);
  assert.doesNotThrow(() => validateExtensionManifest(generated.extensionManifest));
});

test("preserves the base config and creates a dialer-proxy chain", () => {
  const source = `${sample}\ndns:\n  enable: true\nproxy-groups:\n  - name: Select\n    type: select\n    proxies: [Demo, Demo (2)]\nrules:\n  - MATCH,Select`;
  const parsed = parseClashYaml(source);
  const generated = generateBundle(parsed.nodes, { baseConfig: parsed.baseConfig, mode: "dialer-proxy", jumpNodeId: parsed.nodes[0].id, exitNodeId: parsed.nodes[1].id });
  assert.match(generated.mihomoYaml, /dialer-proxy: Demo/);
  assert.match(generated.mihomoYaml, /enable: true/);
  assert.match(generated.mihomoYaml, /MATCH,Select/);
  assert.equal(generated.extensionManifest.profiles.length, 0);
});

test("parses URI nodes and reports malformed input", () => {
  const result = parseShareLinks("vless://id@example.com:443?security=tls#Alpha\nnot-a-url");
  assert.equal(result.nodes[0].name, "Alpha");
  assert.equal(result.issues[0].line, 2);
});

test("preserves every Clash proxy field when generating listeners", () => {
  const source = `proxies:
  - name: Reality node
    type: vless
    server: example.com
    port: 443
    uuid: 00000000-0000-0000-0000-000000000001
    tls: true
    flow: xtls-rprx-vision
    client-fingerprint: chrome
    servername: www.example.com
    reality-opts:
      public-key: public-key-value
      short-id: 0123456789abcdef
    x-future-option:
      nested: preserved
`;
  const parsed = parseClashYaml(source);
  const originalProxy = (parseYaml(source) as { proxies: unknown[] }).proxies[0];
  assert.deepEqual(parsed.nodes[0].raw, originalProxy);

  const generated = parseYaml(generateBundle(parsed.nodes, { listenerType: "socks" }).mihomoYaml) as { proxies: unknown[] };
  assert.deepEqual(generated.proxies[0], originalProxy);
});

test("maps complete Reality URI parameters to Mihomo fields", () => {
  const result = parseShareLinks("vless://00000000-0000-0000-0000-000000000001@example.com:443?security=reality&pbk=public-key-value&sid=0123456789abcdef&flow=xtls-rprx-vision&fp=chrome&sni=www.example.com#Reality");
  assert.equal(result.issues.length, 0);
  assert.deepEqual(result.nodes[0].raw, {
    name: "Reality",
    type: "vless",
    server: "example.com",
    port: 443,
    uuid: "00000000-0000-0000-0000-000000000001",
    tls: true,
    servername: "www.example.com",
    "client-fingerprint": "chrome",
    flow: "xtls-rprx-vision",
    "reality-opts": {
      "public-key": "public-key-value",
      "short-id": "0123456789abcdef"
    }
  });
  assert.deepEqual(validateNodesForExport(result.nodes), []);
  assert.doesNotThrow(() => generateBundle(result.nodes));
});

test("reports and blocks incomplete Reality links before export", () => {
  const result = parseShareLinks("vless://00000000-0000-0000-0000-000000000001@example.com:443?security=reality&fp=chrome&sni=www.example.com#Incomplete");
  assert.equal(result.nodes.length, 1);
  assert.equal(result.issues.length, 2);
  assert.match(result.issues[0].message, /missing pbk/);
  assert.match(result.issues[1].message, /missing sid/);
  assert.throws(() => generateBundle(result.nodes), /Cannot export:.*missing pbk.*missing sid/);
});

test("reports and blocks protocols with missing required credentials", () => {
  const parsed = parseClashYaml(`proxies:
  - name: Broken Trojan
    type: trojan
    server: example.com
    port: 443
  - name: Broken Shadowsocks
    type: ss
    server: example.net
    port: 8388
    cipher: aes-128-gcm
`);
  assert.equal(parsed.nodes.length, 2);
  assert.deepEqual(parsed.issues.map(issue => issue.message), [
    'Node "Broken Trojan" (trojan) is missing password',
    'Node "Broken Shadowsocks" (ss) is missing password'
  ]);
  assert.throws(() => generateBundle(parsed.nodes), /Cannot export:.*missing password/);
});

test("merges YAML and share-link nodes with deterministic names", () => {
  const yaml = parseClashYaml(sample);
  const links = parseShareLinks("trojan://secret@example.net:443#Demo");
  const merged = mergeParsedNodes(yaml.nodes, links.nodes);
  assert.deepEqual(merged.map(node => node.name), ["Demo", "Demo (2)", "Demo (3)"]);
  assert.equal(merged[2].raw.password, "secret");
});

test("rejects overflowing generated ports", () => {
  const nodes = parseClashYaml(sample).nodes;
  assert.throws(() => generateBundle(nodes, { startPort: 65535 }), /port range/);
});
