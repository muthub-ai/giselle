import type { WebPageNode } from "@giselle-sdk/data-type";
import clsx from "clsx/lite";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { LoaderIcon } from "lucide-react";
import { type FormEventHandler, useCallback, useTransition } from "react";
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
	const [isPending, startTransition] = useTransition();
	const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>((e) => {
		e.preventDefault();
		startTransition(async () => {
			await new Promise((resolve) => setTimeout(resolve, 2000));
		});
	}, []);

	return (
		<PropertiesPanelRoot>
			<PropertiesPanelHeader
				icon={<WebPageFileIcon className="size-[20px] text-black-900" />}
				node={node}
				onChangeName={(name) => updateNodeData(node, { name })}
			/>
			<PropertiesPanelContent>
				<form
					className="p-[4px] flex flex-col gap-[8px]"
					onSubmit={handleSubmit}
				>
					<div className="flex flex-col gap-[8px]">
						<label
							htmlFor="webpage-urls"
							className="font-semibold text-white-800"
						>
							URLs (one per line)
						</label>
						<textarea
							id="webpage-urls"
							className={clsx(
								"w-full min-h-[80px] p-[8px] border-[2px] border-black-400 rounded-[8px] bg-black-100 text-white-800 outline-none resize-none",
								// urlError && "border-error-900",
							)}
							// value={urls}
							// onChange={(e) => setUrls(e.target.value)}
							placeholder={"https://example.com\nhttps://docs.giselles.ai"}
							required
						/>
						{/* {urlError && (
							<p className="text-error-900 text-[12px]">{urlError}</p>
						)} */}
					</div>

					<div className="py-[16px] flex flex-col gap-[8px]">
						<label
							htmlFor="webpage-format"
							className="font-semibold text-white-800"
						>
							Output Format
						</label>
						<div className="flex gap-[16px] items-center">
							<label className="flex items-center gap-[4px] cursor-pointer">
								<input
									type="radio"
									name="webpage-format"
									value="markdown"
									// checked={format === "markdown"}
									// onChange={() => setFormat("markdown")}
									className="accent-blue-700"
								/>
								<span>Markdown</span>
							</label>
							<label className="flex items-center gap-[4px] cursor-pointer">
								<input
									type="radio"
									name="webpage-format"
									value="html"
									// checked={format === "html"}
									// onChange={() => setFormat("html")}
									className="accent-blue-700"
								/>
								<span>HTML</span>
							</label>
						</div>
					</div>

					<button
						type="submit"
						className="w-fit flex items-center gap-[4px] px-[16px] py-[8px] rounded-[8px] bg-blue-700 text-white-800 font-semibold hover:bg-blue-800 disabled:bg-black-400 cursor-pointer transition-colors"
						disabled={isPending}
					>
						{isPending && <LoaderIcon className="size-[14px] animate-spin" />}
						{isPending ? "Inserting" : "Insert"}
					</button>
				</form>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
