import { Icon } from "@iconify/react/dist/iconify.js"
import { useMutation, useQuery } from "convex/react"
import { useActionState, useEffect, useState, useTransition } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import type { ClientAsset } from "../../convex/assets.ts"
import { useStable } from "../hooks/useStable.ts"
import { useUploadImage } from "../hooks/useUploadImage.ts"
import {
	ContextMenu,
	ContextMenuItem,
	ContextMenuPanel,
	ContextMenuTrigger,
} from "./ContextMenu.tsx"
import { SmartImage } from "./SmartImage.tsx"

export function AssetList({ roomId }: { roomId: Id<"rooms"> }) {
	const [searchTerm, setSearchTerm] = useState("")
	const [showSuccess, setShowSuccess] = useState(false)

	const assets = useStable(useQuery(api.assets.list, { roomId, searchTerm }))

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

	useEffect(() => {
		if (showSuccess) {
			const timer = setTimeout(() => setShowSuccess(false), 3000)
			return () => clearTimeout(timer)
		}
	}, [showSuccess])

	const [selection, setSelection] = useState(new Set<Id<"assets">>())

	return (
		<div className="flex h-full flex-col">
			<div className="flex flex-col gap-3 border-b border-gray-700 p-2">
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
					<form action={uploadAction}>
						<label className="button-clear button-square">
							{!isPending && (
								<Icon icon="mingcute:upload-2-fill" className="button-icon" />
							)}
							<span className="sr-only">
								{isPending ? "Uploading..." : "Upload"}
							</span>
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
				</div>

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
								onContextMenuOpen={() => {
									setSelection(new Set([asset._id]))
								}}
								onContextMenuClose={() => {
									setSelection((current) => {
										const next = new Set(current)
										next.delete(asset._id)
										return next
									})
								}}
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
	onContextMenuOpen,
	onContextMenuClose,
}: {
	asset: ClientAsset
	selected: boolean
	onContextMenuOpen: () => void
	onContextMenuClose: () => void
}) {
	const updateAsset = useMutation(api.assets.update)
	const removeAsset = useMutation(api.assets.remove)
	return (
		<ContextMenu
			onOpenChange={(open) => {
				if (open) {
					onContextMenuOpen()
				} else {
					onContextMenuClose()
				}
			}}
		>
			<ContextMenuTrigger
				className="panel data-[selected=true]:border-primary-400"
				data-selected={selected}
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
