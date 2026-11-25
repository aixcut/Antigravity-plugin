# Aixcut Plugin for Antigravity

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Aixcut** is an all-in-one AI video editing plugin for **Google Antigravity**, connecting Antigravity to **Aixcut Studio** via remote Streamable HTTP MCP and 17 specialized editing skills (talking-head fine cuts, livestream clips, e-commerce feed ads, TV commercials, batch matrix production, captions, dubbing, visual effects, and project export).

---

## 一句话安装（推荐 / Quick Install）

把下面这句提示词复制到你电脑上 **Antigravity** 的任意对话里，AI 会自动帮你完成下载、安装与校验：

```text
阅读 https://raw.githubusercontent.com/aixcut/Antigravity-plugin/main/INSTALL.md，帮我安装 Aixcut
```

如需连接**中国大陆国内版**（`https://web.aixcut.cn/mcp`），可发送：

```text
阅读 https://raw.githubusercontent.com/aixcut/Antigravity-plugin/main/INSTALL.md，帮我安装 Aixcut（使用国内版 .cn 节点）
```

> 安装完成后，在 Antigravity 中打开插件管理页，启用 **Aixcut** 并在首次调用时完成 OAuth 登录授权即可开始剪辑。

---

## 手动安装 / Manual Install

```bash
git clone --depth 1 https://github.com/aixcut/Antigravity-plugin.git /tmp/aixcut-antigravity
mkdir -p ~/.gemini/config/plugins/aixcut
cp /tmp/aixcut-antigravity/{plugin.json,mcp_config.json,LICENSE} ~/.gemini/config/plugins/aixcut/
cp -R /tmp/aixcut-antigravity/{assets,rules,skills,references} ~/.gemini/config/plugins/aixcut/
rm -rf /tmp/aixcut-antigravity
```

---

## 目录结构 / Repository Layout

```text
Antigravity-plugin/
├── plugin.json          # Antigravity official plugin manifest
├── mcp_config.json      # Remote Streamable HTTP MCP server (web.aixcut.com/mcp)
├── assets/
│   └── logo.svg         # Plugin icon
├── rules/
│   └── AGENTS.md        # Always-on Antigravity orchestration rules
├── skills/              # 17 progressive-disclosure Aixcut editing skills
├── references/core/     # Shared orchestration, quality gates & workflow policies
├── INSTALL.md           # AI-executable installation guide
├── scripts/             # Validation & release packaging scripts (dev-only)
└── tests/               # Automated compliance & anti-leakage tests
```

## 内置技能 / Bundled Skills (17)

| Category | Skills |
| :--- | :--- |
| **Core & Host** | `aixcut-basics`, `aixcut-host`, `aixcut-projects`, `aixcut-known-errors` |
| **Editing & Scenarios** | `aixcut-timeline-editing`, `aixcut-talking-head`, `aixcut-scenarios`, `aixcut-video-assembly` |
| **Audio, Captions & VFX** | `aixcut-captions`, `aixcut-voice`, `aixcut-visual-effects`, `aixcut-generation`, `aixcut-documents` |
| **Verification & Delivery** | `aixcut-verification`, `aixcut-export`, `aixcut-login`, `aixcut-mcp-logout` |

---

## 校验与打包 / Validation & Packaging

```bash
# Run schema, frontmatter, and zero-leakage validation + unit tests
npm test

# Build release ZIPs for both Global (.com) and China (.cn)
npm run package
```

## 官方 Marketplace 上线说明 / Official Marketplace Readiness

This repository strictly follows Google Antigravity's native plugin specification:
- `plugin.json` contains only official Antigravity manifest keys (`name`, `displayName`, `description`, `version`, `author`, `homepage`, `repository`, `logo`, `suggestedPrompts`).
- `mcp_config.json` uses native Streamable HTTP (`url`) with zero custom wrapper scripts or local loopback servers.
- `rules/AGENTS.md` uses plain Markdown without frontmatter.
- All 17 `skills/*/SKILL.md` files declare valid YAML frontmatter (`name` + `description`) and pass automated zero-leakage validation.
