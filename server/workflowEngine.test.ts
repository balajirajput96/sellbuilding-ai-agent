import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  createTaskRun: vi.fn(),
  completeTaskRun: vi.fn(),
  failTaskRun: vi.fn(),
  updateWorkflow: vi.fn(),
}));
const llmMocks = vi.hoisted(() => ({ invokeLLM: vi.fn() }));

vi.mock("./db", () => dbMocks);
vi.mock("./_core/llm", () => llmMocks);

import { executeWorkflow } from "./workflowEngine";

const workflow = {
  id: 12,
  userId: 7,
  name: "Summarize notes",
  template: "summarize" as const,
  instructions: "Return the key decisions.",
  latestInput: null,
  isEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("executeWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.createTaskRun.mockResolvedValue(41);
    dbMocks.completeTaskRun.mockResolvedValue(undefined);
    dbMocks.failTaskRun.mockResolvedValue(undefined);
    dbMocks.updateWorkflow.mockResolvedValue(undefined);
  });

  it("persists a user-scoped completed task run and its output", async () => {
    llmMocks.invokeLLM.mockResolvedValue({
      model: "test-model",
      choices: [{ message: { content: "• Decision one\n• Decision two" } }],
    });

    const result = await executeWorkflow({ userId: 7, workflow, sourceText: "Long meeting notes" });

    expect(dbMocks.createTaskRun).toHaveBeenCalledWith(expect.objectContaining({
      userId: 7,
      workflowId: 12,
      type: "workflow",
      input: "Long meeting notes",
    }));
    expect(dbMocks.completeTaskRun).toHaveBeenCalledWith(41, "• Decision one\n• Decision two", expect.stringContaining("test-model"));
    expect(dbMocks.updateWorkflow).toHaveBeenCalledWith(7, 12, { latestInput: "Long meeting notes" });
    expect(result).toEqual({ taskRunId: 41, output: "• Decision one\n• Decision two" });
  });

  it("marks the same task run failed when the model invocation fails", async () => {
    llmMocks.invokeLLM.mockRejectedValue(new Error("Provider unavailable"));

    await expect(executeWorkflow({ userId: 7, workflow, sourceText: "Notes" })).rejects.toThrow("Provider unavailable");

    expect(dbMocks.failTaskRun).toHaveBeenCalledWith(41, "Provider unavailable");
    expect(dbMocks.completeTaskRun).not.toHaveBeenCalled();
  });
});
