# SellBuilding AI Agent

SellBuilding AI Agent is a private, authenticated AI productivity workspace. It brings **AI Chat Agent**, **Image Generation**, **Workflow Automation**, **Scheduled Tasks**, **Task History**, and **Settings** into one responsive dashboard.

## What is implemented

| Area | Capability | Privacy / operating behavior |
| --- | --- | --- |
| **AI Chat Agent** | Prompt-based assistant with Markdown-friendly responses streamed into the interface. Conversations and task runs are persisted. | Every conversation and message is stored with the authenticated user ID and queried only through ownership-scoped procedures. |
| **Image Generation** | Prompt-to-image generation with a personal gallery. | Generated image URL, prompt, model metadata, and task status are scoped to the user who requested them. |
| **Workflow Automation** | Four templates: `summarize`, `translate`, `classify`, and `generate`. Each workflow can be run manually. | Workflow definitions, inputs, and outputs belong to the authenticated user. |
| **Scheduled Tasks** | Create, list, pause, resume, and delete recurring workflow jobs using a six-field UTC cron expression. | Jobs are created through the platform scheduler and callbacks locate a job by trusted scheduler task ID, never request-body input. |
| **Task History** | Searchable and filterable view of prior chat, image, and workflow runs. | History queries always include the authenticated user ID. |
| **Settings** | Workspace preferences plus capability availability checks for AI and image services. | The UI never exposes API keys or connector credentials. |

## Scheduling lifecycle

Scheduled Tasks must only be created after the app is published. The scheduler needs the deployed `/api/scheduled/workflow` endpoint; a local preview URL cannot receive recurring callbacks. In development, both the interface and server procedure block job creation and explain the next step.

Once published, scheduled-task status is refreshed from the scheduler when the user opens the manager. The callback authenticates the cron caller, resolves the durable job by its scheduler task ID, confirms the job and workflow are active, then records the workflow execution in **Task History**.

## Local validation

The project uses the following commands:

```bash
pnpm check
pnpm test
```

The automated suite covers logout behavior, per-user ownership checks, cron-expression validation, scheduled-task pause protection, workflow completion persistence, and workflow failure persistence.

## Dependency security posture

The production dependency graph was remediated against the actionable findings recorded in GitHub Issue #1. The AWS SDK packages are on the current patched `3.1118.0` line, Axios is on `1.20.0`, Streamdown is on `2.6.0`, and `mdast-util-to-hast` is explicitly pinned to `13.2.1` so both Markdown conversion paths resolve to the patched release. The tRPC packages are aligned on `11.18.0`. Express is on `5.2.1`; the storage proxy and Vite SPA fallback use RegExp matchers because Express 5 rejects unnamed `*` route patterns.

GitHub Issue #3's Vitest advisory is remediated by pinning the direct development dependency to `vitest@3.2.6`, the first patched release identified by the advisory. `vitest.config.ts` uses the non-UI `vitest run` script and does not configure an externally bound UI/API server. Pnpm v10 security configuration is stored in `pnpm-workspace.yaml`, where the Wouter patch and NanoID override are active; obsolete `package.json` pnpm settings were removed because pnpm v10 ignores them.

The current production audit reports zero info, low, moderate, high, or critical vulnerabilities. Future audit runs should still review upstream advisories and preserve the explicit workspace pins rather than force-upgrading packages across potentially breaking major versions.

## Publish workflow

First create a checkpoint from the project workspace. Then use the **Publish** control in the project interface. The application uses managed hosting and the published URL is required before creating Scheduled Tasks.

## GitHub source control

The canonical private source repository is [`balajirajput96/sellbuilding-ai-agent`](https://github.com/balajirajput96/sellbuilding-ai-agent). Its `SellBuilding validation` workflow has read-only repository permission and runs `pnpm check`, `pnpm test`, and `pnpm build` on pushes and pull requests to `main`; it does not deploy the app or require deployment secrets. The live application remains deployed on Manus-managed hosting.

The earlier candidate repository, `balajirajput96/B`, remains unchanged. Its existing history contains a malformed overly long pathname that causes normal GitHub pushes to be rejected, so it was intentionally not repaired, rewritten, or used as the final source destination.

## Daily GitHub review automation

The active `Daily SellBuilding GitHub review` schedule runs daily at **10:00 Asia/Kolkata** (`04:30 UTC`) and is restricted to `balajirajput96/sellbuilding-ai-agent`. It performs evidence-led review, searches for duplicate open Issues, and may create at most three new actionable findings prefixed **`[AI Review]`**. Findings are reported only as GitHub Issues; the run report remains internal to the task. It must not edit source files, commit, push, open pull requests, merge, alter workflows, deploy, expose secrets, or access `balajirajput96/B`.

The project owner can inspect the schedule in the project **Schedules** panel. To manage it from an authorized workspace session, inspect it with `manus-config schedule status --limit 1000 --offset 0`; pause it with `manus-config schedule update --enabled=false`; and resume it with `manus-config schedule update --enabled=true`. The initial evidence-based review created [Issue #1](https://github.com/balajirajput96/sellbuilding-ai-agent/issues/1) without changing repository source.

## Gemini CLI and Google Jules access boundary

Gemini CLI supports an interactive Google browser login, an API-key path, and Vertex AI credentials. In this remote environment, a browser login requires a local terminal callback or a sensitive one-time authorization code; the project therefore retains the configured Gemini API-key provider as the supported non-interactive fallback and does not claim a persisted Google CLI session. Google Jules requires user-completed Google sign-in, privacy consent, and a GitHub account connection with explicit repository selection. Jules may then prepare plans and code changes in its own environment, but this project does not submit or approve Jules tasks, repository permissions, code changes, or pull requests without a separate user confirmation.

The post-login Jules verification confirmed an authenticated Google session, but the visible Jules workspace was scoped to a different repository (`balajirajput96/github-mcp-server-`) and showed an existing daily schedule at `03:30 UTC`. This is not the approved SellBuilding target or the requested 10:00 IST timing, so it is intentionally left unchanged pending a new, explicit user decision.

## Integration boundary

The app uses managed, server-side AI and image services supplied by the project runtime. Browser logins, personal Google accounts, and external connector credentials remain separate from this web app; they are not copied into the client or stored in the database. Any future GitHub, Google, Hugging Face, or other third-party product integration should use a dedicated server-side OAuth or API connector with user-approved credentials and an ownership-scoped data model.

## Google and GitHub credential safety

The `balajirajput966@gmail.com` Gmail connector is enabled in the task configuration, while interactive Google→GitHub completion is intentionally treated as a user-only step. Passwords, one-time passwords, passkeys, recovery codes, and verification prompts must be entered and approved by the account owner in the browser. This project does not collect, store, forward, automate, or infer those credentials. The repository inventory and source-control planning use the confirmed `balajirajput96` GitHub account through its authorized connection; they do not depend on an automated Google login.

Interactive Google→GitHub sign-in for `balajirajput966@gmail.com` could not be independently verified in this task because the browser password, OTP, passkey, and consent steps must be completed by the user; the project therefore records the limitation instead of claiming an automated login.

## Published scheduler verification

After publication, the authenticated owner workspace successfully saved the `Published workspace brief` workflow and created the `Daily workflow` recurring job with cron `0 0 9 * * *` (daily at 09:00 UTC). The deployed Scheduled Tasks page then loaded the persisted job with an active **Pause** control, confirming that the production callback registration path is reachable through the published runtime. The earlier empty-list 500 was caused by an absent Heartbeat `jobs` collection; the server now normalizes that response to an empty list and the regression suite covers it.
