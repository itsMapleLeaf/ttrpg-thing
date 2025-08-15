import { Icon } from "@iconify/react"
import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { formatDistanceToNow } from "date-fns"
import { useActionState, useId, useState } from "react"
import { api } from "../../../convex/_generated/api.js"

export const Route = createFileRoute("/_protected/")({
	component: Home,
})

function Home() {
	const rooms = useQuery(api.rooms.list)
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

	return (
		<div className="container mx-auto p-6">
			<header className="mb-8 flex items-center justify-between">
				<h1 className="text-3xl font-bold">Your rooms</h1>
				<button
					type="button"
					className="btn btn-primary"
					onClick={() => setIsCreateModalOpen(true)}
				>
					<Icon icon="mingcute:add-fill" className="btn-icon" />
					Create room
				</button>
			</header>

			{rooms === undefined ? (
				<div className="flex items-center gap-3" aria-live="polite">
					<span className="loading loading-sm loading-spinner" />
					<span className="text-sm opacity-70">Loading rooms...</span>
				</div>
			) : rooms.length === 0 ? (
				<div className="py-12 text-center">
					<div className="space-y-3">
						<Icon
							icon="mingcute:home-3-line"
							className="mx-auto text-4xl opacity-50"
						/>
						<h2 className="text-xl font-semibold">No rooms yet</h2>
						<p className="mx-auto max-w-sm text-sm opacity-70">
							Create your first room to start organizing your TTRPG campaigns
							and sessions.
						</p>
						<button
							type="button"
							className="btn mt-4 btn-primary"
							onClick={() => setIsCreateModalOpen(true)}
						>
							<Icon icon="mingcute:add-fill" className="btn-icon" />
							Create your first room
						</button>
					</div>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{rooms.map((room) => (
						<Link
							key={room._id}
							to="/rooms/$slug"
							params={{ slug: room.slug }}
							className="hover:bg-base-50 card border border-base-300 bg-base-100 shadow transition-colors"
						>
							<div className="card-body">
								<h3 className="card-title text-lg">{room.name}</h3>
								<p className="text-xs opacity-70">
									Created{" "}
									{formatDistanceToNow(room._creationTime, { addSuffix: true })}
								</p>
							</div>
						</Link>
					))}
				</div>
			)}

			<CreateRoomModal
				isOpen={isCreateModalOpen}
				onClose={() => setIsCreateModalOpen(false)}
			/>
		</div>
	)
}

function CreateRoomModal({
	isOpen,
	onClose,
}: {
	isOpen: boolean
	onClose: () => void
}) {
	const createRoom = useMutation(api.rooms.create)
	const nameId = useId()
	const slugId = useId()
	const router = useRouter()

	const kebabCase = (str: string) => {
		return str
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "")
	}

	const createRoomAction = async (
		_prevState: { error?: string; name?: string; slug?: string } | null,
		formData: FormData,
	) => {
		const name = formData.get("name") as string
		const slug = formData.get("slug") as string

		if (!name?.trim()) {
			return { error: "Room name is required", name, slug }
		}

		try {
			const finalSlug = slug?.trim() || kebabCase(name)
			await createRoom({ name: name.trim(), slug: finalSlug })
			onClose()
			router.navigate({ to: "/rooms/$slug", params: { slug: finalSlug } })
			return null
		} catch (error) {
			return {
				error: error instanceof Error ? error.message : "Failed to create room",
				name,
				slug,
			}
		}
	}

	const [state, formAction, isPending] = useActionState(createRoomAction, null)

	const currentName = state?.name || ""
	const placeholderSlug = currentName ? kebabCase(currentName) : ""

	return (
		<dialog className={`modal ${isOpen ? `modal-open` : ``}`}>
			<div className="modal-box">
				<h3 className="mb-4 text-lg font-bold">Create new room</h3>

				<form action={formAction} className="space-y-4">
					{state?.error && (
						<div className="alert alert-error">
							<span>{state.error}</span>
						</div>
					)}

					<div>
						<label className="label" htmlFor={nameId}>
							<span className="label-text">Room name *</span>
						</label>
						<input
							id={nameId}
							name="name"
							type="text"
							className="input-bordered input w-full"
							defaultValue={state?.name || ""}
							placeholder="My awesome campaign"
							required
							disabled={isPending}
						/>
					</div>

					<div>
						<label className="label" htmlFor={slugId}>
							<span className="label-text">Slug (optional)</span>
						</label>
						<input
							id={slugId}
							name="slug"
							type="text"
							className="input-bordered input w-full"
							defaultValue={state?.slug || ""}
							placeholder={placeholderSlug}
							disabled={isPending}
						/>
						<div className="label">
							<span className="label-text-alt opacity-70">
								URL will be: /rooms/{state?.slug || placeholderSlug}
							</span>
						</div>
					</div>

					<div className="modal-action">
						<button
							type="button"
							className="btn"
							onClick={onClose}
							disabled={isPending}
						>
							Cancel
						</button>
						<button
							type="submit"
							className="btn btn-primary"
							disabled={isPending}
						>
							{isPending ? (
								<>
									<span className="loading loading-sm loading-spinner" />
									Creating...
								</>
							) : (
								"Create room"
							)}
						</button>
					</div>
				</form>
			</div>
			<form method="dialog" className="modal-backdrop">
				<button type="button" onClick={onClose}>
					close
				</button>
			</form>
		</dialog>
	)
}
