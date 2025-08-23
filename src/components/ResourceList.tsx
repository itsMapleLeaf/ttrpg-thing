import { Icon } from "@iconify/react/dist/iconify.js"
import { createContext, use, useRef, useState, useTransition } from "react"
import type { SetOptional } from "type-fest"
import type { Id } from "../../convex/_generated/dataModel"
import type { AssetListOrder } from "../../convex/assets.ts"
import { useUploadImage } from "../hooks/useUploadImage.ts"
import { counted } from "../lib/helpers.ts"
import type { NonEmptyArray } from "../types.ts"
import { Button, type ButtonProps } from "../ui/Button.tsx"
import { SmartImage } from "../ui/SmartImage.tsx"
import { useToastContext } from "../ui/Toast.tsx"
import { WithTooltip } from "../ui/Tooltip.tsx"

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

export type ResourceListFilter = ReturnType<typeof useResourceListFilter>
export function useResourceListFilter() {
	const [searchTerm, setSearchTerm] = useState("")
	const [sortOption, setSortOption] = useState(sortOptions[0])
	return {
		searchTerm,
		onSearchTermChange: setSearchTerm,
		sortOption,
		onSortOptionChange: setSortOption,
	}
}

const ResourceListFilterContext = createContext<ResourceListFilter>({
	searchTerm: "",
	onSearchTermChange: () => {},
	sortOption: sortOptions[0],
	onSortOptionChange: () => {},
})

export function ResourceListFilterProvider({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<ResourceListFilterContext.Provider value={useResourceListFilter()}>
			{children}
		</ResourceListFilterContext.Provider>
	)
}

export function useResourceListFilterContext() {
	return use(ResourceListFilterContext)
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

export function ResourceList<ResourceType, ResourceIdType>({
	resources,
	getResourceId,
	createResource,
	removeManyResources,
	renderList,
}: {
	resources: ResourceType[]
	getResourceId: (resource: ResourceType) => ResourceIdType
	createResource: (args: {
		fileName: string
		fileId: Id<"_storage">
	}) => unknown
	removeManyResources: (ids: ResourceIdType[]) => unknown
	renderList: (
		items: {
			resource: ResourceType
			selected: boolean
			onChangeSelected: (selected: boolean) => void
		}[],
	) => React.ReactNode
}) {
	const toast = useToastContext()
	const uploadImage = useUploadImage()

	const { searchTerm, onSearchTermChange, sortOption, onSortOptionChange } =
		useResourceListFilterContext()

	const { selection, clearSelection, selectAll, setSelected } = useSelection(
		resources.map(getResourceId),
	)

	const uploadAssets = async (files: File[]) => {
		const results = await Promise.all(
			files.map(async (file) => {
				const { name } = file // files can get GC'd, so capture the name for output later
				try {
					const fileId = await uploadImage(file)
					await createResource({
						fileName: file.name,
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
			await removeManyResources([...selection])
			clearSelection()
		}
	}

	return (
		<div className="flex h-full flex-col">
			<div className="flex flex-col gap-2 border-b border-gray-700 p-2">
				<div className="flex gap-2">
					<div className="relative flex flex-1 items-center">
						<input
							type="text"
							placeholder="Search assets..."
							value={searchTerm}
							onChange={(event) => onSearchTermChange(event.target.value)}
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
							onSortOptionChange((order) => {
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
						<>
							<FilePicker className="flex-1" onFilesChosen={uploadAssets} />
							{selection.size < (resources?.length ?? 0) && (
								<Button
									icon="mingcute:checks-fill"
									appearance="clear"
									shape="square"
									onClick={selectAll}
								>
									Select all
								</Button>
							)}
						</>
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

							{selection.size < (resources?.length ?? 0) && (
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

			<div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-gray-900/50 p-3">
				{resources === undefined ? (
					<p className="py-4 text-center text-sm opacity-70">Loading...</p>
				) : resources.length === 0 ? (
					<p className="py-4 text-center text-sm opacity-70">
						{searchTerm ? "No assets found" : "No assets yet"}
					</p>
				) : (
					renderList(
						resources.map((resource) => ({
							resource,
							selected: selection.has(getResourceId(resource)),
							onChangeSelected: (selected) =>
								setSelected(getResourceId(resource), selected),
						})),
					)
				)}
			</div>
		</div>
	)
}

interface FilePickerProps extends SetOptional<ButtonProps, "icon"> {
	onFilesChosen: (files: File[]) => unknown
}

function FilePicker({
	icon = "mingcute:upload-2-fill",
	onFilesChosen,
	...props
}: FilePickerProps) {
	const inputRef = useRef<HTMLInputElement>(null)
	const [pending, startTransition] = useTransition()
	const toast = useToastContext()

	return (
		<>
			<Button
				icon={icon}
				appearance="solid"
				pending={pending}
				{...props}
				onClick={() => inputRef.current?.click()}
			>
				Upload
			</Button>

			<input
				hidden
				type="file"
				multiple
				accept="image/png,image/jpeg,image/webp"
				ref={inputRef}
				onChange={(event) => {
					if (pending) return

					// capture the files so it doesn't get cleared when we clear the input
					const files = [...(event.target.files ?? [])]
					if (files.length === 0) return

					// clear the input so we can select files again
					event.target.value = ""

					startTransition(async () => {
						try {
							await onFilesChosen(files)
						} catch (error) {
							toast.error(String(error))
						}
					})
				}}
			/>
		</>
	)
}

export function ResourceCard({
	name,
	imageUrl,
	selected,
	onChangeSelected,
	onChangeName,
}: {
	name: string
	imageUrl: string | null | undefined
	selected: boolean
	onChangeSelected: (selected: boolean) => void
	onChangeName: (name: string) => unknown
}) {
	return (
		<div className="panel bg-gray-950/40 outline-2 outline-transparent transition-colors">
			<label className="group relative block aspect-square">
				{imageUrl ? (
					<SmartImage
						src={imageUrl}
						alt=""
						className="size-full object-cover object-top"
					/>
				) : (
					<div className="flex-center h-full">
						<Icon
							icon="mingcute:file-unknown-line"
							className="size-12 opacity-50"
						/>
					</div>
				)}

				<div
					className="absolute right-0 bottom-0 block p-2 opacity-0 transition-opacity group-hover:opacity-100 data-selected:opacity-100"
					data-selected={selected || undefined}
				>
					<div className="sr-only">Selected</div>
					<input
						type="checkbox"
						className="block size-5 accent-primary-400"
						checked={selected}
						onChange={(event) => onChangeSelected(event.target.checked)}
					/>
				</div>

				<div
					className="pointer-events-none absolute inset-0 bg-primary-400/25 opacity-0 transition-opacity data-visible:opacity-100"
					data-visible={selected || undefined}
				/>
			</label>

			<WithTooltip content={name} positionerProps={{ side: "bottom" }}>
				<button
					type="button"
					className="group flex h-6.5 w-full items-center justify-center gap-1 px-2 text-xs/tight font-semibold hover:bg-gray-800"
					onClick={() => {
						const newName = prompt("New name?", name)?.trim()
						if (!newName) return

						onChangeName(newName)
					}}
				>
					<div className="truncate">{name}</div>
					<div className="flex h-4 w-0 justify-end transition-[width] group-hover:w-4">
						<Icon
							icon="mingcute:pencil-fill"
							className="size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
						/>
					</div>
				</button>
			</WithTooltip>
		</div>
	)
}
