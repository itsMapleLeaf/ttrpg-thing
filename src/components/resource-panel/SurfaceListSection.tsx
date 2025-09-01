import { useConvex, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import type { ClientSurface } from "../../../convex/surfaces.ts"
import { useSelection } from "../../hooks/useSelection.ts"
import { useUploadImage } from "../../hooks/useUploadImage.ts"
import { getOptimizedImageUrl, titleifyFileName } from "../../lib/helpers.ts"
import { Button } from "../../ui/Button.tsx"
import { EmptyState } from "../../ui/EmptyState.tsx"
import { Icon } from "../../ui/Icon.tsx"
import { Menu, MenuButton, MenuItem, MenuPanel } from "../../ui/Menu.tsx"
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
	const createSurface = useMutation(api.surfaces.create)
	const removeSurfaces = useMutation(api.surfaces.removeMany)
	const convex = useConvex()
	const toast = useToastContext()
	const uploadImage = useUploadImage()

	const selection = useSelection(surfaces?.map((surface) => surface._id) ?? [])

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
			subtext={selection.count > 0 && `${selection.count} selected`}
			actions={[
				selection.count > 0 && {
					name: "Delete selected",
					icon: "mingcute:delete-2-fill",
					callback: async () => {
						if (
							confirm(
								`Are you sure you want to delete ${selection.count} surfaces?`,
							)
						) {
							await removeSurfaces({ ids: [...selection.items] })
							selection.clear()
						}
					},
				},
				selection.count === 0 && {
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
				selection.count === 0 && {
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
				selection.count < surfaces.length && {
					name: "Select all",
					icon: "mingcute:checks-fill",
					callback: () => {
						selection.selectAll()
					},
				},
				selection.count > 0 && {
					name: "Clear selection",
					icon: "mingcute:minus-square-fill",
					callback: () => {
						selection.clear()
					},
				},
			]}
		>
			{surfaces.length === 0 ? (
				<EmptyState icon="mingcute:table-2-fill" message="No surfaces yet" />
			) : (
				<div className="grid gap-1 p-1">
					{surfaces.map((surface) => (
						<SurfaceCard
							key={surface._id}
							surface={surface}
							selected={selection.has(surface._id)}
							onChangeSelected={(selected) =>
								selection.setItemSelected(surface._id, selected)
							}
						/>
					))}
				</div>
			)}
		</ToggleSection>
	)
}

function SurfaceCard({
	surface,
	selected,
	onChangeSelected,
}: {
	surface: ClientSurface
	selected: boolean
	onChangeSelected: (selected: boolean) => void
}) {
	return (
		<div
			key={surface._id}
			className="group flex items-center gap-2 rounded-md p-1 transition-colors select-none has-checked:bg-primary-700/20"
		>
			<label className="flex flex-1 items-center gap-2">
				<div className="relative flex-center size-10 rounded border border-gray-800 bg-gray-950/50">
					{surface.backgroundUrl ? (
						<SmartImage
							src={getOptimizedImageUrl(surface.backgroundUrl, 100).href}
							className="size-full object-cover"
						/>
					) : (
						<Icon icon="mingcute:table-2-fill" className="size-6 opacity-75" />
					)}
					<div className="fade absolute inset-0 flex-center overflow-clip px-2 opacity-0 transition group-hover:fade-visible has-checked:fade-visible">
						<input
							type="checkbox"
							className="size-5 accent-primary-400"
							checked={selected}
							onChange={(event) => onChangeSelected(event.target.checked)}
						/>
					</div>
				</div>
				<div className="grid flex-1 leading-tight">
					<p className="line-clamp-2">{surface.name}</p>
					{surface.isCurrent && (
						<p className="line-clamp-1 text-sm/tight font-semibold text-primary-400/75">
							Currently active
						</p>
					)}
				</div>
			</label>
			<SurfaceCardMenu surface={surface} />
		</div>
	)
}

function SurfaceCardMenu({ surface }: { surface: ClientSurface }) {
	const updateSurface = useMutation(api.surfaces.update)
	const removeSurface = useMutation(api.surfaces.remove)
	const updateRoom = useMutation(api.rooms.update)

	return (
		<Menu>
			<MenuButton
				render={<Button icon="mingcute:more-2-fill" shape="square" size="sm" />}
				className="fade overflow-clip group-hover:fade-visible"
			>
				Actions
			</MenuButton>
			<MenuPanel>
				<MenuItem
					icon="mingcute:check-fill"
					onClick={async () => {
						await updateRoom({
							id: surface.roomId,
							patch: {
								currentSurfaceId: surface._id,
							},
						})
					}}
				>
					Set as current
				</MenuItem>
				<MenuItem
					icon="mingcute:pencil-fill"
					onClick={async () => {
						const name = prompt("New name?", surface.name)
						if (!name) return
						await updateSurface({
							id: surface._id,
							patch: { name },
						})
					}}
				>
					Rename
				</MenuItem>
				<MenuItem
					icon="mingcute:delete-fill"
					onClick={async () => {
						if (confirm("Are you sure you want to delete this surface?")) {
							await removeSurface({ id: surface._id })
						}
					}}
				>
					Delete
				</MenuItem>
			</MenuPanel>
		</Menu>
	)
}
