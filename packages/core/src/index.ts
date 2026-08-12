import { parse, stringify } from "yaml";
import type { ExtensionManifest, GenerateOptions, GeneratedBundle, ParseIssue, ParseResult, ParsedNode } from "./types";
export * from "./types";

const SUPPORTED = new Set(["vless", "vmess", "trojan", "ss", "socks", "socks5", "http", "https"]);

function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36).padStart(7, "0");
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Node must be an object");
  return value as Record<string, unknown>;
}

function nodeFromRaw(raw: Record<string, unknown>, index: number): ParsedNode {
  const name = String(raw.name || `Node ${index + 1}`);
  const type = String(raw.type || "").toLowerCase();
  if (!type) throw new Error(`Node “${name}” is missing its type`);
  if (!raw.server) throw new Error(`Node “${name}” is missing its server`);
  if (!Number.isInteger(Number(raw.port)) || Number(raw.port) < 1 || Number(raw.port) > 65535) {
    throw new Error(`Node “${name}” has an invalid port`);
  }
  const fingerprint = stringify({ ...raw, name: undefined });
  // Keep Clash/Mihomo proxy objects semantically lossless. In particular, do
  // not rebuild them from a known-field allowlist: newer Mihomo transports and
  // protocol options must survive a parse/generate round trip unchanged.
  return { id: `node-${stableHash(fingerprint)}`, name, type, raw: { ...raw } };
}

function nonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function validateNodeForExport(node: ParsedNode): ParseIssue[] {
  const issues: ParseIssue[] = [];
  if ((node.type === "vless" || node.type === "vmess") && !nonEmptyString(node.raw.uuid)) {
    issues.push({ message: `Node "${node.name}" (${node.type}) is missing uuid` });
  }
  if (node.type === "trojan" && !nonEmptyString(node.raw.password)) {
    issues.push({ message: `Node "${node.name}" (trojan) is missing password` });
  }
  if (node.type === "ss") {
    if (!nonEmptyString(node.raw.cipher)) issues.push({ message: `Node "${node.name}" (ss) is missing cipher` });
    if (!nonEmptyString(node.raw.password)) issues.push({ message: `Node "${node.name}" (ss) is missing password` });
  }
  const reality = node.raw["reality-opts"];
  if (reality !== undefined) {
    if (!reality || typeof reality !== "object" || Array.isArray(reality)) {
      issues.push({ message: `Node "${node.name}" has invalid reality-opts` });
    } else {
      const options = reality as Record<string, unknown>;
      if (!nonEmptyString(options["public-key"])) {
        issues.push({ message: `Node "${node.name}" uses Reality but is missing pbk (reality-opts.public-key)` });
      }
      if (!nonEmptyString(options["short-id"])) {
        issues.push({ message: `Node "${node.name}" uses Reality but is missing sid (reality-opts.short-id)` });
      }
    }
  }
  return issues;
}

export function validateNodesForExport(nodes: ParsedNode[]): ParseIssue[] {
  return nodes.flatMap(validateNodeForExport);
}

export function mergeParsedNodes(...groups: ParsedNode[][]): ParsedNode[] {
  const unique = new Map<string, ParsedNode>();
  groups.flat().forEach(node => {
    if (!unique.has(node.id)) unique.set(node.id, node);
  });
  return dedupeNames([...unique.values()]);
}

export function parseClashYaml(source: string): ParseResult {
  const issues: ParseIssue[] = [];
  try {
    const root = asObject(parse(source));
    if (!Array.isArray(root.proxies)) return { nodes: [], issues: [{ message: "No proxies array was found" }] };
    const nodes: ParsedNode[] = [];
    root.proxies.forEach((item, index) => {
      try { nodes.push(nodeFromRaw(asObject(item), index)); }
      catch (error) { issues.push({ message: error instanceof Error ? error.message : String(error) }); }
    });
    const parsedNodes = dedupeNames(nodes);
    issues.push(...validateNodesForExport(parsedNodes));
    return { nodes: parsedNodes, issues, baseConfig: root };
  } catch (error) {
    return { nodes: [], issues: [{ message: `Invalid YAML: ${error instanceof Error ? error.message : String(error)}` }] };
  }
}

