# Project TODO

- [x] Define per-user database tables for chat conversations, AI task runs, generated images, workflow definitions, scheduled jobs, and workspace preferences.
- [x] Apply a schema migration and implement ownership-scoped database helpers for every persisted record.
- [x] Build an authenticated dashboard shell with an elegant responsive sidebar and exact navigation labels: AI Chat Agent, Image Generation, Workflow Automation, Scheduled Tasks, Task History, and Settings.
- [x] Build the Dashboard home activity feed from the authenticated user's recent task runs, generated images, and workflow executions.
- [x] Build AI Chat Agent with prompt input, streamed responses, code-friendly rendering, conversation history, loading states, and user-scoped persistence.
- [x] Build Image Generation with prompt input, generation states, a personal image gallery, and persisted prompt/status/output metadata.
- [x] Build Workflow Automation templates for summarize, translate, classify, and generate, including manual execution and a user-scoped execution log.
- [x] Build Scheduled Tasks with create, view, pause, resume, and delete actions for recurring workflow jobs.
- [x] Implement supported recurring execution with safe per-user job ownership and status tracking.
- [x] Build Task History with search, type/status filters, output previews, and authenticated user scoping.
- [x] Build Settings for workspace preferences and connected-integration status without exposing secrets.
- [x] Sync Scheduled Tasks status from the Heartbeat service so next execution, last execution, and pause state remain accurate.
- [x] Block Scheduled Tasks creation in unpublished development environments so unreachable callbacks are not created.
- [x] Replace hardcoded Settings integration labels with real, non-secret app capability checks.
- [x] Add accessible empty, error, loading, confirmation, and destructive-action states across every feature.
- [x] Add explicit loading and error states to Workflow Automation for workflow list, create, and execute surfaces.
- [x] Add explicit loading and error states to Task History and Scheduled Tasks list views, then audit all feature pages for visible feedback states.
- [x] Add explicit loading and error states to AI Chat Agent conversation and message queries.
- [x] Add visible preferences loading and error states to Settings, then complete the final page-by-page feedback-state audit.
- [x] Perform and document a final feedback-state audit for Dashboard, AI Chat Agent, Image Generation, Workflow Automation, Scheduled Tasks, Task History, and Settings.
- [x] Capture final visual verification for the updated AI Chat Agent and Settings feedback states.
- [x] Capture and review state-specific visual evidence for AI Chat Agent history feedback and Settings preferences feedback.
- [x] Capture authenticated development-preview evidence for AI Chat Agent loading/error feedback and Settings loading/error feedback.
- [x] Capture the settled authenticated Settings preferences-loading skeleton and document the screenshot reference.
- [x] Record the exact settled Settings loading screenshot reference in the visual audit.
- [x] Add Vitest coverage for ownership checks, workflow/job state transitions, and AI task persistence.
- [x] Add Vitest coverage for successful Scheduled Tasks create, pause, resume, delete, and scheduler-sync lifecycle transitions.
- [x] Add Vitest coverage for AI Chat Agent or Image Generation persistence of authenticated-user task data.
- [x] Run type checking and automated tests; resolve implementation errors.
- [x] Verify the desktop and mobile interface visually against the premium design direction.
- [x] Document product capabilities, supported integrations, operating limitations, and deployment steps.
- [x] Confirm the newly connected `balajirajput966@gmail.com` Gmail connector is enabled; keep Google→GitHub credential and OTP entry user-completed without storing credentials.
- [x] Resolve `balajirajput96` as the canonical GitHub owner account; exclude the distinct `Balji` public profile and confirm actual owner-repository access.
- [x] Resolve `balajirajput96` as the canonical GitHub owner account; exclude the distinct `Balji` public profile and confirm actual owner-repository access.
- [x] Expand the Dashboard home activity area to visibly include recent generated images and workflow executions alongside task runs.
- [x] Add explicit loading and error states to each Dashboard home activity subsection.
- [x] Add explicit loading and error states to the Dashboard Recent activity task-run subsection and align all summary-panel error behavior.
- [x] Treat `balajirajput96` as the canonical GitHub owner account and inventory its accessible owner repositories for reference and source-control planning.
- [x] Keep the separate Google→GitHub browser credential step documented as user-completed authentication only; do not store or automate passwords or OTPs.
- [x] Explicitly document that `balajirajput966@gmail.com` interactive Google→GitHub authentication could not be independently verified because credentials and OTPs must remain user-completed.
- [x] Add a permanent README security note stating that Google/GitHub passwords, OTPs, and verification steps are never stored or automated.
- [x] Add an explicit README sentence that `balajirajput966@gmail.com` Google→GitHub interactive sign-in could not be independently verified in this task because browser passwords, OTPs, passkeys, and consent steps are user-completed.

## Post-publish follow-up

- [x] Verify the published domain `https://sellaiagent-bvve9wdp.manus.space` responds and renders the application shell.
- [x] Review live deployment logs for startup or runtime errors after publication.
- [x] Verify published authentication and confirm Scheduled Tasks still require the published callback boundary.
- [x] Prepare a safe GitHub source-control handoff plan for `balajirajput96` without copying unrelated repositories wholesale.
- [x] Prepare optional Hugging Face and GitHub integration recommendations that require explicit connector/API authorization before implementation.
- [x] Perform a published-domain Scheduled Tasks create-path check with a saved workflow and document the deployed callback-boundary result.

