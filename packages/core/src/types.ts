export type InputKind = "clash" | "share-links";
export type ListenerType = "mixed" | "http" | "socks";
export type ProxyScheme = "http" | "https" | "socks4" | "socks5";

export interface ParsedNode {
  id: string;
  name: string;
  type: string;
  raw: Record<string, unknown>;
}

export interface ParseIssue {
  line?: number;
  message: string;
}

export interface ParseResult {
  nodes: ParsedNode[];
  issues: ParseIssue[];
}

export interface ExtensionProfile {
  id: string;
  name: string;
  scheme: ProxyScheme;
  host: string;
  port: number;
  tags?: string[];
}

export interface ExtensionManifest {
  schemaVersion: 1;
  generatedAt: string;
  profiles: ExtensionProfile[];
}

export interface GenerateOptions {
  startPort?: number;
  host?: string;
  listenerType?: ListenerType;
}

export interface GeneratedBundle {
  mihomoYaml: string;
  extensionManifest: ExtensionManifest;
}
