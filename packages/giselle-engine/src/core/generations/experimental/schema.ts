import {
	FileId,
	InputId,
	OperationNode,
	OutputId,
	FlowTriggerId as TriggerId,
	WorkspaceId,
} from "@giselle-sdk/data-type";
import { z } from "zod/v4";

const UserTrigger = z.object({
	type: z.literal("user"),
	workspaceId: WorkspaceId,
	interface: z.enum(["studio", "api"]),
});

const MCPTrigger = z.object({
	type: z.literal("mcp"),
	triggerId: TriggerId,
});

const GitHubTrigger = z.object({
	type: z.literal("github"),
	triggerId: TriggerId,
});

const GenerationTrigger = z.discriminatedUnion("type", [
	UserTrigger,
	MCPTrigger,
	GitHubTrigger,
]);

const TextPart = z.object({
	type: z.literal("part.text"),
	text: z.string(),
});
const FilePart = z.object({
	type: z.literal("part.file"),
	fileId: FileId.schema,
	workspaceId: WorkspaceId.schema,
});

const GenerationMessagePart = z.discriminatedUnion("type", [
	TextPart,
	FilePart,
]);

const GenerationInput = z.object({
	id: InputId,
	parts: z.array(GenerationMessagePart),
});

const GenerationOutput = z.object({
	id: OutputId,
	parts: z.array(GenerationMessagePart),
});

const GenerationBase = z.object({
	operationNode: OperationNode,
	trigger: GenerationTrigger,
	status: z.string(),
	inputs: z.array(GenerationInput),
	outputs: z.array(GenerationOutput),
});

const QueuedGeneration = GenerationBase.extend({
	status: z.literal("queued"),
	queuedAt: z.number(),
});

const RunningGeneration = GenerationBase.extend({
	status: z.literal("running"),
	startedAt: z.number(),
});

const CompletedGeneration = GenerationBase.extend({
	status: z.literal("completed"),
	completedAt: z.number(),
});

const Generation = z.discriminatedUnion("status", [
	QueuedGeneration,
	RunningGeneration,
	CompletedGeneration,
]);

const GenerationStatus = z.union(
	Generation.def.options.map((option) => option.shape.status),
);
