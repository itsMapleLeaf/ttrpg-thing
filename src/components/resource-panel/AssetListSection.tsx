import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import type { ClientAsset } from "../../../convex/assets.ts"
import { useSelection } from "../../hooks/useSelection.ts"
import { useUploadImage } from "../../hooks/useUploadImage.ts"
import { titleifyFileName } from "../../lib/helpers.ts"
import { EmptyState } from "../../ui/EmptyState.tsx"
import { useToastContext } from "../../ui/Toast.tsx"
import { AssetCard } from "../AssetCard.tsx"
import { ToggleSection } from "./ToggleSection.tsx"

export function AssetListSection({
	roomId,
	assets,
}: {
	roomId: Id<"rooms">
	assets: ClientAsset[]
}) {
	const createAsset = useMutation(api.assets.create)
	const removeAssets = useMutation(api.assets.removeMany)
	const toast = useToastContext()
	const uploadImage = useUploadImage()

	const { selection, selectedCount, clearSelection, selectAll, setSelected } =
		useSelection(assets?.map((asset) => asset._id) ?? [])

	const uploadAssets = async (files: File[]) => {
		const results = await Promise.all(
			files.map(async (file) => {
				const { name } = file // files can get GC'd, so capture the name for output later
				try {
					const fileId = await uploadImage(file)
					await createAsset({
						roomId,
						name: titleifyFileName(file.name),
						fileId,
					})
					return { success: true } as const
				} catch (error) {
					console.error(error)
					return { success: false, name } as const
				}
			}),
		)

		const failedResults = results.filter((it) => !it.success)
		if (failedResults.length > 0) {
			toast.error(
				`The following files failed to upload:\n${failedResults.map((it) => it.name).join("\n")}`,
			)
		}
	}

	return (
		<ToggleSection
			name="Assets"
			subtext={selectedCount > 0 && `${selectedCount} selected`}
			actions={[
				selectedCount > 0 && {
					name: "Delete selected",
					icon: "mingcute:delete-2-fill",
					callback: async () => {
						if (
							confirm(
								`Are you sure you want to delete ${selectedCount} assets?`,
							)
						) {
							await removeAssets({ ids: [...selection] })
							clearSelection()
						}
					},
				},
				selectedCount === 0 && {
					name: "Upload",
					icon: "mingcute:upload-2-fill",
					callback: () => {
						const input = document.createElement("input")
						input.type = "file"
						input.multiple = true
						input.accept = "image/png,image/jpeg,image/webp"
						input.oninput = () => {
							const files = [...(input.files ?? [])]
							if (files.length > 0) {
								uploadAssets(files)
							}
						}
						input.click()
					},
				},
				selectedCount < assets.length && {
					name: "Select all",
					icon: "mingcute:checks-fill",
					callback: () => {
						selectAll()
					},
				},
				selectedCount > 0 && {
					name: "Clear selection",
					icon: "mingcute:minus-square-fill",
					callback: () => {
						clearSelection()
					},
				},
			]}
		>
			{assets.length === 0 ? (
				<EmptyState icon="mingcute:pic-line" message="No assets yet" />
			) : (
				<div className="grid grid-cols-2 gap-2 p-2">
					{assets.map((asset) => (
						<AssetCard
							key={asset._id}
							asset={asset}
							selected={selection.has(asset._id)}
							onChangeSelected={(selected) => setSelected(asset._id, selected)}
						/>
					))}
				</div>
			)}
		</ToggleSection>
	)
}
