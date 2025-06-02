import {
	type FileData,
	type Message,
	type NodeId,
	type OutputId,
	WorkspaceId,
	GenerationContext,
	isCompletedGeneration,
} from "@giselle-sdk/data-type";
import type { DataContent } from "ai";
import type { z } from "zod/v4";
import { UsageLimitError } from "../../error";
import { filePath } from "../../files/utils";
import type { GiselleEngineContext } from "../../types";
import {
	checkUsageLimits,
	getGeneration,
	getNodeGenerationIndexes,
	handleAgentTimeConsumption,
	queryResultToText,
} from "../utils";
import {
	getExperimentalGeneration,
	internalSetExperimentalGeneration,
} from "./set-generation";
import type {
	CompletedGeneration,
	ExperimentalGenerationContext,
	Generation,
	GenerationOutput,
	QueuedGeneration,
	RunningGeneration,
} from "./types";

export async function useExperimentalGenerationExecutor<T>(args: {
	context: GiselleEngineContext;
	generation: z.infer<typeof QueuedGeneration>;
	execute: (utils: {
		runningGeneration: z.infer<typeof RunningGeneration>;
		generationContext: ExperimentalGenerationContext;
		setGeneration: (generation: z.infer<typeof Generation>) => Promise<void>;
		fileResolver: (file: FileData) => Promise<DataContent>;
		generationContentResolver: (
			nodeId: NodeId,
			outputId: OutputId,
		) => Promise<string | undefined>;
		workspaceId: WorkspaceId;
		completeGeneration: (args: {
			outputs: z.infer<typeof GenerationOutput>[];
			usage?: {
				promptTokens: number;
				completionTokens: number;
				totalTokens: number;
			};
			messages?: Message[];
		}) => Promise<z.infer<typeof CompletedGeneration>>;
	}) => Promise<T>;
}): Promise<T> {
	let workspaceId: WorkspaceId;
	if (args.generation.trigger.type === "user") {
		workspaceId = args.generation.trigger.workspaceId;
	} else {
		// For experimental implementation, derive workspace from trigger
		// In a real implementation, you'd want proper workspace resolution
		throw new Error("Non-user triggers not fully implemented in experimental version");
	}

	// Convert experimental generation context
	const generationContext: ExperimentalGenerationContext = {
		operationNode: args.generation.operationNode,
		sourceNodes: [], // Will be populated based on actual context
		origin: args.generation.trigger.type === "user" 
			? { type: "workspace" as const, id: args.generation.trigger.workspaceId, workspaceId: undefined }
			: { type: "run" as const, id: WorkspaceId.parse("wrks-experimental"), workspaceId: workspaceId },
	};

	const runningGeneration: z.infer<typeof RunningGeneration> = {
		...args.generation,
		status: "running",
		startedAt: Date.now(),
	};

	const setGeneration = async (generation: z.infer<typeof Generation>) => {
		await internalSetExperimentalGeneration({
			storage: args.context.storage,
			generation,
		});
	};

	await setGeneration(runningGeneration);

	// Convert experimental generation to legacy format for usage limit checking
	const legacyGeneration = {
		id: `gnr-${Date.now()}` as const,
		context: {
			operationNode: args.generation.operationNode,
			sourceNodes: generationContext.sourceNodes,
			origin: generationContext.origin,
			connections: [],
		},
		createdAt: Date.now(),
		queuedAt: args.generation.queuedAt,
		status: args.generation.status,
	};

	const usageLimitStatus = await checkUsageLimits({
		workspaceId,
		generation: legacyGeneration,
		fetchUsageLimitsFn: args.context.fetchUsageLimitsFn,
	});

	if (usageLimitStatus.type === "error") {
		const failedGeneration: z.infer<typeof Generation> = {
			...runningGeneration,
			status: "failed",
			failedAt: Date.now(),
			error: {
				name: usageLimitStatus.error,
				message: usageLimitStatus.error,
				dump: usageLimitStatus,
			},
		};
		await setGeneration(failedGeneration);
		throw new UsageLimitError(usageLimitStatus.error);
	}

	async function fileResolver(file: FileData): Promise<DataContent> {
		const pathArgs = generationContext.origin.type === "workspace" 
			? { type: "workspace" as const, id: generationContext.origin.id as WorkspaceId, fileId: file.id }
			: { type: "run" as const, id: `rn-${Date.now()}` as const, workspaceId: workspaceId, fileId: file.id };
		
		const blob = await args.context.storage.getItemRaw(filePath(pathArgs));
		if (blob === undefined) {
			return new Uint8Array() as DataContent;
		}
		return blob as DataContent;
	}

	async function generationContentResolver(nodeId: NodeId, outputId: OutputId) {
		// First, try to get from experimental generations
		const experimentalGeneration = await getExperimentalGeneration({
			storage: args.context.storage,
			nodeId: nodeId.toString(),
		});

		if (
			experimentalGeneration &&
			experimentalGeneration.status === "completed"
		) {
			const output = experimentalGeneration.outputs.find(
				(o) => o.id === outputId,
			);
			if (output) {
				// Convert experimental output parts to text
				return output.parts
					.filter((part) => part.type === "part.text")
					.map((part) => part.text)
					.join(" ");
			}
		}

		// Fallback to legacy generation system
		const nodeGenerationIndexes = await getNodeGenerationIndexes({
			storage: args.context.storage,
			nodeId,
		});
		if (
			nodeGenerationIndexes === undefined ||
			nodeGenerationIndexes.length === 0
		) {
			return undefined;
		}

		const generation = await getGeneration({
			storage: args.context.storage,
			generationId: nodeGenerationIndexes[nodeGenerationIndexes.length - 1].id,
		});
		if (generation === undefined || !isCompletedGeneration(generation)) {
			return undefined;
		}

		const generationOutput = generation.outputs.find(
			(o) => o.outputId === outputId,
		);
		if (generationOutput === undefined) {
			return undefined;
		}

		switch (generationOutput.type) {
			case "source":
				return JSON.stringify(generationOutput.sources);
			case "generated-text":
				return generationOutput.content;
			case "query-result":
				return queryResultToText(generationOutput);
			default:
				throw new Error("Generation output type is not supported");
		}
	}

	async function completeGeneration({
		outputs,
		usage,
		messages,
	}: {
		outputs: z.infer<typeof GenerationOutput>[];
		usage?: {
			promptTokens: number;
			completionTokens: number;
			totalTokens: number;
		};
		messages?: Message[];
	}): Promise<z.infer<typeof CompletedGeneration>> {
		const completedGeneration: z.infer<typeof CompletedGeneration> = {
			...runningGeneration,
			status: "completed",
			completedAt: Date.now(),
			outputs: outputs,
		};

		// Convert to legacy format for agent time consumption
		const legacyCompletedGeneration = {
			id: `gnr-${Date.now()}` as const,
			context: {
				operationNode: completedGeneration.operationNode,
				sourceNodes: generationContext.sourceNodes,
				origin: generationContext.origin,
				connections: [],
			},
			createdAt: Date.now(),
			queuedAt: args.generation.queuedAt,
			startedAt: runningGeneration.startedAt,
			completedAt: completedGeneration.completedAt,
			status: "completed" as const,
			outputs: [],
			usage,
			messages: messages ?? [],
		};

		await Promise.all([
			setGeneration(completedGeneration),
			handleAgentTimeConsumption({
				workspaceId,
				generation: legacyCompletedGeneration,
				onConsumeAgentTime: args.context.onConsumeAgentTime,
			}),
		]);

		return completedGeneration;
	}

	return args.execute({
		runningGeneration,
		generationContext,
		setGeneration,
		fileResolver,
		generationContentResolver,
		workspaceId,
		completeGeneration,
	});
}
