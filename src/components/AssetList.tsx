import { Icon } from "@iconify/react/dist/iconify.js"
import { type } from "arktype"
import { useMutation, useQuery } from "convex/react"
import { type ReactNode, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import type { AssetListOrder, ClientAsset } from "../../convex/assets.ts"
import { useLocalStorage } from "../hooks/useLocalStorage.ts"
import { useStable } from "../hooks/useStable.ts"
import { useUploadImage } from "../hooks/useUploadImage.ts"
import { counted, getOptimizedImageUrl } from "../lib/helpers.ts"
import type { Falsy } from "../lib/types.ts"
import type { NonEmptyArray } from "../types.ts"
import { Button } from "../ui/Button.tsx"
import { EmptyState } from "../ui/EmptyState.tsx"
import { Iconish, type IconishIcon } from "../ui/Iconish.tsx"
import { Loading } from "../ui/Loading.tsx"
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

type FilterState = ReturnType<typeof useFilterState>
function useFilterState() {
	const [searchTerm, setSearchTerm] = useState("")
	const [sortOption, setSortOption] = useState(sortOptions[0])
	return {
		searchTerm,
		setSearchTerm,
		sortOption,
		setSortOption,
	}
}

export function AssetList({ roomId }: { roomId: Id<"rooms"> }) {
	const filterState = useFilterState()

	const assets = useStable(
		useQuery(api.assets.list, {
			roomId,
			searchTerm: filterState.searchTerm,
			order: filterState.sortOption.id,
		}),
	)

	return assets === undefined ? (
		<Loading />
	) : (
		<AssetListInternal {...filterState} roomId={roomId} assets={assets} />
	)
}

function AssetListInternal({
	roomId,
	assets,
	searchTerm,
	setSearchTerm,
	sortOption,
	setSortOption,
}: {
	roomId: Id<"rooms">
	assets: ClientAsset[]
} & FilterState) {
	const createAsset = useMutation(api.assets.create)
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
						name: file.name,
						type: "image",
						image: { fileId },
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

	const { selection, clearSelection, selectAll, setSelected } = useSelection(
		assets?.map((asset) => asset._id) ?? [],
	)

	const imageAssets = assets?.filter((asset) => asset.type === "image") || []
	const sceneAssets = assets?.filter((asset) => asset.type === "scene") || []
	const actorAssets = assets?.filter((asset) => asset.type === "actor") || []

	const selectedImageAssets = imageAssets.filter((asset) =>
		selection.has(asset._id),
	)
	const selectedSceneAssets = sceneAssets.filter((asset) =>
		selection.has(asset._id),
	)
	const selectedActorAssets = actorAssets.filter((asset) =>
		selection.has(asset._id),
	)

	const assetSections: ToggleSectionProps[] = [
		{
			name: "Images",
			subtext:
				selectedImageAssets.length > 0 &&
				`${selectedImageAssets.length} selected`,
			actions: [
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
					name: "Deselect all",
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
			],
			children:
				imageAssets.length === 0 ? (
					<EmptyState icon="mingcute:pic-line" message="No images yet" />
				) : (
					<div className="grid grid-cols-2 gap-2 p-2">
						{imageAssets.map((asset) => (
							<AssetCard
								key={asset._id}
								name={asset.name}
								imageUrl={
									asset.image?.imageUrl &&
									getOptimizedImageUrl(asset.image.imageUrl, 200).href
								}
								selected={selection.has(asset._id)}
								imageWrapperClass="aspect-square"
								onChangeSelected={(selected) => {
									setSelected(asset._id, selected)
								}}
								onChangeName={() => {}}
							/>
						))}
					</div>
				),
		},

		{
			name: "Scenes",
			subtext:
				selectedSceneAssets.length > 0 &&
				`${selectedSceneAssets.length} selected`,
			actions: [
				selectedSceneAssets.length < sceneAssets.length && {
					name: "Select all",
					icon: "mingcute:checks-fill",
					callback: () => {
						for (const asset of sceneAssets) {
							setSelected(asset._id, true)
						}
					},
				},
				selectedSceneAssets.length > 0 && {
					name: "Deselect all",
					icon: "mingcute:minus-square-fill",
					callback: () => {
						for (const asset of sceneAssets) {
							setSelected(asset._id, false)
						}
					},
				},
				selectedSceneAssets.length === 0 && {
					name: "Add scene",
					icon: "mingcute:plus-fill",
					callback: () => {
						const name = prompt("Scene name?", "New Scene")?.trim()
						if (!name) return
						createAsset({
							roomId,
							name,
							type: "scene",
						})
					},
				},
			],
			children:
				sceneAssets.length === 0 ? (
					<EmptyState
						icon="mingcute:clapperboard-line"
						message="No scenes yet"
					/>
				) : (
					<div className="grid grid-cols-1 gap-2 p-2">
						{sceneAssets.map((asset) => (
							<AssetCard
								key={asset._id}
								name={asset.name}
								imageUrl={
									asset.scene?.backgroundUrl &&
									getOptimizedImageUrl(asset.scene.backgroundUrl, 500).href
								}
								selected={selection.has(asset._id)}
								imageWrapperClass="aspect-video"
								onChangeSelected={(selected) => {
									setSelected(asset._id, selected)
								}}
								onChangeName={() => {}}
							/>
						))}
					</div>
				),
		},

		{
			name: "Actors",
			subtext:
				selectedActorAssets.length > 0 &&
				`${selectedActorAssets.length} selected`,
			actions: [
				selectedActorAssets.length < actorAssets.length && {
					name: "Select all",
					icon: "mingcute:checks-fill",
					callback: () => {
						for (const asset of actorAssets) {
							setSelected(asset._id, true)
						}
					},
				},
				selectedActorAssets.length > 0 && {
					name: "Deselect all",
					icon: "mingcute:minus-square-fill",
					callback: () => {
						for (const asset of actorAssets) {
							setSelected(asset._id, false)
						}
					},
				},
				selectedActorAssets.length === 0 && {
					name: "Add actor",
					icon: "mingcute:plus-fill",
					callback: () => {
						const name = prompt("Actor name?", "New Actor")?.trim()
						if (!name) return
						createAsset({
							roomId,
							name,
							type: "actor",
						})
					},
				},
			],
			children:
				actorAssets.length === 0 ? (
					<EmptyState icon="mingcute:star-line" message="No actors yet" />
				) : (
					<div className="grid grid-cols-2 gap-2 p-2">
						{actorAssets.map((asset) => (
							<AssetCard
								key={asset._id}
								name={asset.name}
								imageUrl={
									asset.actor?.imageUrl &&
									getOptimizedImageUrl(asset.actor.imageUrl, 200).href
								}
								selected={selection.has(asset._id)}
								imageWrapperClass="aspect-square"
								onChangeSelected={(selected) => {
									setSelected(asset._id, selected)
								}}
								onChangeName={() => {}}
							/>
						))}
					</div>
				),
		},
	]

	return (
		<div className="flex h-full w-full flex-col">
			<div className="flex flex-col gap-2 border-b border-gray-700 p-2">
				<div className="flex gap-2">
					<div className="relative flex flex-1 items-center">
						<input
							type="text"
							placeholder="Search assets..."
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
							setSortOption((order) => {
								const currentIndex = sortOptions.indexOf(order)
								const nextIndex = (currentIndex + 1) % sortOptions.length
								return sortOptions[nextIndex] as SortOption
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
								Deselect all
							</Button>
						</>
					)}
				</div>
			</div>

			<div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-gray-900/50">
				{assetSections.map((section) => (
					<ToggleSection {...section} key={section.name} />
				))}
			</div>
		</div>
	)
}

type ToggleSectionAction = {
	name: string
	icon: IconishIcon
	callback: () => void
}

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
						{actions.filter(Boolean).map((action) => (
							<Button
								key={action.name}
								icon={<Iconish icon={action.icon} className="size-4" />}
								shape="square"
								onClick={action.callback}
							>
								{action.name}
							</Button>
						))}
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
	}
}
