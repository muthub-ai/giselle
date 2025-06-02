import { z } from "zod/v4";

export const WebPageProvider = z.enum(["fetch", "exa"]);
export type WebPageProvider = z.infer<typeof WebPageProvider>;

export const WebPageParseMethod = z.enum(["html", "json"]);
export type WebPageParseMethod = z.infer<typeof WebPageParseMethod>;

export const WebPageContent = z.object({
	type: z.literal("webPage"),
	url: z.string(),
	provider: WebPageProvider.default("fetch"),
	parse: WebPageParseMethod.default("html"),
	title: z.string().optional(),
	contentType: z.string().optional(),
	content: z.string().optional(),
});
export type WebPageContent = z.infer<typeof WebPageContent>;

export const WebPageContentReference = z.object({
	type: WebPageContent.shape.type,
});
export type WebPageContentReference = z.infer<typeof WebPageContentReference>;

export const WebPageFileResult = z.object({
	url: z.string(),
	title: z.string().optional(),
	contentType: z.string().optional(),
	content: z.string(),
});
export type WebPageFileResult = z.infer<typeof WebPageFileResult>;
