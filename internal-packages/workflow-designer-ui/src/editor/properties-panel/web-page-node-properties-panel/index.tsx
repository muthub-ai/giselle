import type { WebPageNode } from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { WebPageFileIcon } from "../../../icons";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
} from "../ui";
import { useWebPageNode } from "./use-web-page-node";

export function WebPageNodePropertiesPanel({ node }: { node: WebPageNode }) {
	const { updateNodeData } = useWorkflowDesigner();
	const { url, setUrl, provider, setProvider, parse, setParse } =
		useWebPageNode(node);

	return (
		<PropertiesPanelRoot>
			<PropertiesPanelHeader
				icon={<WebPageFileIcon className="size-[20px] text-black-900" />}
				node={node}
				onChangeName={(name) => updateNodeData(node, { name })}
			/>
			<PropertiesPanelContent>
				<div className="p-[16px] flex flex-col gap-[16px]">
					<div className="flex flex-col gap-[8px]">
						<label className="font-semibold text-white-800" htmlFor="url">
							URL
						</label>
						<input
							id="url"
							type="text"
							className="w-full p-[8px] border border-black-400 rounded-[8px] bg-black-100 text-white-800"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
						/>
					</div>
					<div className="flex flex-col gap-[8px]">
						<label htmlFor="provider" className="font-semibold text-white-800">
							Provider
						</label>
						<select
							id="provider"
							className="w-fit p-[8px] border border-black-400 rounded-[8px] bg-black-100 text-white-800"
							value={provider}
							onChange={(e) =>
								setProvider(
									e.target.value as WebPageNode["content"]["provider"],
								)
							}
						>
							<option value="fetch">Fetch</option>
							<option value="exa">Exa</option>
						</select>
					</div>
					<div className="flex flex-col gap-[8px]">
						<label htmlFor="parse" className="font-semibold text-white-800">
							Parse Method
						</label>
						<select
							id="parse"
							className="w-fit p-[8px] border border-black-400 rounded-[8px] bg-black-100 text-white-800"
							value={parse}
							onChange={(e) =>
								setParse(e.target.value as WebPageNode["content"]["parse"])
							}
						>
							<option value="html">HTML</option>
							<option value="json">JSON</option>
						</select>
					</div>
				</div>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
