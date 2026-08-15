import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/** Core user identity, populated through the built-in OAuth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const conversations = mysqlTable(
  "conversations",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("conversations_user_updated_idx").on(table.userId, table.updatedAt)],
);

export const chatMessages = mysqlTable(
  "chat_messages",
  {
    id: int("id").autoincrement().primaryKey(),
    conversationId: int("conversationId").notNull(),
    userId: int("userId").notNull(),
    role: mysqlEnum("role", ["system", "user", "assistant"]).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("chat_messages_conversation_created_idx").on(table.conversationId, table.createdAt),
    index("chat_messages_user_created_idx").on(table.userId, table.createdAt),
  ],
);

export const taskRuns = mysqlTable(
  "task_runs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    conversationId: int("conversationId"),
    workflowId: int("workflowId"),
    scheduledJobId: int("scheduledJobId"),
    type: mysqlEnum("type", ["chat", "image", "workflow"]).notNull(),
    status: mysqlEnum("status", ["queued", "running", "completed", "failed"]).default("queued").notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    input: text("input").notNull(),
    output: text("output"),
    metadata: text("metadata"),
    errorMessage: text("errorMessage"),
    startedAt: timestamp("startedAt"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("task_runs_user_created_idx").on(table.userId, table.createdAt),
    index("task_runs_user_type_status_idx").on(table.userId, table.type, table.status),
  ],
);

export const generatedImages = mysqlTable(
  "generated_images",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    taskRunId: int("taskRunId").notNull(),
    prompt: text("prompt").notNull(),
    imageUrl: text("imageUrl").notNull(),
    model: varchar("model", { length: 120 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("generated_images_user_created_idx").on(table.userId, table.createdAt)],
);

export const workflows = mysqlTable(
  "workflows",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    template: mysqlEnum("template", ["summarize", "translate", "classify", "generate"]).notNull(),
    instructions: text("instructions").notNull(),
    latestInput: text("latestInput"),
    isEnabled: boolean("isEnabled").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("workflows_user_updated_idx").on(table.userId, table.updatedAt)],
);

export const scheduledJobs = mysqlTable(
  "scheduled_jobs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    workflowId: int("workflowId").notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    cronExpression: varchar("cronExpression", { length: 80 }).notNull(),
    scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
    isPaused: boolean("isPaused").default(false).notNull(),
    lastRunAt: timestamp("lastRunAt"),
    nextRunAt: timestamp("nextRunAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("scheduled_jobs_user_updated_idx").on(table.userId, table.updatedAt),
    uniqueIndex("scheduled_jobs_task_uid_unique").on(table.scheduleCronTaskUid),
  ],
);

export const workspacePreferences = mysqlTable(
  "workspace_preferences",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    defaultModel: varchar("defaultModel", { length: 120 }).default("Default"),
    timeZone: varchar("timeZone", { length: 80 }).default("UTC"),
    interfaceDensity: mysqlEnum("interfaceDensity", ["comfortable", "compact"]).default("comfortable").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("workspace_preferences_user_unique").on(table.userId)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type TaskRun = typeof taskRuns.$inferSelect;
export type GeneratedImage = typeof generatedImages.$inferSelect;
export type Workflow = typeof workflows.$inferSelect;
export type ScheduledJob = typeof scheduledJobs.$inferSelect;
export type WorkspacePreferences = typeof workspacePreferences.$inferSelect;
