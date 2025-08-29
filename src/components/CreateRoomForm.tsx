import { useConvexMutation } from "@convex-dev/react-query"
import { Icon } from "@iconify/react"
import { useRouter } from "@tanstack/react-router"
import { useActionState, useId, useState } from "react"
import { api } from "../../convex/_generated/api.js"
import { Label } from "../ui/Label.tsx"

export function CreateRoomForm() {
	const [name, setName] = useState("")
	const [slug, setSlug] = useState("")
	const placeholderSlug = kebabCase(name)
	const createRoom = useConvexMutation(api.rooms.create)
	const nameId = useId()
	const slugId = useId()
	const formId = useId()
	const router = useRouter()

	const [state, formAction, isPending] = useActionState(
		async (_state: { error?: string } | undefined) => {
			if (!name.trim()) {
				return { error: "Room name is required" }
			}

			try {
				const finalSlug = slug.trim() || placeholderSlug
				await createRoom({ name: name.trim(), slug: finalSlug })
				router.navigate({ to: "/rooms/$slug", params: { slug: finalSlug } })
			} catch (error) {
				return {
					error:
						error instanceof Error ? error.message : "Failed to create room",
				}
			}
		},
		undefined,
	)

	return (
		<form action={formAction} id={formId} className="grid gap-6 panel p-4">
			<div className="space-y-4">
				<h1 className="text-2xl font-semibold">Create new room</h1>

				<div>
					<Label htmlFor={nameId} required>
						Room name
					</Label>
					<input
						id={nameId}
						name="name"
						type="text"
						className="input w-full"
						placeholder="My awesome room"
						required
						disabled={isPending}
						value={name}
						onChange={(event) => setName(event.target.value)}
					/>
				</div>

				<div>
					<Label htmlFor={slugId}>Slug</Label>
					<input
						id={slugId}
						name="slug"
						type="text"
						className="input w-full"
						placeholder={placeholderSlug}
						disabled={isPending}
						value={slug}
						onChange={(event) => setSlug(event.target.value)}
					/>
					<div
						className="mt-1 text-xs opacity-0 data-visible:opacity-70 data-visible:transition"
						data-visible={slug || placeholderSlug || undefined}
					>
						URL: /rooms/{slug || placeholderSlug}
					</div>
				</div>

				<div className="flex justify-end pt-4">
					<button
						type="submit"
						className="button-solid"
						disabled={isPending}
						form={formId}
					>
						{isPending ? (
							<Icon icon="mingcute:loading-3-fill" className="animate-spin" />
						) : (
							<Icon icon="mingcute:add-fill" className="button-icon" />
						)}
						{isPending ? "Creating..." : "Create room"}
					</button>
				</div>
			</div>

			{state?.error && (
				<div className="callout-error">
					<Icon icon="mingcute:close-circle-fill" />
					<p>{state.error}</p>
				</div>
			)}
		</form>
	)
}

function kebabCase(str: string) {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
}
