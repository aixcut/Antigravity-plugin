---
name: aixcut-basics
description: "Mandatory entry for every Aixcut task: context, intent routing, read-before-write, refs, idempotency, async jobs and host boundaries. Load before any MCP call. Do not use alone: pair with one specialist workflow. Chinese triggers: 项目、时间轴、字幕、配音、生成、导出、报错."
---

# Aixcut MCP Basics

Follow [language](references/language.md), [conversation guidance](references/conversation-guidance.md), and [ownership](references/model.md). Select one main workflow with [intent routing](references/intent-routing.md); load specialist Skills only at their owned stages.

When no installed Aixcut Skill is available, call `aixcut_agent_bootstrap(action="start", intent=...)` before using other Aixcut tools. Installed plugin Skills take precedence and do not need that bootstrap call.

Antigravity manages plugins through its Plugins Manager (`[Aixcut](customization://aixcut)`). Do not run package-manager or marketplace commands from this Skill. After the user updates the plugin, start a new conversation before relying on newly loaded Skills or MCP tools.

Shared Core policy lives in [orchestration](../../references/core/orchestration.md) and [workflow boundaries](../../references/core/workflow-boundaries.md). Live schemas and current user authorization remain authoritative.

Inspect `active_project_id`. If empty, ask for a Project name or `project_id`; never choose the first listed Project.

Before the first edit of a new standalone video or deliverable, do not assume `active_project_id` is the intended target. Unless the user says to continue it or provides a `project_id`, ask once: create a new Project or continue `<title/id>`? Recommend a new Project. Never silently reuse or overwrite it.

Read before writes; use returned refs. Reuse read evidence while Project, timeline, and revision are unchanged. A successful write invalidates `plan_context`; reread the affected Timeline, update `base_revision` from `revision_after`, and rebuild `plan_context` before the next mutation.

Keep independent read calls parallel. Structural writes on the same timeline stay serial. Group same-action items in one call and keep per-item timing, style, and highlight data inside each item. Only the live Tool Schema decides what may be combined. Read affected views after each atomic batch.

Reuse `idempotency_key` only for identical, explicitly permitted retries. For `status_unknown`, confirm the receipt before taking any dependent write. For `async`, follow `job_id` and `next_action` until terminal. Business fields are in `result`; `noop` is final, `applied_with_warning` requires reporting warnings.

Antigravity handles OAuth; do not call `aixcut_login` first. Never use curl, direct database writes, invented server paths or results, bypass permissions, or expose tokens. Verify responses before reporting success.

## Intent and recovery contract

For every request use `intent → inspect → plan → execute → verify → deliver`. Mechanical edits stay narrow: add voice, music, B-roll, Motion Graphics, or export only when requested. Heavyweight actions — export, generation or submission, deletion, and overwrite — require explicit user authorization and never serve as checkpoints. Assembly may expand scope only after `EditPlan` names the stages.

On `status_unknown`, keep the original `idempotency_key`/`mutation_id` and query `aixcut_read(view="mutation_receipt")`; `pending`, `unknown`, and `not_found` remain unresolved until `applied`, `duplicate`, `noop`, or `rejected`. Never create a new key for a lost response. Save a `Checkpoint` with Project, timeline, revision, mutation identity, and next action before leaving a recoverable stage.

Maintain a structured `EditPlan` before the first timeline mutation and follow [workflow checkpoints](references/checkpoints.md). After each batch, confirm the new `revision` via read-back and record a concise checkpoint (`project_id`, `timeline_id`, `revision`, completed steps, pending jobs, and `next_step`). On resume, re-inspect the live Project/timeline/revision before continuing `next_step`; never replay completed steps.

Default repair budget: one schema correction, two revision-conflict read/replan cycles, and two provider attempts per generation target. Save a Checkpoint when exhausted and report the recoverable state.
