---
name: aixcut-host
description: Antigravity-specific adapter for Aixcut MCP OAuth, browser handoff, local-media uploads, workflow checkpoints, and export delivery. Use alongside aixcut-basics whenever an Aixcut workflow interacts with Antigravity host capabilities.
---

# Aixcut Antigravity Host Adapter

This Skill defines how Aixcut workflows integrate with **Antigravity**.

## 1. OAuth & Authorization

- Antigravity connects to the Aixcut remote Streamable HTTP MCP server (`mcp_config.json`) and manages OAuth at the transport layer.
- Never call `aixcut_login` proactively before calling a business MCP tool.
- If authorization is missing, expired, or inactive (`MCP_AUTH_GRANT_INACTIVE` / `MCP_SCOPE_REQUIRED`):
  - Do not retry the rejected business call with the stale token.
  - Guide the user to sign in or reconnect Aixcut in the Plugins Manager (`[Aixcut](customization://aixcut)`) or complete the OAuth browser flow, then continue once authorized.
- For logout, call `aixcut_logout` once when available, and instruct the user to disconnect the account in `[Aixcut](customization://aixcut)` if local cleanup is required. Never print or inspect credential files.

## 2. Browser Handoff

- `aixcut_open` returns a complete, single-use `result.browser_handoff.url`.
- Open that exact URL using Antigravity's built-in `browser` subagent when inspecting or initializing Aixcut Studio, or present the exact clickable handoff URL to the user so their browser session binds to the active MCP grant.
- Never compose a plain project URL as a substitute for `result.browser_handoff.url`, and never use `curl` or a separate headless script to probe or bypass the browser handoff.

## 3. Local Media Uploads

- Never start a local HTTP server, loopback file server, or background bridge process for local files.
- Supported local-media routes in Antigravity:
  1. **Project upload prompt (preferred for interactive browser sessions)**: call `aixcut_frontend(action="prompt_add_material")` to open the Project's upload area for the user, wait for confirmation, and verify in `aixcut_read(view="sources")`.
  2. **Upload link**: call `aixcut_upload_link` to provide a browser upload link when no active Project page is open.
  3. **Direct upload (only when the user explicitly provides local file path(s) and asks the agent to upload them)**: use `aixcut_media(action="prepare_upload")` + signed upload + `aixcut_media(action="complete_upload")`, then verify via `aixcut_read(view="sources")`.

## 4. Planning, Checkpoints & Visual Inspection

- Maintain structured `EditPlan`, `Checkpoint` (binding `project_id`, `timeline_id`, `last_confirmed_revision`, `completed_steps`, `pending_mutations`, `job_ids`, `next_step`), and `QualityGate` evidence directly in your response or conversation artifacts. No external local CLI helper is required.
- When `capture_source_frames` or `capture_timeline_frames` returns temporary JPEG URLs in `result.data.artifacts`, inspect them via `curl` into the conversation scratch directory and `read_file` if visual verification is needed.

## 5. Export Delivery

- Browser rendering (`aixcut_frontend(action="export_timeline")`) is usable only when the target Project page is online (`page_status`) and its `capabilities` include `export_timeline`.
- Browser export success means the download was dispatched; report `delivery.state` and `file_verified=false` unless a verified local path is confirmed.
- Server-side headless render (`aixcut_export`) produces a downloadable artifact URL once the job reaches terminal success; verify status before delivering.
