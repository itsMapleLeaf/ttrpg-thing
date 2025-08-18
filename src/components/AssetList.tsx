import { Icon } from "@iconify/react/dist/iconify.js"
import { useMutation, useQuery } from "convex/react"
import { without } from "es-toolkit"
import { useActionState, useEffect, useState, useTransition } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import type { AssetListOrder, ClientAsset } from "../../convex/assets.ts"
import { useStable } from "../hooks/useStable.ts"
import { useUploadImage } from "../hooks/useUploadImage.ts"
import type { NonEmptyArray } from "../types.ts"
import {
	ContextMenu,
	ContextMenuItem,
	ContextMenuPanel,
	ContextMenuTrigger,
} from "./ContextMenu.tsx"
import { SmartImage } from "./SmartImage.tsx"

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

	const assets = useStable(
		useQuery(api.assets.list, {
			roomId,
			searchTerm,
			order: sortOption.id,
		}),
	)

	const uploadImage = useUploadImage()
	const createAsset = useMutation(api.assets.create)
	const [uploadState, uploadAction, isPending] = useActionState(
		async (_: unknown, formData: FormData) => {
			const file = formData.get("file") as File
			if (!file) return { error: "No file selected" }

			try {
				const fileId = await uploadImage(file)
				await createAsset({
					name: file.name,
					fileId,
					roomId,
				})
				setShowSuccess(true)
				return { success: true }
			} catch (error) {
				return {
					error: error instanceof Error ? error.message : "Upload failed",
				}
			}
		},
		null,
	)

	const [showSuccess, setShowSuccess] = useState(false)
	useEffect(() => {
		if (showSuccess) {
			const timer = setTimeout(() => setShowSuccess(false), 3000)
			return () => clearTimeout(timer)
		}
	}, [showSuccess])

	const [selection, setSelection] = useState<ReadonlySet<Id<"assets">>>(
		new Set(),
	)

	useEffect(() => {
		const controller = new AbortController()

		window.addEventListener(
			"pointerdown",
			(event) => {
				const selectedAssetId = (() => {
					for (const element of event.composedPath()) {
						if (element instanceof HTMLElement) {
							const { assetId } = element.dataset
							if (assetId) return assetId as Id<"assets">
						}
					}
				})()

				if (selectedAssetId && event.shiftKey) {
					// this expands the whole selection such that it selects every item from the newly least selected index to the greatest
					// this is technically different from how most file managers work,
					// but it doesn't need to be perfect, and replicating their anchor-based behavior would be annoying
					setSelection((selection) => {
						const assetIds = assets?.map((it) => it._id)
						const assetIdIndexes = new Map(
							assetIds?.map((id, index) => [id, index]),
						)

						const selectionIndexes = [...selection, selectedAssetId].flatMap(
							(it) => assetIdIndexes.get(it) ?? [],
						)

						const lowestIndex = Math.min(...selectionIndexes)
						const highestIndex = Math.max(...selectionIndexes)

						return new Set(assetIds?.slice(lowestIndex, highestIndex + 1))
					})
				} else if (selectedAssetId && event.ctrlKey) {
					setSelection((selection) =>
						selection.has(selectedAssetId)
							? new Set(without([...selection], selectedAssetId))
							: new Set([...selection, selectedAssetId]),
					)
				} else if (selectedAssetId) {
					setSelection(new Set([selectedAssetId as Id<"assets">]))
				} else {
					setSelection(new Set())
				}
			},
			{ signal: controller.signal },
		)

		return () => controller.abort()
	})

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

					<button
						type="button"
						className="button-clear button-square"
						onClick={() => {
							setSortOption((order) => {
								const currentIndex = sortOptions.findIndex(
									(option) => option.id === order.id,
								)
								const nextIndex = (currentIndex + 1) % sortOptions.length
								return sortOptions[nextIndex] as SortOption
							})
						}}
					>
						<Icon icon={sortOption.icon} />
						<span className="sr-only">
							Toggle sorting (current: {sortOption.name})
						</span>
					</button>
				</div>

				<form action={uploadAction}>
					<label className="button-solid">
						<Icon icon="mingcute:upload-2-fill" className="button-icon" />
						{isPending ? "Uploading..." : "Upload"}

						<input
							type="file"
							name="file"
							accept="image/*"
							className="hidden"
							disabled={isPending}
							onChange={(event) => {
								if (event.target.files?.[0]) {
									event.target.form?.requestSubmit()
								}
							}}
						/>
					</label>
				</form>

				{uploadState?.error && (
					<div className="alert-sm alert alert-error">
						<Icon icon="mingcute:close-circle-fill" />
						{uploadState.error}
					</div>
				)}

				{showSuccess && (
					<div className="alert-sm alert alert-success">
						<Icon icon="mingcute:check-circle-fill" />
						Asset uploaded successfully!
					</div>
				)}
			</div>

			<div
				className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-gray-900/50 p-3"
				onPointerDown={(event) => {
					if (event.target === event.currentTarget) {
						setSelection(new Set())
					}
				}}
			>
				{assets === undefined ? (
					<p className="py-4 text-center text-sm opacity-70">Loading...</p>
				) : assets.length === 0 ? (
					<p className="py-4 text-center text-sm opacity-70">
						{searchTerm ? "No assets found" : "No assets yet"}
					</p>
				) : (
					<div className="pointer-events-children grid grid-cols-2 gap-2">
						{assets.map((asset) => (
							<AssetItem
								key={asset._id}
								asset={asset}
								selected={selection.has(asset._id)}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

function AssetItem({
	asset,
	selected,
}: {
	asset: ClientAsset
	selected: boolean
}) {
	const updateAsset = useMutation(api.assets.update)
	const removeAsset = useMutation(api.assets.remove)
	return (
		<ContextMenu>
			<ContextMenuTrigger
				className="panel data-[selected=true]:border-primary-400"
				data-selected={selected}
				data-asset-id={asset._id}
			>
				<div className="aspect-square bg-gray-950/40">
					{asset.url ? (
						<SmartImage
							src={getResizedImageUrl(asset.url, 150).href}
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
				</div>

				<ContextMenuPanel>
					<ContextMenuItem
						icon="mingcute:delete-2-fill"
						onClick={() => removeAsset({ id: asset._id })}
					>
						Delete
					</ContextMenuItem>
				</ContextMenuPanel>

				<AssetItemNameInput
					value={asset.name}
					onChange={(name) => updateAsset({ id: asset._id, name })}
				/>
			</ContextMenuTrigger>
		</ContextMenu>
	)
}

function AssetItemNameInput({
	value,
	onChange,
}: {
	value: string
	onChange: (value: string) => Promise<unknown>
}) {
	const [editing, setEditing] = useState(false)
	const [pending, startTransition] = useTransition()

	return (
		<input
			className="w-full min-w-0 rounded-b-md p-1.5 text-center text-sm leading-tight font-semibold focus:-outline-offset-1"
			{...(editing || pending
				? { defaultValue: value }
				: { value, readOnly: true })}
			onFocus={(event) => {
				event.target.select()
				setEditing(true)
			}}
			onBlur={(event) => {
				const { value } = event.target
				startTransition(async () => {
					await onChange(value)
				})
				setEditing(false)
			}}
			onKeyDown={(event) => {
				if (event.key === "Enter") {
					const { value } = event.currentTarget
					startTransition(async () => {
						await onChange(value)
					})
				}
			}}
		/>
	)
}

function getResizedImageUrl(url: string, width: number) {
	const imageUrl = new URL("/api/resize-image", window.origin)
	imageUrl.searchParams.set("url", url)
	imageUrl.searchParams.set("width", String(width))
	return imageUrl
}
