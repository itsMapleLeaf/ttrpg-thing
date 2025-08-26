import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import type { ClientArtifact } from "../../../convex/artifacts.ts"
import { useSelection } from "../../hooks/useSelection.ts"
import { Button } from "../../ui/Button.tsx"
import { EmptyState } from "../../ui/EmptyState.tsx"
import { Iconish } from "../../ui/Iconish.tsx"
import { ToggleSection } from "./ToggleSection.tsx"

export function ArtifactListSection({
	roomId,
	artifacts,
}: {
	roomId: Id<"rooms">
	artifacts: ClientArtifact[]
}) {
	const updateArtifact = useMutation(api.artifacts.update)
	const createArtifact = useMutation(api.artifacts.create)
	const removeArtifacts = useMutation(api.artifacts.removeMany)

	const {
		selection,
		selectedCount,
		isSelected,
		clearSelection,
		selectAll,
		setSelected,
	} = useSelection(artifacts?.map((artifact) => artifact._id) ?? [])

	return (
		<ToggleSection
			name="Artifacts"
			subtext={selectedCount > 0 && `${selectedCount} selected`}
			actions={[
				selectedCount > 0 && {
					name: "Delete selected",
					icon: "mingcute:delete-2-fill",
					callback: async () => {
						if (
							confirm(
								`Are you sure you want to delete ${selectedCount} artifacts?`,
							)
						) {
							await removeArtifacts({ ids: [...selection] })
							clearSelection()
						}
					},
				},
				selectedCount === 0 && {
					name: "New artifact",
					icon: "mingcute:classify-add-2-fill",
					callback: async () => {
						const name = prompt(
							"Artifact name?",
							`New Artifact ${artifacts.length + 1}`,
						)
						if (!name) return
						await createArtifact({ name, roomId, type: "note" })
					},
				},
				selectedCount < artifacts.length && {
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
			{artifacts.length === 0 ? (
				<EmptyState
					icon="mingcute:classify-2-fill"
					message="No artifacts yet"
				/>
			) : (
				<div className="grid gap-1 p-1">
					{artifacts.map((artifact) => (
						<div
							key={artifact._id}
							className="group flex items-center gap-2 rounded-md p-1 transition-colors select-none has-checked:bg-primary-700/20"
						>
							<label className="flex flex-1 items-center gap-2">
								<div className="relative flex-center size-10 rounded border border-gray-800 bg-gray-950/50">
									<Iconish
										icon="mingcute:classify-2-fill"
										className="size-8 opacity-75"
									/>
									<div className="fade absolute inset-0 flex-center overflow-clip px-2 opacity-0 transition group-hover:fade-visible has-checked:fade-visible">
										<input
											type="checkbox"
											className="size-5 accent-primary-400"
											checked={isSelected(artifact._id)}
											onChange={(event) =>
												setSelected(artifact._id, event.target.checked)
											}
										/>
									</div>
								</div>
								<p className="line-clamp-2 flex-1">{artifact.name}</p>
							</label>

							<Button
								icon="mingcute:pencil-fill"
								shape="square"
								size="sm"
								className="fade overflow-clip group-hover:fade-visible"
								onClick={async () => {
									const name = prompt("New name?", artifact.name)
									if (!name) return
									await updateArtifact({ id: artifact._id, patch: { name } })
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
