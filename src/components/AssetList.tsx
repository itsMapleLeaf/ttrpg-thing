import { Icon } from "@iconify/react/dist/iconify.js"
import {
	useMutation as useConvexMutation,
	useQuery as useConvexQuery,
} from "convex/react"
import { useActionState, useEffect, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import type { ClientAsset } from "../../convex/assets.ts"
import { useStable } from "../hooks/useStable.ts"
import { useUploadImage } from "../hooks/useUploadImage.ts"

export function AssetList({ roomId }: { roomId: Id<"rooms"> }) {
	const [searchTerm, setSearchTerm] = useState("")
	const [showSuccess, setShowSuccess] = useState(false)

	// this is a regular useQuery call to keep the whole page from suspending on type
	const assets = useStable(
		useConvexQuery(api.assets.list, {
			roomId,
			searchTerm,
		}),
	)

	const uploadImage = useUploadImage()
	const createAsset = useConvexMutation(api.assets.create)

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

	return (
		<div className="flex h-full flex-col">
			<div className="flex flex-col gap-3 border-b border-base-100 p-2">
				<div className="flex gap-2">
					<div className="relative flex-1">
						<input
							type="text"
							placeholder="Search assets..."
							value={searchTerm}
							onChange={(event) => setSearchTerm(event.target.value)}
							className="input input-sm min-w-0 pl-8"
						/>
						<Icon
							icon="mingcute:search-line"
							className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50"
						/>
					</div>
					<form action={uploadAction}>
						<label
							className={`btn btn-sm btn-primary ${isPending ? "loading" : ""}`}
						>
							{!isPending && (
								<Icon icon="mingcute:upload-2-fill" className="btn-icon" />
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

			<div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
				{assets === undefined ? (
					<p className="py-4 text-center text-sm opacity-70">Loading...</p>
				) : assets.length === 0 ? (
					<p className="py-4 text-center text-sm opacity-70">
						{searchTerm ? "No assets found" : "No assets yet"}
					</p>
				) : (
					assets.map((asset) => <AssetItem key={asset._id} asset={asset} />)
				)}
			</div>
		</div>
	)
}

function AssetItem({ asset }: { asset: ClientAsset }) {
	const [imageError, setImageError] = useState(false)
	const [copied, setCopied] = useState(false)

	const isImage = asset.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
	const showImage = isImage && asset.url && !imageError

	const handleCopyUrl = async () => {
		if (asset.url) {
			await navigator.clipboard.writeText(asset.url)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		}
	}

	return (
		<div className="group flex items-center gap-2 rounded-lg p-2 hover:bg-base-100">
			<div className="flex-shrink-0">
				{showImage && asset.url ? (
					<img
						src={asset.url}
						alt={asset.name}
						className="size-8 rounded object-cover"
						onError={() => setImageError(true)}
					/>
				) : (
					<div className="flex size-8 items-center justify-center rounded bg-base-300">
						<Icon icon="mingcute:file-fill" className="size-4 opacity-70" />
					</div>
				)}
			</div>
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-medium" title={asset.name}>
					{asset.name}
				</p>
			</div>
			<button
				type="button"
				className={`btn opacity-0 btn-ghost btn-xs group-hover:opacity-100 ${copied ? "btn-success" : ""}`}
				title={copied ? "Copied!" : "Copy URL"}
				onClick={handleCopyUrl}
				disabled={!asset.url}
			>
				<Icon
					icon={copied ? "mingcute:check-fill" : "mingcute:copy-2-fill"}
					className="btn-icon"
				/>
			</button>
		</div>
	)
}
