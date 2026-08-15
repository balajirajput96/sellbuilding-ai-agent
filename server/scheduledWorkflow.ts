import type { Express, Request, Response } from "express";
import * as db from "./db";
import { sdk } from "./_core/sdk";
import { executeWorkflow } from "./workflowEngine";

export function registerScheduledWorkflowRoutes(app: Express) {
  app.post("/api/scheduled/workflow", async (req: Request, res: Response) => {
    try {
      const cronUser = await sdk.authenticateRequest(req);
      if (!cronUser.isCron || !cronUser.taskUid) return res.status(403).json({ error: "cron-only" });
      const job = await db.getScheduledJobByTaskUid(cronUser.taskUid);
      if (!job || job.isPaused) return res.json({ ok: true, skipped: job ? "paused" : "orphan" });
      const workflow = await db.getWorkflow(job.userId, job.workflowId);
      if (!workflow || !workflow.isEnabled) return res.json({ ok: true, skipped: "workflow-disabled" });

      const sourceText = workflow.latestInput?.trim() || "Run this workflow using its saved instructions. Return a concise useful result.";
      const result = await executeWorkflow({ userId: job.userId, workflow, sourceText, scheduledJobId: job.id });
      await db.updateScheduledJob(job.userId, job.id, { lastRunAt: new Date() });
      return res.json({ ok: true, taskRunId: result.taskRunId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Scheduled workflow failed";
      return res.status(500).json({ error: message, context: { url: req.originalUrl }, timestamp: new Date().toISOString() });
    }
  });
}
