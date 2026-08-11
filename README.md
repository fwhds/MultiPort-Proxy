# MultiPort-Proxy

[简体中文](README.zh-CN.md) · [PortPilot Chrome extension](https://github.com/huades/PortPilot)

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/huades/MultiPort-Proxy)

MultiPort-Proxy is a privacy-first web converter for creating deterministic, one-node-per-port Mihomo configurations. Paste a Clash/Mihomo YAML file or supported share links, select the nodes, and export both a runnable `mihomo.yaml` and a credential-free `browser-profiles.json` for PortPilot.

All parsing and generation happen locally in the browser. The site does not upload proxy credentials, fetch remote subscriptions, require an account, or control Mihomo/v2rayN processes.

## How it works

```text
Clash YAML / share links
          │
          ▼
 MultiPort-Proxy (browser-only parsing)
          │
          ├── mihomo.yaml ─────────────► Mihomo ─► 127.0.0.1:42000, 42001, ...
          │
          └── browser-profiles.json ───► PortPilot ─► Chrome proxy switching
```

The same nodes and start port always produce stable profile IDs and port mappings.

## Features

- Parses Clash/Mihomo YAML and multiline `vless://`, `vmess://`, `trojan://`, `ss://`, `socks://`, `http://`, and `https://` links.
- Creates one independent Mihomo `mixed`, `http`, or `socks` listener per selected node. A `mixed` listener exports both HTTP and SOCKS5 PortPilot profiles on the same local port.
- Preserves top-level DNS, proxy groups, and rules, and can generate a jump B → exit A `dialer-proxy` chain.
- Supports adding a node manually from a single-node YAML object.
- Defaults to `127.0.0.1`, port `42000`, and `mixed` listeners.
- Exports individual YAML/JSON files or one ZIP bundle.
- Supports Chinese/English switching in the web interface.
- Keeps upstream UUIDs, passwords, and server details out of the PortPilot JSON.

## Quick start

Requirements: Node.js 22+, npm 10+, and Mihomo for running the generated configuration. PortPilot is optional and is only needed for switching proxies in Chrome.

```powershell
git clone https://github.com/huades/MultiPort-Proxy.git
cd MultiPort-Proxy
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:3000`.

Useful commands:

```powershell
npm run typecheck     # TypeScript checks
npm test              # core parser/exporter tests
npm run build         # production Worker build
npm run package:deploy # create deployment ZIP files under release/
```

## User guide

### 1. Prepare node input

Use either:

- a local Clash/Mihomo YAML file; or
- share links copied/exported from v2rayN, one link per line.

In v2rayN, select the required servers and use the command that copies selected server share links to the clipboard. Menu wording can vary between versions. Do not paste a remote subscription URL: the MVP intentionally does not fetch subscriptions.

### 2. Parse and map nodes

1. Choose **Clash YAML** or **Share links**.
2. Paste the content, upload a local `.yaml`, `.yml`, or `.txt` file, then select **Parse nodes**.
3. Keep the nodes you want enabled.
4. Set the start port, listen host, and listener type. The recommended local settings are `42000`, `127.0.0.1`, and `mixed`.
5. Confirm that each selected node receives a different local port.

With `mixed`, each node appears twice in `browser-profiles.json`: one `[HTTP]` profile and one `[SOCKS5]` profile. They intentionally share the same port because a Mihomo mixed listener accepts both protocols.

Keep `127.0.0.1` unless you deliberately want other LAN devices to reach the listeners. Exposing listeners to the LAN may create an unauthenticated proxy endpoint.

### 3. Export and start Mihomo

Download `mihomo.yaml`, or use the ZIP download. Then start Mihomo from the directory containing the file:

```powershell
mihomo.exe -f .\mihomo.yaml
```

Leave Mihomo running. If it exits immediately, inspect its console output for unsupported node options, occupied ports, or malformed input.

### 4. Use the profiles in Chrome