function decodeBase64(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  if (typeof atob === "function") return decodeURIComponent(Array.from(atob(normalized), c => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""));
  return Buffer.from(normalized, "base64").toString("utf8");
}

function parseVmess(line: string): Record<string, unknown> {
  const data = JSON.parse(decodeBase64(line.slice("vmess://".length))) as Record<string, unknown>;
  return {
    name: data.ps || "VMess node", type: "vmess", server: data.add, port: Number(data.port), uuid: data.id,
    alterId: Number(data.aid || 0), cipher: data.scy || "auto", tls: data.tls === "tls", servername: data.sni || undefined,
    network: data.net || undefined,
    ...(data.net === "ws" ? { "ws-opts": { path: data.path || "/", headers: data.host ? { Host: data.host } : undefined } } : {})
  };
}

function parseUrlNode(line: string): Record<string, unknown> {
  const url = new URL(line);
  const type = url.protocol.slice(0, -1).toLowerCase();
  if (!SUPPORTED.has(type)) throw new Error(`Unsupported protocol: ${type}`);
  const q = url.searchParams;
  const raw: Record<string, unknown> = {
    name: decodeURIComponent(url.hash.slice(1)) || `${type.toUpperCase()} ${url.hostname}`,
    type: type === "socks5" ? "socks5" : type,
    server: url.hostname,
    port: Number(url.port || (type === "https" ? 443 : 80))
  };
  if (type === "vless") raw.uuid = decodeURIComponent(url.username);
  if (type === "trojan") raw.password = decodeURIComponent(url.username);
  if (["http", "https", "socks", "socks5"].includes(type)) {
    if (url.username) raw.username = decodeURIComponent(url.username);
    if (url.password) raw.password = decodeURIComponent(url.password);
  }
  if (type === "ss") {
    let user = decodeURIComponent(url.username);
    if (!user.includes(":")) user = decodeBase64(user);
    const [cipher, password] = user.split(":", 2);
    raw.cipher = cipher; raw.password = password;
  }
  const security = q.get("security")?.toLowerCase();
  if (security === "tls" || security === "reality") raw.tls = true;
  if (q.get("sni")) raw.servername = q.get("sni");
  if (q.get("type")) raw.network = q.get("type");
  if (q.get("fp")) raw["client-fingerprint"] = q.get("fp");
  if (q.get("flow")) raw.flow = q.get("flow");
  if (security === "reality") {
    // Always create reality-opts, even when required URI parameters are
    // missing, so validation can report the incomplete link before export.
    raw["reality-opts"] = {
      "public-key": q.get("pbk") || undefined,
      "short-id": q.get("sid") || undefined
    };
  }
  if (q.get("type") === "ws") raw["ws-opts"] = { path: q.get("path") || "/", headers: q.get("host") ? { Host: q.get("host") } : undefined };
  return raw;
}

export function parseShareLinks(source: string): ParseResult {
  const nodes: ParsedNode[] = [];
  const issues: ParseIssue[] = [];
  source.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) return;
    try {
      const raw = line.startsWith("vmess://") ? parseVmess(line) : parseUrlNode(line);
      const node = nodeFromRaw(raw, index);
      nodes.push(node);
      validateNodeForExport(node).forEach(issue => issues.push({ ...issue, line: index + 1 }));
    } catch (error) {
      issues.push({ line: index + 1, message: error instanceof Error ? error.message : String(error) });
    }
  });
  return { nodes: dedupeNames(nodes), issues };
}

export function parseManualNode(source: string): ParsedNode {
  const value = parse(source);
  return nodeFromRaw(asObject(value), 0);
}

function dedupeNames(nodes: ParsedNode[]): ParsedNode[] {
  const used = new Set<string>();
  return nodes.map(node => {
    if (!used.has(node.name)) {
      used.add(node.name);
      return node;
    }
    let count = 2;
    let name = `${node.name} (${count})`;
    while (used.has(name)) {
      count += 1;
      name = `${node.name} (${count})`;
    }
    used.add(name);
    return { ...node, name, raw: { ...node.raw, name } };
  });
}

