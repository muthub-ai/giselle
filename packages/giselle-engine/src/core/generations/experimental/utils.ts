import {
	NodeId,
	OutputId,
} from "@giselle-sdk/data-type";
import type {
	FileData,
	ImageGenerationNode,
	Node,
	OperationNode,
	TextGenerationNode,
} from "@giselle-sdk/data-type";
import type { CoreMessage, DataContent, FilePart, ImagePart } from "ai";
import {
	getFileContents,
	getFilesDescription,
	isJsonContent,
	jsonContentToText,
} from "../utils";

export async function buildExperimentalMessageObject(
	node: OperationNode,
	contextNodes: Node[],
	fileResolver: (file: FileData) => Promise<DataContent>,
	textGenerationResolver: (
		nodeId: NodeId,
		outputId: OutputId,
	) => Promise<string | undefined>,
): Promise<CoreMessage[]> {
	switch (node.content.type) {
		case "textGeneration": {
			return await buildExperimentalGenerationMessageForTextGeneration(
				node as TextGenerationNode,
				contextNodes,
				fileResolver,
				textGenerationResolver,
			);
		}
		case "imageGeneration": {
			return await buildExperimentalGenerationMessageForImageGeneration(
				node as ImageGenerationNode,
				contextNodes,
				fileResolver,
				textGenerationResolver,
			);
		}
		case "action":
		case "trigger":
		case "query": {
			return [];
		}
		default: {
			const _exhaustiveCheck: never = node.content;
			throw new Error(`Unhandled content type: ${_exhaustiveCheck}`);
		}
	}
}

async function buildExperimentalGenerationMessageForTextGeneration(
	node: TextGenerationNode,
	contextNodes: Node[],
	fileResolver: (file: FileData) => Promise<DataContent>,
	textGenerationResolver: (
		nodeId: NodeId,
		outputId: OutputId,
	) => Promise<string | undefined>,
): Promise<CoreMessage[]> {
	const prompt = node.content.prompt;
	if (prompt === undefined) {
		throw new Error("Prompt cannot be empty");
	}

	let userMessage = prompt;

	if (isJsonContent(prompt)) {
		userMessage = jsonContentToText(JSON.parse(prompt));
	}

	const pattern = /\{\{(nd-[a-zA-Z0-9]+):(otp-[a-zA-Z0-9]+)\}\}/g;
	const sourceKeywords = [...userMessage.matchAll(pattern)].map((match) => ({
		nodeId: NodeId.parse(match[1]),
		outputId: OutputId.parse(match[2]),
	}));

	const attachedFiles: (FilePart | ImagePart)[] = [];
	const attachedFileNodeIds: NodeId[] = [];

	for (const sourceKeyword of sourceKeywords) {
		const contextNode = contextNodes.find(
			(contextNode) => contextNode.id === sourceKeyword.nodeId,
		);
		if (contextNode === undefined) {
			continue;
		}
		const replaceKeyword = `{{${sourceKeyword.nodeId}:${sourceKeyword.outputId}}}`;

		switch (contextNode.content.type) {
			case "text": {
				const jsonOrText = contextNode.content.text;
				const text = isJsonContent(jsonOrText)
					? jsonContentToText(JSON.parse(jsonOrText))
					: jsonOrText;
				userMessage = userMessage.replace(replaceKeyword, text);
				break;
			}
			case "textGeneration": {
				const result = await textGenerationResolver(
					contextNode.id,
					sourceKeyword.outputId,
				);
				// If there is no matching Output, replace it with an empty string (remove the pattern string from userMessage)
				userMessage = userMessage.replace(replaceKeyword, result ?? "");
				break;
			}
			case "file":
				if (
					attachedFileNodeIds.some(
						(attachedFileNodeId) => contextNode.id === attachedFileNodeId,
					)
				) {
					continue;
				}
				switch (contextNode.content.category) {
					case "text": {
						// For text files, extract content as string
						const uploadedFiles = contextNode.content.files.filter(f => f.status === "uploaded");
						let textContent = "";
						for (const file of uploadedFiles) {
							const data = await fileResolver(file);
							if (data instanceof Uint8Array) {
								textContent += new TextDecoder().decode(data) + "\n";
							}
						}
						const filesDescription = getFilesDescription([contextNode.content]);
						userMessage = userMessage.replace(
							replaceKeyword,
							`${filesDescription}\n\n${textContent}`,
						);
						break;
					}
					case "image": {
						// For image files, get the first uploaded file and use it as image data
						const uploadedFile = contextNode.content.files.find(f => f.status === "uploaded");
						if (uploadedFile) {
							const imageData = await fileResolver(uploadedFile);
							attachedFiles.push({
								type: "image",
								image: imageData,
							});
						}
						userMessage = userMessage.replace(replaceKeyword, "");
						break;
					}
				}
				attachedFileNodeIds.push(contextNode.id);
				break;
			case "query": {
				const result = await textGenerationResolver(
					contextNode.id,
					sourceKeyword.outputId,
				);
				userMessage = userMessage.replace(replaceKeyword, result ?? "");
				break;
			}
			case "imageGeneration": {
				const result = await textGenerationResolver(
					contextNode.id,
					sourceKeyword.outputId,
				);
				if (result) {
					// For experimental implementation, treat image generation results as text descriptions
					userMessage = userMessage.replace(replaceKeyword, result);
				} else {
					userMessage = userMessage.replace(replaceKeyword, "");
				}
				break;
			}
		}
	}

	const messages: CoreMessage[] = [
		{
			role: "user",
			content: [
				{
					type: "text",
					text: userMessage,
				},
				...attachedFiles,
			],
		},
	];

	return messages;
}

// Placeholder for image generation - simplified for experimental implementation
async function buildExperimentalGenerationMessageForImageGeneration(
	node: ImageGenerationNode,
	contextNodes: Node[],
	fileResolver: (file: FileData) => Promise<DataContent>,
	textGenerationResolver: (
		nodeId: NodeId,
		outputId: OutputId,
	) => Promise<string | undefined>,
): Promise<CoreMessage[]> {
	// For experimental implementation, we'll return an empty array
	// This can be expanded later based on specific requirements
	return [];
}

// Utility function to convert experimental output parts to text
export function experimentalPartsToText(
	parts: Array<{ type: string; text?: string; fileId?: string }>,
): string {
	return parts
		.filter((part) => part.type === "part.text" && part.text)
		.map((part) => part.text)
		.join(" ");
}

// Utility function to create text parts for experimental outputs
export function createExperimentalTextPart(text: string) {
	return {
		type: "part.text" as const,
		text,
	};
}

// Utility function to create file parts for experimental outputs
export function createExperimentalFilePart(
	fileId: string,
	workspaceId: string,
) {
	return {
		type: "part.file" as const,
		fileId,
		workspaceId,
	};
}
