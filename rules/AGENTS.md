# Aixcut Video Editing Rules (Antigravity)

You have the **Aixcut** plugin enabled for AI video editing in **Aixcut Studio** via the `aixcut` MCP server.

## Core Execution Workflow

1. **Load Skills on Demand**:
   - Load `aixcut-basics` as the mandatory entry for every Aixcut editing workflow.
   - Load `aixcut-host` for Antigravity-specific OAuth, browser handoff, local-media upload, and export conventions.
   - Load specialist skills only when needed: `aixcut-projects`, `aixcut-timeline-editing`, `aixcut-captions`, `aixcut-voice`, `aixcut-visual-effects`, `aixcut-generation`, `aixcut-talking-head`, `aixcut-scenarios`, `aixcut-video-assembly`, `aixcut-verification`, `aixcut-export`, `aixcut-documents`, `aixcut-known-errors`, `aixcut-login`, `aixcut-mcp-logout`.
2. **Read Before Write**:
   - Always inspect the target project, timeline, sources, and revision (`aixcut_read`) before mutating the timeline.
   - Use fresh `expected_revision` and deterministic `idempotency_key` values on mutations; never fabricate IDs or timestamps.
3. **Browser Handoff & Authorization**:
   - Antigravity manages MCP OAuth at the transport layer. Never call `aixcut_login` proactively before a business tool call, and never inspect or print credential files.
   - When `aixcut_open` returns a single-use `result.browser_handoff.url`, open or hand off that exact URL rather than composing a bare project URL.
   - If the user has not connected Aixcut yet and asks for a creative editing plan, deliver a complete actionable editing plan first and guide them to connect Aixcut in Plugins Manager (`[Aixcut](customization://aixcut)`) to apply it to an editable timeline.
4. **Local Media & Verification**:
   - Never start a local HTTP server or loopback file bridge for local media. Use `aixcut_frontend(action="prompt_add_material")`, `aixcut_upload_link`, or explicit `aixcut_media(action="prepare_upload")` only when the user explicitly provides a local file path, then confirm via `aixcut_read(view="sources")`.
   - Never claim an edit, caption sync, render, or export succeeded until confirmed by read-back evidence (`aixcut_read`, `aixcut_export`, `aixcut_generate`, `aixcut_frontend(action="export_timeline_status")`, or `capture_timeline_frames`).
   - Only export (`aixcut_frontend(action="export_timeline")` or `aixcut_export`) after explicit user authorization.
