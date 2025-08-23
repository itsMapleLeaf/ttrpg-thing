import { Icon } from "@iconify/react/dist/iconify.js"
import { useMutation, useQuery } from "convex/react"
import { useRef, useState, useTransition } from "react"
import type { SetOptional } from "type-fest"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import type { AssetListOrder, ClientAsset } from "../../convex/assets.ts"
import { useStable } from "../hooks/useStable.ts"
import { useUploadImage } from "../hooks/useUploadImage.ts"
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

export function AssetList({ roomId }: { roomId: Id<"rooms"> }) {
	const [searchTerm, setSearchTerm] = useState("")
	const [sortOption, setSortOption] = useState(sortOptions[0])
	const toast = useToastContext()

	const assets = useStable(
		useQuery(api.assets.list, {
			roomId,
			searchTerm,
			order: sortOption.id,
		}),
	)

	const uploadImage = useUploadImage()
	const createAsset = useMutation(api.assets.create)
	const removeManyAssets = useMutation(api.assets.removeMany)

	const uploadAssets = async (files: File[]) => {
		console.log(files)
		const results = await Promise.all(
			files.map(async (file) => {
				const { name } = file // files can get GC'd, so capture the name for output later
				try {
					const humanName = titleifyFileName(file.name)
					const fileId = await uploadImage(file)
					await createAsset({ name: humanName, fileId, roomId })
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

	const [selection, setSelection] = useState<ReadonlySet<Id<"assets">>>(
		new Set(),
	)

	const clearSelection = () => {
		setSelection(new Set())
	}

	const selectAll = () => {
		setSelection(new Set(assets?.map((it) => it._id)))
	}

	const setSelected = (item: Id<"assets">, shouldBeSelected: boolean) => {
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

	const _toggleSelected = (item: Id<"assets">) => {
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

	const deleteSelected = async () => {
		if (confirm(`Are you sure you want to delete ${selection.size} assets?`)) {
			await removeManyAssets({ ids: [...selection] })
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
						<>
							<FilePicker className="flex-1" onFilesChosen={uploadAssets} />
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

			<div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-gray-900/50 p-3">
				{assets === undefined ? (
					<p className="py-4 text-center text-sm opacity-70">Loading...</p>
				) : assets.length === 0 ? (
					<p className="py-4 text-center text-sm opacity-70">
						{searchTerm ? "No assets found" : "No assets yet"}
					</p>
				) : (
					<div className="pointer-events-children grid grid-cols-2 gap-2">
						{assets.map((asset) => (
							<AssetCard
								key={asset._id}
								asset={asset}
								selected={selection.has(asset._id)}
								onSelectedChange={(selected) =>
									setSelected(asset._id, selected)
								}
							/>
						))}
					</div>
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

function AssetCard({
	asset,
	selected,
	onSelectedChange,
}: {
	asset: ClientAsset
	selected: boolean
	onSelectedChange: (selected: boolean) => void
}) {
	const updateAsset = useMutation(api.assets.update)
	return (
		<div className="panel bg-gray-950/40 outline-2 outline-transparent transition-colors">
			<label className="group relative block aspect-square">
				{asset.url ? (
					<SmartImage
						src={getOptimizedImageUrl(asset.url, 150).href}
						alt={asset.name}
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
						onChange={(event) => onSelectedChange(event.target.checked)}
					/>
				</div>

				<div
					className="pointer-events-none absolute inset-0 bg-primary-400/25 opacity-0 transition-opacity data-visible:opacity-100"
					data-visible={selected || undefined}
				/>
			</label>

			<WithTooltip content={asset.name} positionerProps={{ side: "bottom" }}>
				<button
					type="button"
					className="group flex h-6.5 w-full items-center gap-1 px-2 text-xs/tight font-semibold hover:bg-gray-800"
					onClick={() => {
						const newName = prompt("New name?", asset.name)?.trim()
						if (!newName) return

						updateAsset({ id: asset._id, name: newName })
					}}
				>
					<div className="flex-1 truncate">{asset.name}</div>
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

function getOptimizedImageUrl(url: string, width: number) {
	const imageUrl = new URL("/api/images/optimize", window.origin)
	imageUrl.searchParams.set("url", url)
	imageUrl.searchParams.set("width", String(width))
	return imageUrl
}

const articles = new Set([
	"the",
	"of",
	"and",
	"a",
	"in",
	"to",
	"is",
	"by",
	"with",
])

/**
 * Convert a file name into a human-readable title:
 * - Removes the file extension
 * - Turns all non-word characters (alphanumeric and period, e.g. for "Mr.") into spaces
 * - Converts the file name to Title Case, special-casing articles like "the" and "of"
 */
function titleifyFileName(fileName: string) {
	const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, "")
	const parts = nameWithoutExtension.matchAll(/[a-z0-9.]+/gi)
	return [...parts]
		.map(([part]) => {
			if (articles.has(part.toLowerCase())) {
				return part.toLowerCase()
			}
			return part.slice(0, 1).toUpperCase() + part.slice(1).toLowerCase()
		})
		.join(" ")
}

function counted(
	count: number,
	singluarWord: string,
	pluralWord = `${singluarWord}s`,
) {
	return `${count} ${count === 1 ? singluarWord : pluralWord}`
}
