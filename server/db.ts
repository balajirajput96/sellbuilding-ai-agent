import { and, desc, eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  chatMessages,
  conversations,
  generatedImages,
  type InsertUser,
  scheduledJobs,
  taskRuns,
  users,
  workflows,
  workspacePreferences,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    _db = drizzle(process.env.DATABASE_URL);
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  for (const key of ["name", "email", "loginMethod"] as const) {
    if (user[key] !== undefined) {
      values[key] = user[key] ?? null;
      updateSet[key] = user[key] ?? null;
    }
  }
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
}

export async function createConversation(userId: number, title: string) {
  const db = await requireDb();
  const result = await db.insert(conversations).values({ userId, title });
  return { id: Number(result[0].insertId), userId, title };
}

export async function listConversations(userId: number) {
  const db = await requireDb();
  return db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt));
}

export async function getConversation(userId: number, conversationId: number) {
  const db = await requireDb();
  return (await db.select().from(conversations).where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId))).limit(1))[0];
}

export async function getConversationMessages(userId: number, conversationId: number) {
  const db = await requireDb();
  return db
    .select()
    .from(chatMessages)
    .where(and(eq(chatMessages.conversationId, conversationId), eq(chatMessages.userId, userId)))
    .orderBy(chatMessages.createdAt);
}

export async function addChatMessage(input: {
  userId: number;
  conversationId: number;
  role: "system" | "user" | "assistant";
  content: string;
}) {
  const db = await requireDb();
  await db.insert(chatMessages).values(input);
  await db.update(conversations).set({ updatedAt: new Date() }).where(and(eq(conversations.id, input.conversationId), eq(conversations.userId, input.userId)));
}

export async function createTaskRun(input: {
  userId: number;
  type: "chat" | "image" | "workflow";
  title: string;
  input: string;
  conversationId?: number;
  workflowId?: number;
  scheduledJobId?: number;
  metadata?: string;
}) {
  const db = await requireDb();
  const result = await db.insert(taskRuns).values({ ...input, status: "running", startedAt: new Date() });
  return Number(result[0].insertId);
}

export async function completeTaskRun(taskRunId: number, output: string, metadata?: string) {
  const db = await requireDb();
  await db.update(taskRuns).set({ status: "completed", output, metadata, completedAt: new Date() }).where(eq(taskRuns.id, taskRunId));
}

export async function failTaskRun(taskRunId: number, errorMessage: string) {
  const db = await requireDb();
  await db.update(taskRuns).set({ status: "failed", errorMessage, completedAt: new Date() }).where(eq(taskRuns.id, taskRunId));
}

export async function listTaskRuns(input: {
  userId: number;
  query?: string;
  type?: "chat" | "image" | "workflow";
  status?: "queued" | "running" | "completed" | "failed";
  limit?: number;
}) {
  const db = await requireDb();
  const clauses = [eq(taskRuns.userId, input.userId)];
  if (input.type) clauses.push(eq(taskRuns.type, input.type));
  if (input.status) clauses.push(eq(taskRuns.status, input.status));
  if (input.query?.trim()) {
    const pattern = `%${input.query.trim()}%`;
    clauses.push(or(like(taskRuns.title, pattern), like(taskRuns.input, pattern))!);
  }
  return db.select().from(taskRuns).where(and(...clauses)).orderBy(desc(taskRuns.createdAt)).limit(input.limit ?? 100);
}

export async function createGeneratedImage(input: { userId: number; taskRunId: number; prompt: string; imageUrl: string; model?: string }) {
  const db = await requireDb();
  const result = await db.insert(generatedImages).values(input);
  return Number(result[0].insertId);
}

export async function listGeneratedImages(userId: number) {
  const db = await requireDb();
  return db.select().from(generatedImages).where(eq(generatedImages.userId, userId)).orderBy(desc(generatedImages.createdAt));
}

export async function createWorkflow(input: {
  userId: number;
  name: string;
  template: "summarize" | "translate" | "classify" | "generate";
  instructions: string;
  latestInput?: string;
}) {
  const db = await requireDb();
  const result = await db.insert(workflows).values(input);
  return Number(result[0].insertId);
}

export async function listWorkflows(userId: number) {
  const db = await requireDb();
  return db.select().from(workflows).where(eq(workflows.userId, userId)).orderBy(desc(workflows.updatedAt));
}

export async function getWorkflow(userId: number, workflowId: number) {
  const db = await requireDb();
  return (await db.select().from(workflows).where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId))).limit(1))[0];
}

export async function updateWorkflow(userId: number, workflowId: number, updates: Partial<{ name: string; instructions: string; latestInput: string; isEnabled: boolean }>) {
  const db = await requireDb();
  await db.update(workflows).set(updates).where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId)));
}

export async function createScheduledJob(input: { userId: number; workflowId: number; name: string; cronExpression: string; scheduleCronTaskUid?: string; nextRunAt?: Date | null }) {
  const db = await requireDb();
  const result = await db.insert(scheduledJobs).values(input);
  return Number(result[0].insertId);
}

export async function listScheduledJobs(userId: number) {
  const db = await requireDb();
  return db.select().from(scheduledJobs).where(eq(scheduledJobs.userId, userId)).orderBy(desc(scheduledJobs.updatedAt));
}

export async function getScheduledJob(userId: number, scheduledJobId: number) {
  const db = await requireDb();
  return (await db.select().from(scheduledJobs).where(and(eq(scheduledJobs.id, scheduledJobId), eq(scheduledJobs.userId, userId))).limit(1))[0];
}

export async function getScheduledJobByTaskUid(taskUid: string) {
  const db = await requireDb();
  return (await db.select().from(scheduledJobs).where(eq(scheduledJobs.scheduleCronTaskUid, taskUid)).limit(1))[0];
}

export async function updateScheduledJob(userId: number, scheduledJobId: number, updates: Partial<{ isPaused: boolean; cronExpression: string; scheduleCronTaskUid: string | null; nextRunAt: Date | null; lastRunAt: Date | null }>) {
  const db = await requireDb();
  await db.update(scheduledJobs).set(updates).where(and(eq(scheduledJobs.id, scheduledJobId), eq(scheduledJobs.userId, userId)));
}

export async function deleteScheduledJob(userId: number, scheduledJobId: number) {
  const db = await requireDb();
  await db.delete(scheduledJobs).where(and(eq(scheduledJobs.id, scheduledJobId), eq(scheduledJobs.userId, userId)));
}

export async function getWorkspacePreferences(userId: number) {
  const db = await requireDb();
  return (await db.select().from(workspacePreferences).where(eq(workspacePreferences.userId, userId)).limit(1))[0];
}

export async function saveWorkspacePreferences(userId: number, input: { defaultModel: string; timeZone: string; interfaceDensity: "comfortable" | "compact" }) {
  const db = await requireDb();
  await db
    .insert(workspacePreferences)
    .values({ userId, ...input })
    .onDuplicateKeyUpdate({ set: { ...input, updatedAt: new Date() } });
}
