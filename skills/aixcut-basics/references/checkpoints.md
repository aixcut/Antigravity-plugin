# Antigravity 工作流计划与检查点约定

在 Antigravity 中执行多步骤剪辑任务时，直接在对话上下文（或长任务的 artifact 文档）中维护结构化的 `EditPlan`、`Checkpoint` 与 `QualityGate` 证据，不依赖外部本地脚本：

1. **EditPlan（写入前先成文）**：在首次时间线写入前明确目标 `project_id`、`timeline_id`、当前已读取的 `revision`、分阶段步骤、素材引用与验证口径。
2. **Batch + Read-back（每批写入后回读）**：每完成一批时间线/字幕/音频写入后，通过 `aixcut_read` 或 `aixcut_operation` 回读确认新的 `revision` 与结构变化，避免使用过期 `expected_revision`。
3. **Checkpoint（跨轮恢复摘要）**：长任务或暂停等待用户（授权/上传素材/异步生成/导出确认）时，输出公开的恢复摘要：`project_id`、`timeline_id`、`last_confirmed_revision`、已完成步骤、进行中的 `job_id` / `operation_id` 与下一步动作（绝不包含原始凭据、token 或私密 URL）。
4. **Resume（恢复时先核对现场）**：恢复任务时必须重新读取当前 `project_id`、`timeline_id` 与最新 `revision`，核对状态后再继续 `next_step`，绝不盲目重放已完成步骤。
5. **QualityGate（交付前实证门禁）**：交付前对照用户目标核对最新 `revision` 的时间线结构、时长、字幕/音画同步与关键帧证据；未实证的项不得宣称完成。
