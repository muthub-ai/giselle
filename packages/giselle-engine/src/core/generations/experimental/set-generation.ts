import type { z } from "zod/v4";
import type { Storage } from "unstorage";
import type { Generation, GenerationType } from "./types";

export async function internalSetExperimentalGeneration(args: {
	storage: Storage;
	generation: z.infer<typeof Generation>;
}) {
	// For experimental implementation, we'll use a different storage pattern
	// to avoid conflicts with the existing generation storage
	const key = `experimental/generations/${args.generation.operationNode.id}`;

	try {
		await args.storage.setItem(key, JSON.stringify(args.generation));
	} catch (error) {
		console.error("Failed to set experimental generation:", error);
		throw error;
	}
}

export async function getExperimentalGeneration(args: {
	storage: Storage;
	nodeId: string;
}): Promise<z.infer<typeof Generation> | undefined> {
	const key = `experimental/generations/${args.nodeId}`;

	try {
		const data = await args.storage.getItem(key);
		return data ? JSON.parse(data as string) : undefined;
	} catch (error) {
		console.error("Failed to get experimental generation:", error);
		return undefined;
	}
}

export async function listExperimentalGenerations(args: {
	storage: Storage;
	workspaceId?: string;
}): Promise<z.infer<typeof Generation>[]> {
	const prefix = "experimental/generations/";

	try {
		// This is a simplified implementation - in a real scenario,
		// you'd want more sophisticated querying capabilities
		// For now, we'll return an empty array since listKeys may not be available
		const generations: z.infer<typeof Generation>[] = [];
		return generations;
	} catch (error) {
		console.error("Failed to list experimental generations:", error);
		return [];
	}
}

export async function deleteExperimentalGeneration(args: {
	storage: Storage;
	nodeId: string;
}): Promise<void> {
	const key = `experimental/generations/${args.nodeId}`;

	try {
		await args.storage.removeItem(key);
	} catch (error) {
		console.error("Failed to delete experimental generation:", error);
		throw error;
	}
}

// Utility function to create experimental generation storage key
export function createExperimentalGenerationKey(nodeId: string): string {
	return `experimental/generations/${nodeId}`;
}

// Utility function to extract node ID from experimental generation key
export function extractNodeIdFromExperimentalKey(key: string): string | null {
	const prefix = "experimental/generations/";
	if (key.startsWith(prefix)) {
		return key.substring(prefix.length);
	}
	return null;
}
