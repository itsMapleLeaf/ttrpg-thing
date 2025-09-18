import { Dialog } from "@base-ui-components/react"
import { useState } from "react"
import { twMerge } from "tailwind-merge"
import { vec } from "../../lib/vec.ts"
import { Button } from "../../ui/Button.tsx"

type AssetImportPreset = (typeof IMPORT_PRESETS)[number]
const IMPORT_PRESETS = [
	{ name: "Tile", size: vec(100, 100) },
	{ name: "Map", size: vec(1000, 1000) },
	{ name: "Portrait", size: vec(400, 600) },
	{ name: "Scene", size: vec(1600 * 2, 900 * 2) },
]

export function useAssetImportDialog(
	onSubmit: (preset: AssetImportPreset, files: File[]) => void,
) {
	const [visible, setVisible] = useState(false)
	const [files, setFiles] = useState<File[]>([])

	const element = (
		<Dialog.Root open={visible}>
			<Dialog.Portal>
				<Dialog.Backdrop className="fixed inset-0 bg-black/50 transition data-ending-style:opacity-0 data-starting-style:opacity-0" />
				<Dialog.Popup className="fixed inset-0 flex-center flex-col gap-8 overflow-y-auto text-center">
					<Dialog.Title className="text-2xl font-light">
						Choose a preset
					</Dialog.Title>

					<div className="flex flex-wrap items-center gap-8">
						{/* <button type="button" className="flex flex-col gap-2">
							<div className="aspect-[1/1] panel">
								<p>100x100</p>
							</div>
							<p>Tile</p>
						</button> */}

						{IMPORT_PRESETS.map((preset) => (
							<button
								key={preset.name}
								type="button"
								className="flex flex-col gap-2 rounded p-2 opacity-75 transition hover:bg-white/10 hover:opacity-100"
								onClick={() => {
									onSubmit(preset, files)
									setVisible(false)
								}}
							>
								<div className="flex-center size-48">
									<div
										className={twMerge(
											"flex-center panel text-gray-500",
											preset.size.x > preset.size.y ? "w-full" : "h-full",
										)}
										style={{
											aspectRatio: `${preset.size.x}/${preset.size.y}`,
										}}
									>
										{preset.size.x}x{preset.size.y}
									</div>
								</div>
								<p>{preset.name}</p>
							</button>
						))}
					</div>

					<Button icon="mingcute:close-fill" onClick={() => setVisible(false)}>
						Cancel
					</Button>
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	)

	return {
		element,
		show: (files: File[]) => {
			setFiles(files)
			setVisible(true)
		},
	}
}
