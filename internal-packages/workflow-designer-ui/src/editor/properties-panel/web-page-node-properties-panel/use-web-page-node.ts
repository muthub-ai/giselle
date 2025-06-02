import type { WebPageNode } from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { useCallback, useState } from "react";

export function useWebPageNode(node: WebPageNode) {
	const { updateNodeDataContent } = useWorkflowDesigner();
	const [url, setUrl] = useState(node.content.url ?? "");
	const [provider, setProvider] = useState(node.content.provider);
	const [parse, setParse] = useState(node.content.parse);

	const update = useCallback(
		(partial: Partial<WebPageNode["content"]>) => {
			updateNodeDataContent(node, partial);
		},
		[node, updateNodeDataContent],
	);

	const handleUrl = useCallback(
		(value: string) => {
			setUrl(value);
			update({ url: value });
		},
		[update],
	);

	const handleProvider = useCallback(
		(value: WebPageNode["content"]["provider"]) => {
			setProvider(value);
			update({ provider: value });
		},
		[update],
	);

	const handleParse = useCallback(
		(value: WebPageNode["content"]["parse"]) => {
			setParse(value);
			update({ parse: value });
		},
		[update],
	);

	return {
		url,
		setUrl: handleUrl,
		provider,
		setProvider: handleProvider,
		parse,
		setParse: handleParse,
	};
}
