import { Icon } from "@iconify/react/dist/iconify.js"
import { type } from "arktype"
import { useMutation } from "convex/react"
import { type ReactNode, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import type { AssetListOrder, ClientAsset } from "../../convex/assets.ts"
import { useLocalStorage } from "../hooks/useLocalStorage.ts"
import { useUploadImage } from "../hooks/useUploadImage.ts"
import {
	counted,
	getOptimizedImageUrl,
	titleifyFileName,
} from "../lib/helpers.ts"
import type { Falsy } from "../lib/types.ts"
import type { NonEmptyArray } from "../types.ts"
import { Button } from "../ui/Button.tsx"
import { EmptyState } from "../ui/EmptyState.tsx"
import { Iconish, type IconishIcon } from "../ui/Iconish.tsx"
import { Menu, MenuButton, MenuItem, MenuPanel } from "../ui/Menu.tsx"
import { ScrollArea } from "../ui/ScrollArea.tsx"
import { useToastContext } from "../ui/Toast.tsx"
import { AssetCard } from "./AssetCard.tsx"

type SortOption = {
	id: AssetListOrder
	name: string
	icon: string
}

const sortOptions: NonEmptyArray<SortOption> = [
	{
		id: "alphabetical",
		name: "Alphabetical",
		icon: "mingcute:az-sort-ascending-letters-fill",
	},
	{
		id: "newestFirst",
		name: "Newest first",
		icon: "mingcute:time-fill",
	},
]

export type { FilterState as AssetListFilterState }
type FilterState = ReturnType<typeof useFilterState>

export { useFilterState as useAssetListFilterState }
function useFilterState() {
	const [searchTerm, setSearchTerm] = useState("")

	const [sortOptionId, setSortOptionId] = useLocalStorage({
		key: "AssetList:sortOptionId",
		fallback: sortOptions[0].id,
		schema: type.enumerated("alphabetical", "newestFirst"),
	})

	const sortOption =
		sortOptions.find((it) => it.id === sortOptionId) ?? sortOptions[0]

	return {
		searchTerm,
		setSearchTerm,
		sortOption,
		setSortOptionId,
	}
}

export function AssetList({
	roomId,
	assets,
	searchTerm,
	setSearchTerm,
	sortOption,
	setSortOptionId,
}: {
	roomId: Id<"rooms">
	assets: ClientAsset[]
} & FilterState) {
	const createAsset = useMutation(api.assets.create)
	const updateAsset = useMutation(api.assets.update)
	const removeAssets = useMutation(api.assets.removeMany)
	const toast = useToastContext()
	const uploadImage = useUploadImage()

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

	const deleteSelected = async () => {
		if (confirm(`Are you sure you want to delete ${selection.size} assets?`)) {
			await removeAssets({ ids: [...selection] })
			clearSelection()
		}
	}

	const { selection, setSelection, clearSelection, selectAll, setSelected } =
		useSelection(assets?.map((asset) => asset._id) ?? [])

	const imageAssets = assets?.filter((asset) => asset.type === "image") || []

	const selectedImageAssets = imageAssets.filter((asset) =>
		selection.has(asset._id),
	)

	return (
		<div className="flex h-full w-full flex-col">
			<div className="flex flex-col gap-2 border-b border-gray-700 p-2">
				<div className="flex gap-2">
					<div className="relative flex flex-1 items-center">
						<input
							type="text"
							placeholder="Search..."
							value={searchTerm}
							onChange={(event) => setSearchTerm(event.target.value)}
							className="input pl-8"
						/>
						<Icon
							icon="mingcute:search-line"
							className="pointer-events-none absolute left-3 size-4 opacity-50"
						/>
					</div>

					<Button
						icon={sortOption.icon}
						shape="square"
						onClick={() => {
							setSortOptionId((orderId) => {
								const currentIndex = sortOptions.findIndex(
									(it) => it.id === orderId,
								)
								const nextIndex = (currentIndex + 1) % sortOptions.length
								return (sortOptions[nextIndex] ?? sortOptions[0]).id
							})
						}}
					>
						Toggle sorting{"\n"}(current: {sortOption.name})
					</Button>
				</div>

				<div className="flex gap-2">
					{selection.size === 0 ? (
						selection.size < (assets?.length ?? 0) && (
							<Button
								icon="mingcute:checks-fill"
								appearance="clear"
								shape="square"
								onClick={selectAll}
							>
								Select all
							</Button>
						)
					) : (
						<>
							<Button
								icon="mingcute:delete-2-fill"
								appearance="clear"
								className="flex-1 button-danger"
								onClick={deleteSelected}
							>
								Delete {counted(selection.size, "asset")}
							</Button>

							{selection.size < (assets?.length ?? 0) && (
								<Button
									icon="mingcute:checks-fill"
									appearance="clear"
									shape="square"
									onClick={selectAll}
								>
									Select all
								</Button>
							)}

							<Button
								icon="mingcute:minus-square-fill"
								appearance="clear"
								shape="square"
								onClick={clearSelection}
							>
								Clear selection
							</Button>
						</>
					)}
				</div>
			</div>

			<ScrollArea className="min-h-0 flex-1 bg-gray-900/50">
				<ToggleSection
					name="Images"
					subtext={
						selectedImageAssets.length > 0 &&
						`${selectedImageAssets.length} selected`
					}
					actions={[
						selectedImageAssets.length < imageAssets.length && {
							name: "Select all",
							icon: "mingcute:checks-fill",
							callback: () => {
								for (const asset of imageAssets) {
									setSelected(asset._id, true)
								}
							},
						},
						selectedImageAssets.length > 0 && {
							name: "Clear selection",
							icon: "mingcute:minus-square-fill",
							callback: () => {
								for (const asset of imageAssets) {
									setSelected(asset._id, false)
								}
							},
						},
						selectedImageAssets.length === 0 && {
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
					{imageAssets.length === 0 ? (
						<EmptyState icon="mingcute:pic-line" message="No images yet" />
					) : (
						<div className="grid grid-cols-2 gap-2 p-2">
							{imageAssets.map((asset) => (
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
			</ScrollArea>
		</div>
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

	return {
		selection,
		clearSelection,
		selectAll,
		setSelected: setItemSelected,
		toggleSelected,
		setSelection: (selection: Iterable<T>) => {
			setSelection(new Set(selection))
		},
	}
}