export function generateBundle(nodes: ParsedNode[], options: GenerateOptions = {}): GeneratedBundle {
  const startPort = options.startPort ?? 42000;
  const host = options.host ?? "127.0.0.1";
  const listenerType = options.listenerType ?? "mixed";
  const mode = options.mode ?? "listeners";
  if (!Number.isInteger(startPort) || startPort < 1 || startPort + Math.max(nodes.length - 1, 0) > 65535) throw new Error("Generated port range must stay between 1 and 65535");
  if (!nodes.length) throw new Error("Select at least one node");
  const validationIssues = validateNodesForExport(nodes);
  if (validationIssues.length) throw new Error(`Cannot export: ${validationIssues.map(issue => issue.message).join("; ")}`);

  const listeners = nodes.map((node, index) => ({
    name: `in-${node.id}`,
    type: listenerType,
    port: startPort + index,
    listen: host,
    proxy: node.name
  }));
  const base = options.baseConfig ? { ...options.baseConfig } : {};
  let outputNodes = nodes.map(node => ({ ...node.raw }));
  let outputListeners: unknown[] | undefined = listeners;
  if (mode === "dialer-proxy") {
    const jump = nodes.find(node => node.id === options.jumpNodeId);
    const exit = nodes.find(node => node.id === options.exitNodeId);
    if (!jump || !exit) throw new Error("Select both a jump node and an exit node");
    if (jump.id === exit.id) throw new Error("Jump and exit nodes must be different");
    outputNodes = outputNodes.map(raw => raw.name === exit.name ? { ...raw, "dialer-proxy": jump.name } : raw);
    outputListeners = undefined;
  }
  const config: Record<string, unknown> = {
    ...base,
    "allow-lan": host !== "127.0.0.1" && host !== "localhost",
    mode: base.mode ?? "rule",
    "log-level": base["log-level"] ?? "info",
    proxies: outputNodes
  };
  if (mode === "listeners") config.listeners = outputListeners;
  if (!Array.isArray(config.rules)) config.rules = ["MATCH,DIRECT"];
  else config.rules = [...config.rules];
  if (mode === "dialer-proxy") delete config.listeners;
  const profiles = mode === "listeners" ? nodes.flatMap((node, index) => {
    const common = { host, port: startPort + index, tags: [node.type] };
    if (listenerType === "mixed") return [
      { id: `${node.id}-http`, name: `${node.name} [HTTP]`, scheme: "http" as const, ...common },
      { id: `${node.id}-socks5`, name: `${node.name} [SOCKS5]`, scheme: "socks5" as const, ...common }
    ];
    return [{ id: `${node.id}-${listenerType}`, name: node.name, scheme: listenerType === "socks" ? "socks5" as const : "http" as const, ...common }];
  }) : [];
  const extensionManifest: ExtensionManifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    profiles
  };
  return { mihomoYaml: stringify(config, { lineWidth: 0 }), extensionManifest };
}

export function validateExtensionManifest(value: unknown): ExtensionManifest {
  const root = asObject(value);
  if (root.schemaVersion !== 1 || !Array.isArray(root.profiles)) throw new Error("Unsupported extension manifest");
  const ids = new Set<string>();
  const profiles = root.profiles.map((item, index) => {
    const p = asObject(item);
    const scheme = String(p.scheme);
    if (!["http", "https", "socks4", "socks5"].includes(scheme)) throw new Error(`Profile ${index + 1} has an invalid scheme`);
    if (!p.id || ids.has(String(p.id))) throw new Error(`Profile ${index + 1} has a missing or duplicate id`);
    ids.add(String(p.id));
    const port = Number(p.port);
    if (!p.host || !Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`Profile ${index + 1} has an invalid endpoint`);
    return { id: String(p.id), name: String(p.name || p.id), scheme: scheme as "http" | "https" | "socks4" | "socks5", host: String(p.host), port, tags: Array.isArray(p.tags) ? p.tags.map(String) : undefined };
  });
  return { schemaVersion: 1, generatedAt: String(root.generatedAt || new Date(0).toISOString()), profiles };
}