## Confirmed recurring schedule

- [x] Create the published `Published workspace brief` workflow schedule for daily 09:00 UTC using six-field cron `0 0 9 * * *`.
- [x] Verify the created scheduled job status and document its callback/readiness state.
- [x] Normalize the production Heartbeat list response so an absent or alternate jobs collection does not turn an empty Scheduled Tasks list into a 500 error.
- [x] Verify the existing user-confirmed daily 09:00 UTC job after the production compatibility fix; the published list loads one active job with Pause control and the result is documented.

## Google and GitHub automation follow-up

- [x] Inspect available Google/Gemini/Spark and GitHub connectors without exposing credentials; Google Gemini and GitHub connectors are enabled.
- [x] Verify whether “Google Antigravity CLI” is an official available CLI/product in this environment before attempting installation or login; official CLI v1.1.13 installed with checksum verification.
- [x] Open the official Antigravity Google OAuth page and pause for user takeover; terminal OAuth polling timed out before a verified session was stored.
- [x] Configure Antigravity `modelProvider: gemini` locally and run a non-destructive plan-mode smoke test without enabling GitHub write actions; it returned `ANTIGRAVITY_GEMINI_SMOKE_OK`.
- [x] Re-run the Antigravity Gemini smoke test with a prompt and mode that cannot trigger browser/Playwright setup; plan mode returned `ANTIGRAVITY_GEMINI_SMOKE_OK` and the result is documented.
- [x] Decide and document the exact GitHub automation scope: read-only by default, with no write actions enabled; the decision and rationale are documented.
- [x] Configure/use the minimal authorized GitHub read-only scope and run a non-destructive owner/repository/Actions metadata smoke test without changing repository content.

## Antigravity coding and deployment follow-up

- [x] Start a fresh Antigravity terminal OAuth flow; document that browser consent alone cannot complete the remote terminal session without returning a sensitive authorization code, which is not handled by the agent.
- [x] Attempt a non-destructive project plan analysis through the Gemini provider; document the headless command-permission/internal execution limitation after safe retries while retaining the successful provider smoke test.
- [x] Define the exact GitHub write/deployment automation scope and obtain explicit approval before any repository or workflow mutation.
- [x] Configure the approved GitHub Actions validation automation and verify a successful run; keep Manus deployment separate because no GitHub-to-Manus deployment credential or connector is provisioned.

## Antigravity OAuth fallback

- [x] Document that remote Antigravity OAuth requires a user-returned authorization code and therefore cannot be completed by the agent without handling a sensitive code.
- [x] Restore the documented Gemini API-key provider setting; attempt the non-destructive project analysis and document the headless tool-execution limitation rather than claiming a result.
- [x] Ask the user to explicitly select GitHub automation scope before any write, workflow-dispatch, repository export, or external deployment action.

## Approved GitHub scope awaiting target confirmation

- [x] Confirm the single target repository for approved source export/push and GitHub Actions CI workflow creation.
- [x] Inspect the confirmed target repository's default branch, existing workflows, and protections without modifying it.
- [x] Prepare a source export and CI workflow change set with Manus deployment credentials excluded from version control.
- [x] Obtain final approval that identifies the repository and the exact push/workflow write actions before mutating GitHub.
- [x] Keep `balajirajput96/B` unchanged after its malformed historical pathname rejected the approved source/CI push; resolve only with separate user approval if `B` must later become the source destination.
- [x] Read the confirmed repository's branch protection or ruleset configuration and validate the planned push against those constraints.

## GitHub export recovery

- [x] Choose and obtain approval for a non-destructive destination after `balajirajput96/B` rejects pushes because its existing history includes an excessively long pathname.
- [x] Create the approved private recovery repository `balajirajput96/sellbuilding-ai-agent` without deleting or rewriting existing `balajirajput96/B` history.
- [x] Publish the prepared source export and validation CI to the approved recovery repository and verify its initial Actions run.
- [x] Fix the validation CI pnpm setup so it relies on the package-managed pnpm version rather than declaring it twice, then verify a passing Actions run.
- [x] Document `balajirajput96/sellbuilding-ai-agent` as the canonical private GitHub source repository and distinguish it from the unaffected `B` recovery candidate.

## Daily GitHub review automation request

- [x] Confirm the single repository, daily execution time/timezone, report destination, and whether automation remains review-only with no automatic code writes.
- [x] Document the Antigravity terminal OAuth boundary and select a supported Gemini-provider fallback for any non-interactive analysis.
- [x] Configure the approved daily GitHub review schedule with the enabled GitHub connector and only the selected repository scope.
- [x] Run and verify one non-destructive review cycle, then document pause/manage controls.

## Daily GitHub Issue review selection

- [x] Confirm `balajirajput96/sellbuilding-ai-agent` as the daily 10:00 IST review target with GitHub Issues-only reporting, no automatic code changes or pull requests.
- [x] Create a daily 10:00 IST review schedule that can inspect only the approved repository and create deduplicated GitHub Issues for actionable findings.
- [x] Verify a manually triggered review produces no source mutations and document the pause/manage path.
- [x] Create and verify one evidence-based GitHub Issue from the initial dependency-audit review without changing source code.
- [x] Add permanent documentation for inspecting, pausing, and resuming the daily GitHub review schedule.
