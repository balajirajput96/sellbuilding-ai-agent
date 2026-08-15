import { parse as parseCookie } from "cookie";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { createHeartbeatJob, deleteHeartbeatJob, listHeartbeatJobs, updateHeartbeatJob } from "./_core/heartbeat";
import { generateImage, listImageModels } from "./_core/imageGeneration";
import { listLLMModels } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { executeWorkflow, type WorkflowTemplate } from "./workflowEngine";

const taskTypeSchema = z.enum(["chat", "image", "workflow"]);
const taskStatusSchema = z.enum(["queued", "running", "completed", "failed"]);
const workflowTemplateSchema = z.enum(["summarize", "translate", "classify", "generate"]);
const cronSchema = z.string().trim().refine(value => value.split(/\s+/).length === 6, "Use a six-field UTC cron expression: sec min hour day month weekday.");

function sessionToken(cookieHeader?: string, authorization?: string) {
  const cookieToken = parseCookie(cookieHeader ?? "")[COOKIE_NAME];
  return cookieToken ?? (authorization?.startsWith("Bearer ") ? authorization.slice(7) : "");
}

function asDate(value: string | null | undefined) {
  return value ? new Date(value) : null;
}

async function syncScheduledTasksForUser(input: { userId: number; cookie?: string; authorization?: string }) {
  const token = sessionToken(input.cookie, input.authorization);
  const localJobs = await db.listScheduledJobs(input.userId);
  const remote = await listHeartbeatJobs(token, { page: 1, pageSize: 100 });
  const remoteJobs = Array.isArray(remote?.jobs) ? remote.jobs : [];
  const remoteByTaskUid = new Map(remoteJobs.map(job => [job.taskUid, job]));
  await Promise.all(localJobs.filter(job => job.scheduleCronTaskUid).map(async job => {
    const heartbeatJob = remoteByTaskUid.get(job.scheduleCronTaskUid!);
    if (!heartbeatJob) return;
    await db.updateScheduledJob(input.userId, job.id, {
      isPaused: !heartbeatJob.isEnable,
      nextRunAt: asDate(heartbeatJob.nextExecutionAt),
      lastRunAt: asDate(heartbeatJob.lastExecutedAt),
    });
  }));
  return db.listScheduledJobs(input.userId);
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  workspace: router({
    summary: protectedProcedure.query(async ({ ctx }) => {
      const [runs, images, workflows, scheduledJobs, preferences] = await Promise.all([
        db.listTaskRuns({ userId: ctx.user.id, limit: 8 }),
        db.listGeneratedImages(ctx.user.id),
        db.listWorkflows(ctx.user.id),
        db.listScheduledJobs(ctx.user.id),
        db.getWorkspacePreferences(ctx.user.id),
      ]);
      return { runs, images: images.slice(0, 6), workflowCount: workflows.length, scheduledJobCount: scheduledJobs.length, preferences };
    }),
  }),
  chat: router({
    conversations: protectedProcedure.query(({ ctx }) => db.listConversations(ctx.user.id)),
    messages: protectedProcedure.input(z.object({ conversationId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const conversation = await db.getConversation(ctx.user.id, input.conversationId);
      if (!conversation) throw new Error("Conversation not found");
      return db.getConversationMessages(ctx.user.id, input.conversationId);
    }),
  }),
  images: router({
    list: protectedProcedure.query(({ ctx }) => db.listGeneratedImages(ctx.user.id)),
    models: protectedProcedure.query(async () => listImageModels()),
    generate: protectedProcedure.input(z.object({ prompt: z.string().trim().min(3).max(4000), model: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const taskRunId = await db.createTaskRun({ userId: ctx.user.id, type: "image", title: "Image Generation", input: input.prompt, metadata: JSON.stringify({ model: input.model ?? "default" }) });
      try {
        const result = await generateImage({ prompt: input.prompt, ...(input.model ? { model: input.model } : {}) });
        if (!result.url) throw new Error("Image Generation returned no image URL");
        const imageId = await db.createGeneratedImage({ userId: ctx.user.id, taskRunId, prompt: input.prompt, imageUrl: result.url, ...(input.model ? { model: input.model } : {}) });
        await db.completeTaskRun(taskRunId, result.url, JSON.stringify({ imageId, model: input.model ?? "default" }));
        return { id: imageId, url: result.url };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Image generation failed";
        await db.failTaskRun(taskRunId, message);
        throw error;
      }
    }),
  }),
  workflows: router({
    list: protectedProcedure.query(({ ctx }) => db.listWorkflows(ctx.user.id)),
    create: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(120), template: workflowTemplateSchema, instructions: z.string().trim().min(3).max(4000), latestInput: z.string().max(8000).optional() })).mutation(async ({ ctx, input }) => {
      const id = await db.createWorkflow({ userId: ctx.user.id, ...input });
      return { id };
    }),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), name: z.string().trim().min(2).max(120).optional(), instructions: z.string().trim().min(3).max(4000).optional(), latestInput: z.string().max(8000).optional(), isEnabled: z.boolean().optional() })).mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const workflow = await db.getWorkflow(ctx.user.id, id);
      if (!workflow) throw new Error("Workflow not found");
      await db.updateWorkflow(ctx.user.id, id, updates);
      return { success: true };
    }),
    execute: protectedProcedure.input(z.object({ id: z.number().int().positive(), sourceText: z.string().trim().min(1).max(8000) })).mutation(async ({ ctx, input }) => {
      const workflow = await db.getWorkflow(ctx.user.id, input.id);
      if (!workflow || !workflow.isEnabled) throw new Error("Workflow is unavailable");
      return executeWorkflow({ userId: ctx.user.id, workflow, sourceText: input.sourceText });
    }),
  }),
  scheduledTasks: router({
    list: protectedProcedure.query(({ ctx }) => syncScheduledTasksForUser({ userId: ctx.user.id, cookie: ctx.req.headers.cookie, authorization: ctx.req.headers.authorization })),
    create: protectedProcedure.input(z.object({ workflowId: z.number().int().positive(), name: z.string().trim().min(2).max(160), cronExpression: cronSchema })).mutation(async ({ ctx, input }) => {
      if (process.env.NODE_ENV !== "production") {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Publish the app before creating Scheduled Tasks so the secure callback URL is reachable." });
      }
      const workflow = await db.getWorkflow(ctx.user.id, input.workflowId);
      if (!workflow) throw new Error("Workflow not found");
      const scheduledJobId = await db.createScheduledJob({ userId: ctx.user.id, workflowId: workflow.id, name: input.name, cronExpression: input.cronExpression });
      try {
        const job = await createHeartbeatJob({
          name: `sellbuilding-workflow-${ctx.user.id}-${scheduledJobId}`,
          cron: input.cronExpression,
          path: "/api/scheduled/workflow",
          payload: {},
          description: `Scheduled execution of ${workflow.name}`,
        }, sessionToken(ctx.req.headers.cookie, ctx.req.headers.authorization));
        await db.updateScheduledJob(ctx.user.id, scheduledJobId, { scheduleCronTaskUid: job.taskUid, nextRunAt: job.nextExecutionAt ? new Date(job.nextExecutionAt) : null });
        return { id: scheduledJobId, nextRunAt: job.nextExecutionAt ?? null };
      } catch (error) {
        await db.deleteScheduledJob(ctx.user.id, scheduledJobId);
        throw error;
      }
    }),
    pause: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const job = await db.getScheduledJob(ctx.user.id, input.id);
      if (!job?.scheduleCronTaskUid) throw new Error("Scheduled task not found");
      await updateHeartbeatJob(job.scheduleCronTaskUid, { enable: false }, sessionToken(ctx.req.headers.cookie, ctx.req.headers.authorization));
      await db.updateScheduledJob(ctx.user.id, job.id, { isPaused: true });
      return { success: true };
    }),
    resume: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const job = await db.getScheduledJob(ctx.user.id, input.id);
      if (!job?.scheduleCronTaskUid) throw new Error("Scheduled task not found");
      const result = await updateHeartbeatJob(job.scheduleCronTaskUid, { enable: true }, sessionToken(ctx.req.headers.cookie, ctx.req.headers.authorization));
      await db.updateScheduledJob(ctx.user.id, job.id, { isPaused: false, nextRunAt: result.nextExecutionAt ? new Date(result.nextExecutionAt) : null });
      return { success: true, nextRunAt: result.nextExecutionAt ?? null };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const job = await db.getScheduledJob(ctx.user.id, input.id);
      if (!job) throw new Error("Scheduled task not found");
      if (job.scheduleCronTaskUid) await deleteHeartbeatJob(job.scheduleCronTaskUid, sessionToken(ctx.req.headers.cookie, ctx.req.headers.authorization));
      await db.deleteScheduledJob(ctx.user.id, job.id);
      return { success: true };
    }),
  }),
  taskHistory: router({
    list: protectedProcedure.input(z.object({ query: z.string().max(120).optional(), type: taskTypeSchema.optional(), status: taskStatusSchema.optional() }).optional()).query(({ ctx, input }) => db.listTaskRuns({ userId: ctx.user.id, ...(input ?? {}) })),
  }),
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const preferences = await db.getWorkspacePreferences(ctx.user.id);
      const [llmCatalog, imageCatalog] = await Promise.allSettled([listLLMModels(), listImageModels()]);
      const integrations = [
        llmCatalog.status === "fulfilled"
          ? { name: "AI Chat Agent", status: `${llmCatalog.value.data.length} models available`, state: "available" as const }
          : { name: "AI Chat Agent", status: "Temporarily unavailable", state: "unavailable" as const },
        imageCatalog.status === "fulfilled"
          ? { name: "Image Generation", status: `${imageCatalog.value.models.length} image models available`, state: "available" as const }
          : { name: "Image Generation", status: "Temporarily unavailable", state: "unavailable" as const },
      ];
      return { preferences, integrations };
    }),
    save: protectedProcedure.input(z.object({ defaultModel: z.string().min(1).max(120), timeZone: z.string().min(1).max(80), interfaceDensity: z.enum(["comfortable", "compact"]) })).mutation(async ({ ctx, input }) => {
      await db.saveWorkspacePreferences(ctx.user.id, input);
      return { success: true };
    }),
    models: protectedProcedure.query(() => listLLMModels()),
  }),
});

export type AppRouter = typeof appRouter;
