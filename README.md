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

## Publish workflow

First create a checkpoint from the project workspace. Then use the **Publish** control in the project interface. The application uses managed hosting and the published URL is required before creating Scheduled Tasks.

## Integration boundary

The app uses managed, server-side AI and image services supplied by the project runtime. Browser logins, personal Google accounts, and external connector credentials remain separate from this web app; they are not copied into the client or stored in the database. Any future GitHub, Google, Hugging Face, or other third-party product integration should use a dedicated server-side OAuth or API connector with user-approved credentials and an ownership-scoped data model.

## Google and GitHub credential safety

The `balajirajput966@gmail.com` Gmail connector is enabled in the task configuration, while interactive Google→GitHub completion is intentionally treated as a user-only step. Passwords, one-time passwords, passkeys, recovery codes, and verification prompts must be entered and approved by the account owner in the browser. This project does not collect, store, forward, automate, or infer those credentials. The repository inventory and source-control planning use the confirmed `balajirajput96` GitHub account through its authorized connection; they do not depend on an automated Google login.

Interactive Google→GitHub sign-in for `balajirajput966@gmail.com` could not be independently verified in this task because the browser password, OTP, passkey, and consent steps must be completed by the user; the project therefore records the limitation instead of claiming an automated login.

## Published scheduler verification

After publication, the authenticated owner workspace successfully saved the `Published workspace brief` workflow and created the `Daily workflow` recurring job with cron `0 0 9 * * *` (daily at 09:00 UTC). The deployed Scheduled Tasks page then loaded the persisted job with an active **Pause** control, confirming that the production callback registration path is reachable through the published runtime. The earlier empty-list 500 was caused by an absent Heartbeat `jobs` collection; the server now normalizes that response to an empty list and the regression suite covers it.
