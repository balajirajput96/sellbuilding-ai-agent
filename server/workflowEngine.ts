import type { Workflow } from "../drizzle/schema";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";

const workflowInstructions = {
  summarize: "Create a concise, accurate summary. Preserve decisive facts, recommendations, and open questions.",
  translate: "Translate faithfully while preserving the original meaning, structure, tone, and formatting. If no target language is specified, ask for one.",
  classify: "Classify the supplied material into clear categories. Explain the classification criteria briefly and return a structured result.",
  generate: "Create a useful, polished output that follows the user's stated objective, format, audience, and constraints.",
} as const;

export type WorkflowTemplate = keyof typeof workflowInstructions;

export function getWorkflowSystemPrompt(workflow: Pick<Workflow, "template" | "instructions">) {
  return `You are executing a ${workflow.template} workflow. ${workflowInstructions[workflow.template]}

Workspace instructions: ${workflow.instructions}

Return only the completed result. Do not state that you are an AI or describe internal execution steps.`;
}

export async function executeWorkflow(input: {
  userId: number;
  workflow: Workflow;
  sourceText: string;
  scheduledJobId?: number;
}) {
  const taskRunId = await db.createTaskRun({
    userId: input.userId,
    workflowId: input.workflow.id,
    scheduledJobId: input.scheduledJobId,
    type: "workflow",
    title: input.workflow.name,
    input: input.sourceText,
    metadata: JSON.stringify({ template: input.workflow.template }),
  });

  try {
    const completion = await invokeLLM({
      messages: [
        { role: "system", content: getWorkflowSystemPrompt(input.workflow) },
        { role: "user", content: input.sourceText },
      ],
      maxTokens: 1800,
    });
    const rawOutput = completion.choices[0]?.message.content ?? "";
    const output = typeof rawOutput === "string" ? rawOutput : rawOutput.map(part => part.type === "text" ? part.text : "").join("");
    await db.completeTaskRun(taskRunId, output, JSON.stringify({ model: completion.model, template: input.workflow.template }));
    await db.updateWorkflow(input.userId, input.workflow.id, { latestInput: input.sourceText });
    return { taskRunId, output };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workflow execution failed";
    await db.failTaskRun(taskRunId, message);
    throw error;
  }
}
