import {
	FileId,
	InputId,
	type Node,
	OperationNode,
	OutputId,
	FlowTriggerId as TriggerId,
	WorkspaceId,
} from "@giselle-sdk/data-type";
import { z } from "zod/v4";

export const UserTrigger = z.object({
	type: z.literal("user"),
	workspaceId: WorkspaceId,
	interface: z.enum(["studio", "api"]),
});

export const MCPTrigger = z.object({
	type: z.literal("mcp"),
	triggerId: TriggerId,
});

export const GitHubTrigger = z.object({
	type: z.literal("github"),
	triggerId: TriggerId,
});

export const GenerationTrigger = z.discriminatedUnion("type", [
	UserTrigger,
	MCPTrigger,
	GitHubTrigger,
]);

export const TextPart = z.object({
	type: z.literal("part.text"),
	text: z.string(),
});

export const FilePart = z.object({
	type: z.literal("part.file"),
	fileId: FileId.schema,
	workspaceId: WorkspaceId.schema,
});

export const GenerationMessagePart = z.discriminatedUnion("type", [
	TextPart,
	FilePart,
]);

export const GenerationInput = z.object({
	id: InputId,
	parts: z.array(GenerationMessagePart),
});

export const GenerationOutput = z.object({
	id: OutputId,
	parts: z.array(GenerationMessagePart),
});

export const GenerationBase = z.object({
	operationNode: OperationNode,
	trigger: GenerationTrigger,
	status: z.string(),
	inputs: z.array(GenerationInput),
	outputs: z.array(GenerationOutput),
});

export const QueuedGeneration = GenerationBase.extend({
	status: z.literal("queued"),
	queuedAt: z.number(),
});

export const RunningGeneration = GenerationBase.extend({
	status: z.literal("running"),
	startedAt: z.number(),
});

export const CompletedGeneration = GenerationBase.extend({
	status: z.literal("completed"),
	completedAt: z.number(),
});

export const FailedGeneration = GenerationBase.extend({
	status: z.literal("failed"),
	failedAt: z.number(),
	error: z.object({
		name: z.string(),
		message: z.string(),
		dump: z.any().optional(),
	}),
});

export const Generation = z.discriminatedUnion("status", [
	QueuedGeneration,
	RunningGeneration,
	CompletedGeneration,
	FailedGeneration,
]);

export const GenerationStatus = z.union(
	Generation.def.options.map((option) => option.shape.status),
);

// Type exports for convenience
export type UserTriggerType = z.infer<typeof UserTrigger>;
export type MCPTriggerType = z.infer<typeof MCPTrigger>;
export type GitHubTriggerType = z.infer<typeof GitHubTrigger>;
export type GenerationTriggerType = z.infer<typeof GenerationTrigger>;
export type TextPartType = z.infer<typeof TextPart>;
export type FilePartType = z.infer<typeof FilePart>;
export type GenerationMessagePartType = z.infer<typeof GenerationMessagePart>;
export type GenerationInputType = z.infer<typeof GenerationInput>;
export type GenerationOutputType = z.infer<typeof GenerationOutput>;
export type QueuedGenerationType = z.infer<typeof QueuedGeneration>;
export type RunningGenerationType = z.infer<typeof RunningGeneration>;
export type CompletedGenerationType = z.infer<typeof CompletedGeneration>;
export type FailedGenerationType = z.infer<typeof FailedGeneration>;
export type GenerationType = z.infer<typeof Generation>;
export type GenerationStatusType = z.infer<typeof GenerationStatus>;

// Context type for experimental generation execution
export interface ExperimentalGenerationContext {
	operationNode: OperationNode;
	sourceNodes: Node[];
	origin: {
		type: "run" | "workspace";
		workspaceId?: WorkspaceId;
		id?: WorkspaceId;
	};
}
