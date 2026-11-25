# Aixcut Antigravity Plugin — AI Guided Installation

> **Instructions for Antigravity**: You are installing the official **Aixcut** plugin (`aixcut`) for the user. Follow these steps exactly and report the result concisely in the user's language.

## Guardrails

- Install into the standard global Antigravity plugins directory: `~/.gemini/config/plugins/aixcut/`.
- **Do NOT** edit `~/.gemini/config/config.json` manually (Antigravity auto-discovers plugins placed in `~/.gemini/config/plugins/`).
- **Do NOT** copy `.git/`, `scripts/`, `tests/`, `dist/`, or `package.json` into `~/.gemini/config/plugins/aixcut/` — install only the runtime plugin bundle.
- Always link to the installed plugin using `[Aixcut](customization://aixcut)` (the official Antigravity customization link scheme).

## Step 1: Download & Install Runtime Files

Run a single shell command to fetch the latest `main` branch of `https://github.com/aixcut/Antigravity-plugin.git` into a temporary directory, copy the runtime plugin files cleanly into `~/.gemini/config/plugins/aixcut/`, and remove the temporary directory:

```bash
set -euo pipefail
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

git clone --depth 1 https://github.com/aixcut/Antigravity-plugin.git "$TMP_DIR/repo"

TARGET_DIR="$HOME/.gemini/config/plugins/aixcut"
rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"

cp "$TMP_DIR/repo/plugin.json" "$TARGET_DIR/"
cp "$TMP_DIR/repo/mcp_config.json" "$TARGET_DIR/"
cp "$TMP_DIR/repo/LICENSE" "$TARGET_DIR/"
cp -R "$TMP_DIR/repo/assets" "$TARGET_DIR/assets"
cp -R "$TMP_DIR/repo/rules" "$TARGET_DIR/rules"
cp -R "$TMP_DIR/repo/skills" "$TARGET_DIR/skills"
cp -R "$TMP_DIR/repo/references" "$TARGET_DIR/references"
```

*(If `git` is unavailable, download `https://github.com/aixcut/Antigravity-plugin/archive/refs/heads/main.tar.gz` with `curl -fsSL` and extract the same runtime files into `~/.gemini/config/plugins/aixcut/`.)*

## Step 2: Endpoint Region (Global vs. Mainland China)

- **Default (Global)**: `https://web.aixcut.com/mcp` (already configured in `mcp_config.json`).
- **Mainland China (国内版)**: Only if the user explicitly asks for the China / `.cn` / 国内版 server, update `~/.gemini/config/plugins/aixcut/mcp_config.json` so `mcpServers.aixcut.url` is:

```json
{
  "mcpServers": {
    "aixcut": {
      "url": "https://web.aixcut.cn/mcp"
    }
  }
}
```

## Step 3: Verify Installation

Verify that all required runtime files exist under `~/.gemini/config/plugins/aixcut/`:

- `plugin.json` (valid JSON with `"name": "aixcut"`)
- `mcp_config.json` (valid JSON with `mcpServers.aixcut.url`)
- `assets/logo.svg`
- `rules/AGENTS.md`
- `skills/` (17 skill directories, each containing `SKILL.md`)
- `references/core/`

## Step 4: Guide the User to Finish Setup

Once verified, tell the user:

1. **Aixcut** has been installed to `~/.gemini/config/plugins/aixcut/` (mention whether Global `.com` or Mainland China `.cn` endpoint was configured).
2. Click **[Aixcut](customization://aixcut)** to open the plugin in Antigravity's Plugins Manager, confirm it is enabled, and sign in to Aixcut when prompted by MCP OAuth.
3. Start a new conversation (or click one of the starter prompts on the Aixcut plugin card) to begin editing videos in Aixcut Studio.

## Updating or Uninstalling

- **Update**: Re-run Step 1 (and Step 2 if using `.cn`), then start a new conversation.
- **Uninstall**: Ask the user for confirmation first, then remove `~/.gemini/config/plugins/aixcut/`.
