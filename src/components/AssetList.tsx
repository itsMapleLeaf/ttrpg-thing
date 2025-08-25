import { Icon } from "@iconify/react/dist/iconify.js"
import { type } from "arktype"
import { useMutation, useQuery } from "convex/react"
import { isEqual } from "es-toolkit"
import { type ReactNode, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import type { ClientActor } from "../../convex/actors.ts"
import type { AssetListOrder, ClientAsset } from "../../convex/assets.ts"
import type { ClientScene } from "../../convex/scenes.ts"
import { useLocalStorage } from "../hooks/useLocalStorage.ts"
import { useStable } from "../hooks/useStable.ts"
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
import { Loading } from "../ui/Loading.tsx"
import { Menu, MenuButton, MenuItem, MenuPanel } from "../ui/Menu.tsx"
import { ScrollArea } from "../ui/ScrollArea.tsx"
import { useToastContext } from "../ui/Toast.tsx"
import { AssetCard } from "./AssetCard.tsx"

type SelectedItem =
	| { type: "asset"; id: Id<"assets"> }
	| { type: "scene"; id: Id<"scenes"> }
	| { type: "actor"; id: Id<"actors"> }

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

export function AssetList({ roomId }: { roomId: Id<"rooms"> }) {
	const filterState = useFilterState()

	const assets = useStable(
		useQuery(api.assets.list, {
			roomId,
			searchTerm: filterState.searchTerm,
			order: filterState.sortOption.id,
		}),
	)

	const scenes = useStable(
		useQuery(api.scenes.list, {
			roomId,
			searchTerm: filterState.searchTerm,
			order: filterState.sortOption.id,
		}),
	)

	const actors = useStable(
		useQuery(api.actors.list, {
			roomId,
			searchTerm: filterState.searchTerm,
			order: filterState.sortOption.id,
		}),
	)

	return assets === undefined ||
		scenes === undefined ||
		actors === undefined ? (
		<Loading />
	) : (
		<AssetListInternal
			{...filterState}
			roomId={roomId}
			assets={assets}
			scenes={scenes}
			actors={actors}
		/>
	)
}

function AssetListInternal({
	roomId,
	assets,
	scenes,
	actors,
	searchTerm,
	setSearchTerm,
	sortOption,
	setSortOptionId,
}: {
	roomId: Id<"rooms">
	assets: ClientAsset[]
	scenes: ClientScene[]
	actors: ClientActor[]
} & FilterState) {
	const createAsset = useMutation(api.assets.create)
	const updateAsset = useMutation(api.assets.update)
	const removeAssets = useMutation(api.assets.removeMany)
	const createScene = useMutation(api.scenes.create)
	const updateScene = useMutation(api.scenes.update)
	const createActor = useMutation(api.actors.create)
	const updateActor = useMutation(api.actors.update)
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
		const assetIds: Id<"assets">[] = []
		const sceneIds: Id<"scenes">[] = []
		const actorIds: Id<"actors">[] = []

		for (const item of selection) {
			if (item.type === "asset") assetIds.push(item.id)
			else if (item.type === "scene") sceneIds.push(item.id)
			else if (item.type === "actor") actorIds.push(item.id)
		}

		if (confirm(`Are you sure you want to delete ${selection.length} items?`)) {
			if (assetIds.length > 0) await removeAssets({ ids: assetIds })
			// TODO: Add scene and actor deletion when needed
			clearSelection()
		}
	}

	const allSelectableItems: SelectedItem[] = [
		...assets.map((asset) => ({ type: "asset" as const, id: asset._id })),
		...scenes.map((scene) => ({ type: "scene" as const, id: scene._id })),
		...actors.map((actor) => ({ type: "actor" as const, id: actor._id })),
	]

	const {
		selection,
		isSelected,
		setSelection,
		clearSelection,
		selectAll,
		setSelected,
	} = useSelection(allSelectableItems)

	const selectedImageAssets = assets.filter((asset) =>
		isSelected({ type: "asset", id: asset._id }),
	)

	const assetSections: ToggleSectionProps[] = [
		{
			name: "Images",
			subtext:
				selectedImageAssets.length > 0 &&
				`${selectedImageAssets.length} selected`,
			actions: [
				selectedImageAssets.length < assets.length && {
					name: "Select all",
					icon: "mingcute:checks-fill",
					callback: () => {
						for (const asset of assets) {
							setSelected({ type: "asset", id: asset._id }, true)
						}
					},
				},
				selectedImageAssets.length > 0 && {
					name: "Clear selection",
					icon: "mingcute:minus-square-fill",
					callback: () => {
						for (const asset of assets) {
							setSelected({ type: "asset", id: asset._id }, false)
						}
					},
				},
				selectedImageAssets.length > 0 && {
					name: "New from selected...",
					icon: "mingcute:magic-3-fill",
					options: [
						{
							name: `Create ${counted(selectedImageAssets.length, "scene")}`,
							icon: "mingcute:clapperboard-fill",
							callback: async () => {
								for (const imageAsset of selectedImageAssets) {
									await createScene({
										roomId,
										name: imageAsset.name,
										backgroundId: imageAsset._id,
									})
								}
								clearSelection()
							},
						},
						{
							name: `Create ${counted(selectedImageAssets.length, "actor")}`,
							icon: "mingcute:star-fill",
							callback: async () => {
								for (const imageAsset of selectedImageAssets) {
									await createActor({
										roomId,
										name: imageAsset.name,
										assetId: imageAsset._id,
									})
								}
								clearSelection()
							},
						},
					],
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
				assets.length === 0 ? (
					<EmptyState icon="mingcute:pic-line" message="No images yet" />
				) : (
					<div className="grid grid-cols-2 gap-2 p-2">
						{assets.map((asset) => (
							<AssetCard
								key={asset._id}
								name={asset.name}
								imageUrl={
									asset.imageUrl &&
									getOptimizedImageUrl(asset.imageUrl, 200).href
								}
								selected={isSelected({ type: "asset", id: asset._id })}
								imageWrapperClass="aspect-square"
								onChangeSelected={(selected) => {
									setSelected({ type: "asset", id: asset._id }, selected)
								}}
								onChangeName={async (name) => {
									await updateAsset({ id: asset._id, patch: { name } })
									setSelection([{ type: "asset", id: asset._id }])
								}}
							/>
						))}
					</div>
				),
		},

		{
			name: "Scenes",
			actions: [
				{
					name: "Add scene",
					icon: "mingcute:add-fill",
					callback: () => {
						const name = prompt("Scene name?", "New Scene")?.trim()
						if (!name) return
						createScene({
							roomId,
							name,
						})
					},
				},
			],
			children:
				scenes.length === 0 ? (
					<EmptyState
						icon="mingcute:clapperboard-line"
						message="No scenes yet"
					/>
				) : (
					<div className="grid grid-cols-1 gap-2 p-2">
						{scenes.map((asset) => (
							<AssetCard
								key={asset._id}
								name={asset.name}
								imageUrl={
									asset.backgroundUrl &&
									getOptimizedImageUrl(asset.backgroundUrl, 500).href
								}
								selected={isSelected({ type: "scene", id: asset._id })}
								imageWrapperClass="aspect-video"
								onChangeSelected={(selected) => {
									setSelected({ type: "scene", id: asset._id }, selected)
								}}
								onChangeName={async (name) => {
									await updateScene({ id: asset._id, patch: { name } })
								}}
							/>
						))}
					</div>
				),
		},

		{
			name: "Actors",
			actions: [
				{
					name: "Add actor",
					icon: "mingcute:add-fill",
					callback: () => {
						const name = prompt("Actor name?", "New Actor")?.trim()
						if (!name) return
						createActor({
							roomId,
							name,
						})
					},
				},
			],
			children:
				actors.length === 0 ? (
					<EmptyState icon="mingcute:star-line" message="No actors yet" />
				) : (
					<div className="grid grid-cols-2 gap-2 p-2">
						{actors.map((asset) => (
							<AssetCard
								key={asset._id}
								name={asset.name}
								imageUrl={
									asset.imageUrl &&
									getOptimizedImageUrl(asset.imageUrl, 200).href
								}
								selected={isSelected({ type: "actor", id: asset._id })}
								imageWrapperClass="aspect-square"
								onChangeSelected={(selected) => {
									setSelected({ type: "actor", id: asset._id }, selected)
								}}
								onChangeName={async (name) => {
									await updateActor({ id: asset._id, patch: { name } })
								}}
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
					{selection.length === 0 ? (
						selection.length < (assets?.length ?? 0) && (
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
								Delete {counted(selection.length, "asset")}
							</Button>

							{selection.length < (assets?.length ?? 0) && (
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
				{assetSections.map((section) => (
					<ToggleSection {...section} key={section.name} />
				))}
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

function useSelection<T>(library: readonly T[]) {
	const [selection, setSelection] = useState<readonly T[]>([])

	const clearSelection = () => {
		setSelection([])
	}

	const selectAll = () => {
		setSelection(library)
	}

	const setItemSelected = (item: T, shouldBeSelected: boolean) => {
		setSelection((selection) => {
			if (!shouldBeSelected) {
				return selection.filter((it) => !isEqual(it, item))
			}
			return isSelected(item, selection) ? selection : [...selection, item]
		})
	}

	const toggleSelected = (item: T) => {
		setSelection((selection) => {
			return isSelected(item, selection)
				? selection.filter((it) => !isEqual(it, item))
				: [...selection, item]
		})
	}

	const isSelected = (item: T, currentSelection = selection) =>
		currentSelection.some((it) => isEqual(it, item))

	return {
		selection,
		isSelected,
		clearSelection,
		selectAll,
		setSelected: setItemSelected,
		toggleSelected,
		setSelection: (selection: Iterable<T>) => {
			setSelection([...selection])
		},
	}
}
