import { useMutation } from "convex/react"
import { useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import type { ClientAsset } from "../../convex/assets.ts"
import { useUploadImage } from "../hooks/useUploadImage.ts"
import { getOptimizedImageUrl, titleifyFileName } from "../lib/helpers.ts"
import { EmptyState } from "../ui/EmptyState.tsx"
import { useToastContext } from "../ui/Toast.tsx"
import { AssetCard } from "./AssetCard.tsx"
import { ResourcePanelToggleSection } from "./ResourcePanelToggleSection.tsx"

export function ResourcePanelAssetListSection({
	roomId,
	assets,
}: {
	roomId: Id<"rooms">
	assets: ClientAsset[]
}) {
	const updateAsset = useMutation(api.assets.update)
	const createAsset = useMutation(api.assets.create)
	const removeAssets = useMutation(api.assets.removeMany)
	const toast = useToastContext()
	const uploadImage = useUploadImage()

	const {
		selection,
		selectedCount,
		setSelection,
		clearSelection,
		selectAll,
		setSelected,
	} = useSelection(assets?.map((asset) => asset._id) ?? [])

	const uploadAssets = async (files: File[]) => {
		const results = await Promise.all(
			files.map(async (file) => {
				const { name } = file // files can get GC'd, so capture the name for output later
				try {
					const fileId = await uploadImage(file)
					await createAsset({
						roomId,
						name: titleifyFileName(file.name),
						type: "image",
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
		<ResourcePanelToggleSection
			name="Assets"
			subtext={selectedCount > 0 && `${selectedCount} selected`}
			actions={[
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
			]}
		>
			{assets.length === 0 ? (
				<EmptyState icon="mingcute:pic-line" message="No assets yet" />
			) : (
				<div className="grid grid-cols-2 gap-2 p-2">
					{assets.map((asset) => (
						<AssetCard
							key={asset._id}
							name={asset.name}
							imageUrl={
								asset?.imageUrl &&
								getOptimizedImageUrl(asset.imageUrl, 200).href
							}
							selected={selection.has(asset._id)}
							imageWrapperClass="aspect-square"
							onChangeSelected={(selected) => {
								setSelected(asset._id, selected)
							}}
							onChangeName={async (name) => {
								await updateAsset({ id: asset._id, patch: { name } })
								setSelection([asset._id])
							}}
						/>
					))}
				</div>
			)}
		</ResourcePanelToggleSection>
	)
}

function useSelection<T>(library: T[]) {
	const [selection, setSelection] = useState<ReadonlySet<T>>(new Set())

	const clearSelection = () => {
		setSelection(new Set())
	}

	const selectAll = () => {
		setSelection(new Set(library))
	}

	const setItemSelected = (item: T, shouldBeSelected: boolean) => {
		setSelection((selection) => {
			const newSelection = new Set(selection)
			if (shouldBeSelected) {
				newSelection.add(item)
			} else {
				newSelection.delete(item)
			}
			return newSelection
		})
	}

	const toggleSelected = (item: T) => {
		setSelection((selection) => {
			const newSelection = new Set(selection)
			if (newSelection.has(item)) {
				newSelection.delete(item)
			} else {
				newSelection.add(item)
			}
			return newSelection
		})
	}

	const isSelected = (item: T) => selection.has(item)

	const selectedCount = selection.size

	return {
		selection,
		selectedCount,
		isSelected,
		clearSelection,
		selectAll,
		setSelected: setItemSelected,
		toggleSelected,
		setSelection: (selection: Iterable<T>) => {
			setSelection(new Set(selection))
		},
	}
}
