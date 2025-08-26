import { useConvex, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import type { ClientSurface } from "../../../convex/surfaces.ts"
import { useSelection } from "../../hooks/useSelection.ts"
import { useUploadImage } from "../../hooks/useUploadImage.ts"
import { getOptimizedImageUrl, titleifyFileName } from "../../lib/helpers.ts"
import { Button } from "../../ui/Button.tsx"
import { EmptyState } from "../../ui/EmptyState.tsx"
import { Iconish } from "../../ui/Iconish.tsx"
import { SmartImage } from "../../ui/SmartImage.tsx"
import { useToastContext } from "../../ui/Toast.tsx"
import { ToggleSection } from "./ToggleSection.tsx"

export function SurfaceListSection({
	roomId,
	surfaces,
}: {
	roomId: Id<"rooms">
	surfaces: ClientSurface[]
}) {
	const updateSurface = useMutation(api.surfaces.update)
	const createSurface = useMutation(api.surfaces.create)
	const removeSurfaces = useMutation(api.surfaces.removeMany)
	const convex = useConvex()
	const toast = useToastContext()
	const uploadImage = useUploadImage()

	const {
		selection,
		selectedCount,
		isSelected,
		clearSelection,
		selectAll,
		setSelected,
	} = useSelection(surfaces?.map((surface) => surface._id) ?? [])

	const createSurfacesFromImages = async (files: File[]) => {
		const results = await Promise.all(
			files.map(async (file) => {
				const { name: fileName } = file // files can get GC'd, so capture the name for output later
				try {
					const name = titleifyFileName(file.name)
					const fileId = await uploadImage(file)

					const assetId = await convex.mutation(api.assets.create, {
						name,
						fileId,
						roomId,
					})

					await createSurface({
						name: titleifyFileName(file.name),
						backgroundId: assetId,
						roomId,
					})
					return { success: true } as const
				} catch (error) {
					console.error(error)
					return { success: false, name: fileName } as const
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
			name="Surfaces"
			subtext={selectedCount > 0 && `${selectedCount} selected`}
			actions={[
				selectedCount > 0 && {
					name: "Delete selected",
					icon: "mingcute:delete-2-fill",
					callback: async () => {
						if (
							confirm(
								`Are you sure you want to delete ${selectedCount} surfaces?`,
							)
						) {
							await removeSurfaces({ ids: [...selection] })
							clearSelection()
						}
					},
				},
				selectedCount === 0 && {
					name: "New surface",
					icon: "mingcute:add-fill",
					callback: async () => {
						const name = prompt(
							"Surface name?",
							`New Surface ${surfaces.length + 1}`,
						)
						if (!name) return
						await createSurface({ name, roomId })
					},
				},
				selectedCount === 0 && {
					name: "New surface(s) from background(s)",
					icon: "mingcute:upload-2-fill",
					callback: () => {
						const input = document.createElement("input")
						input.type = "file"
						input.multiple = true
						input.accept = "image/png,image/jpeg,image/webp"
						input.oninput = () => {
							const files = [...(input.files ?? [])]
							if (files.length > 0) {
								createSurfacesFromImages(files)
							}
						}
						input.click()
					},
				},
				selectedCount < surfaces.length && {
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
			]}
		>
			{surfaces.length === 0 ? (
				<EmptyState icon="mingcute:layer-fill" message="No surfaces yet" />
			) : (
				<div className="grid gap-1 p-1">
					{surfaces.map((surface) => (
						<div
							key={surface._id}
							className="group flex items-center gap-2 rounded-md p-1 transition-colors select-none has-checked:bg-primary-700/20"
						>
							<label className="flex flex-1 items-center gap-2">
								<div className="relative flex-center size-10 rounded border border-gray-800 bg-gray-950/50">
									{surface.backgroundUrl ? (
										<SmartImage
											src={
												getOptimizedImageUrl(surface.backgroundUrl, 100).href
											}
											className="size-full object-cover"
										/>
									) : (
										<Iconish
											icon="mingcute:layer-fill"
											className="size-6 opacity-75"
										/>
									)}
									<div className="fade absolute inset-0 flex-center overflow-clip px-2 opacity-0 transition group-hover:fade-visible has-checked:fade-visible">
										<input
											type="checkbox"
											className="size-5 accent-primary-400"
											checked={isSelected(surface._id)}
											onChange={(event) =>
												setSelected(surface._id, event.target.checked)
											}
										/>
									</div>
								</div>
								<p className="line-clamp-2 flex-1">{surface.name}</p>
							</label>

							<Button
								icon="mingcute:pencil-fill"
								shape="square"
								size="sm"
								className="fade overflow-clip group-hover:fade-visible"
								onClick={async () => {
									const name = prompt("New name?", surface.name)
									if (!name) return
									await updateSurface({ id: surface._id, patch: { name } })
								}}
							>
								Edit
							</Button>
						</div>
					))}
				</div>
			)}
		</ToggleSection>
	)
}