1. Download `browser-profiles.json`.
2. Install/load the separate [PortPilot extension](https://github.com/huades/PortPilot) in Chrome developer mode.
3. Open PortPilot, import the JSON, and select a profile.
4. Run its connectivity or exit-IP check.
5. Select **Direct** in PortPilot to restore Chrome's normal network configuration.

PortPilot connects only to the local HTTP/SOCKS listeners. It does not connect directly to VLESS, VMess, or Trojan nodes; Mihomo performs that work.

## Deploy to Cloudflare Workers

This project deploys to **Cloudflare Workers**, not the legacy static Pages upload flow. Vinext generates the Worker entry point, asset binding, and deployment configuration under `apps/web/dist/server/`.

The committed root `wrangler.jsonc` lets Cloudflare recognize the Worker before the first build, so one-click deployment no longer enters automatic project configuration. It points to the generated `apps/web/dist/server/index.js` entry and `apps/web/dist/client` assets.

### One-click deployment

Select the **Deploy to Cloudflare** button above, sign in to Cloudflare and GitHub, confirm the generated repository and Worker name, then deploy. Cloudflare detects the root `build` and `deploy` scripts and creates a new repository under your Git account so future pushes can continue deploying through Workers Builds.

The source repository must remain public for the button to work. The deployment contains no proxy nodes or credentials; users provide configurations locally in their own browser.

### Connect the GitHub repository in Cloudflare (recommended)

This method needs no GitHub Actions workflow and no Cloudflare token stored in GitHub. Cloudflare Workers Builds owns the build and deployment.

1. Open **Workers & Pages → Create application** in Cloudflare.
2. Select **Get started** next to **Import a repository**.
3. Connect GitHub and authorize the **Cloudflare Workers and Pages** GitHub App.
4. Select the private `huades/MultiPort-Proxy` repository.
5. Set the Worker name to `multiport-web`; it must match the generated Wrangler configuration.

For an existing `multiport-web` Worker, open **Settings → Builds → Connect** instead of creating a duplicate.

#### Build settings

| Setting | Value |
|---|---|
| Production branch | `main` |
| Root directory | `/` |
| Build command | `npm run typecheck && npm test && npm run build` |
| Deploy command | `npm run deploy:cloudflare` |
| Non-production deploy command | `npm run preview:cloudflare` |

Keep the root at the repository root because `apps/web` depends on the `packages/core` workspace.

#### Save and deploy manually

1. Select **Save and Deploy** for the first build.
2. Later, open **Workers & Pages → multiport-web → Builds** and use **Retry build** or **Deploy** on the desired commit.
3. Pushes to `main` build automatically by default. To make deployment manual-only, disable automatic production-branch builds under **Settings → Builds**.
4. Use the resulting `*.workers.dev` address after the build succeeds.

Optional Build watch paths:

```text
apps/web/**
packages/core/**
package.json
package-lock.json
```

Non-production branches use `preview:cloudflare` and do not replace production.

#### Verify the deployment

Open the deployment URL and check language switching, demo parsing, port mappings, YAML/JSON previews, and downloads. View the active version and history under **Workers & Pages → multiport-web → Deployments**.

### Local CLI fallback

```powershell
npm install
npm run build
npx wrangler login
npm run deploy:cloudflare
```

Do not edit `dist/server/wrangler.json` directly; it is regenerated on every build. To connect your own hostname after deployment, open the Worker in Cloudflare and use its **Domains** tab to add a Custom Domain.

### Domains and rollback

- Custom domain: open **Workers & Pages → multiport-web → Settings → Domains & Routes → Add → Custom Domain**. The domain must be in the same Cloudflare account and must not have a conflicting CNAME.
- Rollback: open **Workers & Pages → multiport-web → Deployments**, open the menu for a known-good version, and select **Rollback**. You can also run `npx wrangler rollback` from `apps/web`.
- Use `workers.dev` for initial verification; Cloudflare recommends a Custom Domain or Worker Route for production traffic.

Cloudflare references: [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/), [Git integration](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/), [Build configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), and [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

### Deployment troubleshooting

- **Repository is not listed:** allow the Cloudflare GitHub App to access `huades/MultiPort-Proxy`.
- **Worker name mismatch:** the Cloudflare project must be named `multiport-web`.
- **Missing Worker entry:** keep Root directory as `/` and verify that the build produced `apps/web/dist/server/index.js`.
- **Linux native binding missing:** do not skip the root `prebuild`; it installs the matching Rolldown and Lightning CSS bindings on Linux.
- **Worker works but a custom domain does not:** confirm the domain is active in the same Cloudflare account and has no conflicting CNAME record.
- **A deployment broke the site:** open the Worker deployment history in Cloudflare and roll back to a known-good version.
- **Manual deployment only:** disable automatic production-branch builds under **Settings → Builds**, then trigger builds from the Builds page.

## Repository structure

```text
MultiPort-Proxy/
├── apps/web/          # converter UI and Cloudflare Worker
├── packages/core/     # parsers, validation, stable IDs, exporters
├── scripts/           # deliverable packaging
└── .github/workflows/ # GitHub CI (Cloudflare deploys with Workers Builds)
```

Chrome extension source is maintained exclusively in [huades/PortPilot](https://github.com/huades/PortPilot).

## Privacy and limitations

- Generated `mihomo.yaml` files contain upstream connection credentials and must be treated as secrets.
- `browser-profiles.json` contains only local proxy profiles, but review it before sharing.
- Remote subscription fetching, user accounts, telemetry, and automatic Mihomo/v2rayN process control are intentionally excluded.
- Browser extensions cannot implement VLESS/VMess/Trojan transports directly through Chrome proxy settings.
- Parsing support targets common formats; provider-specific or newer fields may still require manual Mihomo adjustments.

## License

No license file is currently included. Unless the repository owner adds one, source availability does not grant redistribution rights.
