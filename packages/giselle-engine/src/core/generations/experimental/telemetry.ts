import type { AnthropicProviderOptions } from "@ai-sdk/anthropic";
import type { LanguageModel } from "@giselle-sdk/language-model";
import type { ToolSet } from "ai";

// Re-export telemetry functions from the parent module for experimental use
import {
	createLangfuseTracer,
	generateTelemetryTags,
} from "../telemetry";

export {
	createLangfuseTracer,
	generateTelemetryTags,
};

// Experimental telemetry types and interfaces
export interface ExperimentalTelemetrySettings {
	metadata?: {
		[key: string]: unknown;
	};
	experimental?: {
		enableNewTracking?: boolean;
		customTags?: string[];
	};
}

// Future experimental telemetry functions can be added here
export function createExperimentalTelemetryTags(args: {
	provider: string;
	languageModel: LanguageModel;
	toolSet: ToolSet;
	configurations?: Record<string, unknown>;
	providerOptions?: {
		anthropic?: AnthropicProviderOptions;
		perplexity?: Record<string, unknown>;
	};
	experimentalFeatures?: string[];
}): string[] {
	// Start with existing tags
	const baseTags = generateTelemetryTags({
		...args,
		configurations: args.configurations ?? {},
	});

	// Add experimental-specific tags
	const experimentalTags = ["experimental", "experimental-schema"];

	// Add experimental feature tags if provided
	if (args.experimentalFeatures) {
		experimentalTags.push(
			...args.experimentalFeatures.map((f) => `experimental-${f}`),
		);
	}

	return [...baseTags, ...experimentalTags];
}

// Placeholder for future experimental telemetry tracer
export function createExperimentalLangfuseTracer(args: any) {
	// For now, this is a placeholder that doesn't actually create a tracer
	// In the future, this could implement experimental tracking features
	return {
		shutdownAsync: async () => {},
		flush: async () => {},
	};
}

// This file allows for future experimental telemetry implementations
// while maintaining compatibility with existing telemetry infrastructure
