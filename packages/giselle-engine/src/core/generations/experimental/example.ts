import {
	NodeId,
	OperationNode,
	OutputId,
	WorkspaceId,
} from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../../types";
import {
	generateTextExperimental,
	type QueuedGenerationType,
	type UserTriggerType,
	createExperimentalTextPart,
} from "./index";

/**
 * Example usage of the experimental generation system
 * 
 * This demonstrates the new schema-based approach with:
 * - Parts-based input/output structure
 * - New trigger system (user, MCP, GitHub)
 * - Experimental generation execution
 */
export async function experimentalGenerationExample(
	context: GiselleEngineContext,
) {
	// Create a sample operation node for text generation
	const operationNode: OperationNode = {
		id: NodeId.parse("nd-example-123"),
		type: "operation",
		name: "Example Text Generation",
		inputs: [
			{
				id: "inp-example-input",
				label: "User Input",
				accessor: "user-input",
				isRequired: true,
			},
		],
		outputs: [
			{
				id: OutputId.parse("otp-example-output"),
				label: "Generated Text",
				accessor: "generated-text",
			},
		],
		content: {
			type: "textGeneration",
			llm: {
				provider: "anthropic",
				id: "claude-3-5-sonnet-20241022",
				configurations: {
					reasoning: false,
					searchGrounding: false,
				},
			},
			prompt: "Hello, this is an experimental generation example. Please respond with a greeting.",
		},
	};

	// Create experimental user trigger
	const userTrigger: UserTriggerType = {
		type: "user",
		workspaceId: WorkspaceId.parse("wrks-example-workspace"),
		interface: "studio",
	};

	// Create experimental queued generation
	const queuedGeneration: QueuedGenerationType = {
		operationNode,
		trigger: userTrigger,
		status: "queued",
		queuedAt: Date.now(),
		inputs: [
			{
				id: "inp-example-input",
				parts: [
					createExperimentalTextPart("Hello from the experimental system!"),
				],
			},
		],
		outputs: [], // Will be populated during execution
	};

	try {
		// Execute experimental generation
		console.log("Starting experimental generation...");
		
		const result = await generateTextExperimental({
			context,
			generation: queuedGeneration,
			telemetry: {
				metadata: {
					source: "experimental-example",
					version: "1.0.0",
				},
			},
		});

		console.log("Experimental generation completed successfully!");
		console.log("Result:", result);

		return result;
	} catch (error) {
		console.error("Experimental generation failed:", error);
		throw error;
	}
}

/**
 * Example of creating different trigger types
 */
export function createExperimentalTriggers() {
	// User trigger (from studio interface)
	const userStudioTrigger: UserTriggerType = {
		type: "user",
		workspaceId: WorkspaceId.parse("wrks-studio-example"),
		interface: "studio",
	};

	// User trigger (from API)
	const userApiTrigger: UserTriggerType = {
		type: "user",
		workspaceId: WorkspaceId.parse("wrks-api-example"),
		interface: "api",
	};

	// MCP trigger
	const mcpTrigger = {
		type: "mcp" as const,
		triggerId: "trg-mcp-example",
	};

	// GitHub trigger
	const githubTrigger = {
		type: "github" as const,
		triggerId: "trg-github-example",
	};

	return {
		userStudioTrigger,
		userApiTrigger,
		mcpTrigger,
		githubTrigger,
	};
}

/**
 * Example of working with experimental parts-based structure
 */
export function createExperimentalParts() {
	// Text part
	const textPart = createExperimentalTextPart(
		"This is a text part in the experimental system"
	);

	// File part
	const filePart = {
		type: "part.file" as const,
		fileId: "fl-example-file",
		workspaceId: "wrks-example-workspace",
	};

	// Multiple parts for complex input
	const complexInput = {
		id: "inp-complex-example",
		parts: [
			createExperimentalTextPart("Please analyze this file: "),
			filePart,
			createExperimentalTextPart(" and provide a summary."),
		],
	};

	return {
		textPart,
		filePart,
		complexInput,
	};
}

/**
 * Example of experimental vs legacy comparison
 */
export function experimentalVsLegacyComparison() {
	return {
		experimental: {
			description: "New schema-based approach",
			features: [
				"Parts-based input/output structure",
				"Enhanced trigger system (user, MCP, GitHub)",
				"Flexible content composition",
				"Better separation of concerns",
				"Experimental telemetry integration",
			],
			outputStructure: {
				id: OutputId.parse("otp-example"),
				parts: [
					{
						type: "part.text",
						text: "Generated response text",
					},
				],
			},
		},
		legacy: {
			description: "Current implementation",
			features: [
				"Single-type outputs",
				"Basic trigger system",
				"Monolithic structure",
				"Established telemetry",
			],
			outputStructure: {
				type: "generated-text",
				content: "Generated response text",
				outputId: OutputId.parse("otp-example"),
			},
		},
	};
}

/**
 * Utility function to convert experimental output to text
 */
export function extractTextFromExperimentalOutput(
	outputs: Array<{
		id: string;
		parts: Array<{ type: string; text?: string }>;
	}>
): string {
	return outputs
		.flatMap(output => 
			output.parts
				.filter(part => part.type === "part.text" && part.text)
				.map(part => part.text!)
		)
		.join(" ");
}