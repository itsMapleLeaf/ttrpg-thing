import { Icon } from "@iconify/react/dist/iconify.js"
import { type } from "arktype"
import { useMutation } from "convex/react"
import { type ReactNode, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import type { ClientAsset } from "../../convex/assets.ts"
import { useLocalStorage } from "../hooks/useLocalStorage.ts"
import { useUploadImage } from "../hooks/useUploadImage.ts"
import { getOptimizedImageUrl, titleifyFileName } from "../lib/helpers.ts"
import type { Falsy } from "../lib/types.ts"
import { Button } from "../ui/Button.tsx"
import { EmptyState } from "../ui/EmptyState.tsx"
import { Iconish, type IconishIcon } from "../ui/Iconish.tsx"
import { Menu, MenuButton, MenuItem, MenuPanel } from "../ui/Menu.tsx"
import { useToastContext } from "../ui/Toast.tsx"
import { AssetCard } from "./AssetCard.tsx"

export function ImageAssetSection({
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
		<ToggleSection
			name="Images"
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
				<EmptyState icon="mingcute:pic-line" message="No images yet" />
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
		</ToggleSection>
	)
}

type ToggleSectionAction = {
	name: string
	icon: IconishIcon
} & (
	| {
			callback: () => unknown
	  }
	| {
			options: {
				name: string
				icon: IconishIcon
				callback: () => unknown
			}[]
	  }
)

type ToggleSectionProps = {
	name: string
	subtext?: ReactNode
	children: ReactNode
	actions?: (ToggleSectionAction | Falsy)[]
}

function ToggleSection({
	name,
	subtext,
	children,
	actions,
}: ToggleSectionProps) {
	const [isCollapsed, setIsCollapsed] = useLocalStorage({
		key: `AssetListToggleSection:${name}:collapsed`,
		fallback: false,
		schema: type("boolean"),
	})

	const toggleCollapsed = () => {
		setIsCollapsed((prev) => !prev)
	}

	return (
		<div className="isolate">
			<div className="sticky top-0 z-10 flex items-center">
				<button
					type="button"
					className="flex w-full items-center gap-2 bg-gray-900/75 p-3 text-left backdrop-blur transition-colors hover:bg-gray-800/75"
					onClick={toggleCollapsed}
				>
					<Icon
						icon="mingcute:down-fill"
						data-collapsed={isCollapsed || undefined}
						className="size-4 opacity-70 transition-transform data-collapsed:-rotate-90"
					/>
					<div className="flex-1">
						<span className="text-sm font-medium">{name}</span>
						{subtext && (
							<span className="ml-2 text-xs opacity-50">{subtext}</span>
						)}
					</div>
				</button>

				{actions && actions.length > 0 && (
					<div className="absolute right-0 z-20 flex gap-1 px-1.5 *:size-8">
						{actions.filter(Boolean).map((action) =>
							"callback" in action ? (
								<Button
									key={action.name}
									icon={<Iconish icon={action.icon} className="size-4" />}
									shape="square"
									onClick={action.callback}
								>
									{action.name}
								</Button>
							) : (
								<Menu key={action.name}>
									<MenuButton
										render={
											<Button
												icon={<Iconish icon={action.icon} className="size-4" />}
												shape="square"
											>
												{action.name}
											</Button>
										}
									/>
									<MenuPanel>
										{action.options.map((option) => (
											<MenuItem
												key={option.name}
												icon={<Iconish icon={option.icon} className="size-4" />}
												onClick={option.callback}
											>
												{option.name}
											</MenuItem>
										))}
									</MenuPanel>
								</Menu>
							),
						)}
					</div>
				)}
			</div>
			{!isCollapsed && children}
		</div>
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
