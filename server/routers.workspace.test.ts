import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getWorkflow: vi.fn(),
  updateWorkflow: vi.fn(),
  listTaskRuns: vi.fn(),
  getScheduledJob: vi.fn(),
  listScheduledJobs: vi.fn(),
  updateScheduledJob: vi.fn(),
  createScheduledJob: vi.fn(),
  deleteScheduledJob: vi.fn(),
  createTaskRun: vi.fn(),
  createGeneratedImage: vi.fn(),
  completeTaskRun: vi.fn(),
  failTaskRun: vi.fn(),
}));
const heartbeatMocks = vi.hoisted(() => ({ createHeartbeatJob: vi.fn(), updateHeartbeatJob: vi.fn(), deleteHeartbeatJob: vi.fn(), listHeartbeatJobs: vi.fn() }));
const imageMocks = vi.hoisted(() => ({ generateImage: vi.fn(), listImageModels: vi.fn() }));

vi.mock("./db", () => ({
  ...dbMocks,
  listGeneratedImages: vi.fn(),
  listWorkflows: vi.fn(),
  getWorkspacePreferences: vi.fn(),
  createWorkflow: vi.fn(),
  saveWorkspacePreferences: vi.fn(),
  listConversations: vi.fn(),
  getConversation: vi.fn(),
  getConversationMessages: vi.fn(),
}));
vi.mock("./_core/heartbeat", () => heartbeatMocks);
vi.mock("./_core/imageGeneration", () => imageMocks);
vi.mock("./_core/llm", () => ({ listLLMModels: vi.fn(), invokeLLM: vi.fn() }));

import { appRouter } from "./routers";

function createContext(userId = 22): TrpcContext {
  return {
    user: {
      id: userId,
      openId: "workspace-owner",
      name: "Workspace Owner",
      email: "owner@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { headers: {}, protocol: "https" } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("workspace router ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.updateWorkflow.mockResolvedValue(undefined);
    dbMocks.updateScheduledJob.mockResolvedValue(undefined);
    dbMocks.deleteScheduledJob.mockResolvedValue(undefined);
    dbMocks.completeTaskRun.mockResolvedValue(undefined);
    dbMocks.failTaskRun.mockResolvedValue(undefined);
  });

  it("rejects a workflow update when the workflow is not owned by the authenticated user", async () => {
    dbMocks.getWorkflow.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext());

    await expect(caller.workflows.update({ id: 91, name: "Edited workflow" })).rejects.toThrow("Workflow not found");
    expect(dbMocks.getWorkflow).toHaveBeenCalledWith(22, 91);
    expect(dbMocks.updateWorkflow).not.toHaveBeenCalled();
  });

  it("passes the authenticated workspace owner to history queries", async () => {
    dbMocks.listTaskRuns.mockResolvedValue([]);
    const caller = appRouter.createCaller(createContext(63));

    await caller.taskHistory.list({ type: "workflow", status: "completed" });

    expect(dbMocks.listTaskRuns).toHaveBeenCalledWith({ userId: 63, type: "workflow", status: "completed" });
  });

  it("rejects a five-field scheduled-task cron before it can create a job", async () => {
    const caller = appRouter.createCaller(createContext());

    await expect(caller.scheduledTasks.create({ workflowId: 5, name: "Morning brief", cronExpression: "0 9 * * *" })).rejects.toThrow("six-field UTC cron expression");
  });

  it("does not pause a scheduled task that is absent from the authenticated workspace", async () => {
    dbMocks.getScheduledJob.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext(44));

    await expect(caller.scheduledTasks.pause({ id: 18 })).rejects.toThrow("Scheduled task not found");
    expect(dbMocks.getScheduledJob).toHaveBeenCalledWith(44, 18);
    expect(heartbeatMocks.updateHeartbeatJob).not.toHaveBeenCalled();
  });

  it("syncs the current user's local schedule status from the scheduler", async () => {
    const localJob = {
      id: 9, userId: 22, workflowId: 5, name: "Morning brief", cronExpression: "0 0 9 * * *",
      scheduleCronTaskUid: "task_123", isPaused: false, lastRunAt: null, nextRunAt: null,
      createdAt: new Date(), updatedAt: new Date(),
    };
    dbMocks.listScheduledJobs.mockResolvedValueOnce([localJob]).mockResolvedValueOnce([{ ...localJob, isPaused: true }]);
    heartbeatMocks.listHeartbeatJobs.mockResolvedValue({
      total: 1, actorUserId: "workspace-owner", jobs: [{ taskUid: "task_123", isEnable: false, nextExecutionAt: "2026-08-20T09:00:00.000Z", lastExecutedAt: "2026-08-19T09:00:00.000Z" }],
    });
    dbMocks.updateScheduledJob.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext());

    const result = await caller.scheduledTasks.list();

    expect(heartbeatMocks.listHeartbeatJobs).toHaveBeenCalled();
    expect(dbMocks.updateScheduledJob).toHaveBeenCalledWith(22, 9, expect.objectContaining({ isPaused: true }));
    expect(result[0]?.isPaused).toBe(true);
  });

  it("creates a published scheduled task and persists the scheduler task UID", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    dbMocks.getWorkflow.mockResolvedValue({ id: 5, userId: 22, name: "Daily summary" });
    dbMocks.createScheduledJob.mockResolvedValue(39);
    heartbeatMocks.createHeartbeatJob.mockResolvedValue({ taskUid: "task_new", nextExecutionAt: "2026-08-21T09:00:00.000Z" });
    const caller = appRouter.createCaller(createContext());

    try {
      const result = await caller.scheduledTasks.create({ workflowId: 5, name: "Morning summary", cronExpression: "0 0 9 * * *" });
      expect(dbMocks.createScheduledJob).toHaveBeenCalledWith(expect.objectContaining({ userId: 22, workflowId: 5, name: "Morning summary" }));
      expect(heartbeatMocks.createHeartbeatJob).toHaveBeenCalledWith(expect.objectContaining({ path: "/api/scheduled/workflow", cron: "0 0 9 * * *" }), expect.any(String));
      expect(dbMocks.updateScheduledJob).toHaveBeenCalledWith(22, 39, expect.objectContaining({ scheduleCronTaskUid: "task_new" }));
      expect(result.id).toBe(39);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("pauses, resumes, and deletes only a user-owned scheduled task", async () => {
    const job = { id: 7, userId: 22, scheduleCronTaskUid: "task_owned" };
    dbMocks.getScheduledJob.mockResolvedValue(job);
    heartbeatMocks.updateHeartbeatJob.mockResolvedValue({ nextExecutionAt: "2026-08-22T09:00:00.000Z" });
    const caller = appRouter.createCaller(createContext());

    await caller.scheduledTasks.pause({ id: 7 });
    await caller.scheduledTasks.resume({ id: 7 });
    await caller.scheduledTasks.delete({ id: 7 });

    expect(heartbeatMocks.updateHeartbeatJob).toHaveBeenNthCalledWith(1, "task_owned", { enable: false }, expect.any(String));
    expect(heartbeatMocks.updateHeartbeatJob).toHaveBeenNthCalledWith(2, "task_owned", { enable: true }, expect.any(String));
    expect(heartbeatMocks.deleteHeartbeatJob).toHaveBeenCalledWith("task_owned", expect.any(String));
    expect(dbMocks.deleteScheduledJob).toHaveBeenCalledWith(22, 7);
  });

  it("treats an absent scheduler jobs collection as an empty list", async () => {
    dbMocks.listScheduledJobs.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    heartbeatMocks.listHeartbeatJobs.mockResolvedValue({ total: 0, actorUserId: "workspace-owner" });
    const caller = appRouter.createCaller(createContext());

    await expect(caller.scheduledTasks.list()).resolves.toEqual([]);
    expect(dbMocks.listScheduledJobs).toHaveBeenCalledWith(22);
  });

  it("persists an image task run and gallery record under the authenticated user", async () => {
    dbMocks.createTaskRun.mockResolvedValue(61);
    dbMocks.createGeneratedImage.mockResolvedValue(77);
    imageMocks.generateImage.mockResolvedValue({ url: "/manus-storage/generated-visual.png" });
    const caller = appRouter.createCaller(createContext(88));

    const result = await caller.images.generate({ prompt: "A minimal violet orbit icon" });

    expect(dbMocks.createTaskRun).toHaveBeenCalledWith(expect.objectContaining({ userId: 88, type: "image", input: "A minimal violet orbit icon" }));
    expect(dbMocks.createGeneratedImage).toHaveBeenCalledWith(expect.objectContaining({ userId: 88, taskRunId: 61, imageUrl: "/manus-storage/generated-visual.png" }));
    expect(dbMocks.completeTaskRun).toHaveBeenCalledWith(61, "/manus-storage/generated-visual.png", expect.any(String));
    expect(result).toEqual({ id: 77, url: "/manus-storage/generated-visual.png" });
  });
});
