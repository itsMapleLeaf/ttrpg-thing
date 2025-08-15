import { convexQuery, useConvexMutation } from "@convex-dev/react-query"
import { Icon } from "@iconify/react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { formatDistanceToNow } from "date-fns"
import { useActionState, useId, useRef, useState } from "react"
import { api } from "../../../convex/_generated/api.js"

export const Route = createFileRoute("/_protected/")({
	component: Home,
})

function Home() {
	const { data: rooms } = useSuspenseQuery(convexQuery(api.rooms.list, {}))

	return (
		<div className="container mx-auto p-6">
			<header className="mb-8 flex items-center justify-between">
				<h1 className="text-3xl font-semibold">Your rooms</h1>
				<CreateRoomButton />
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
						<p className="text-xl font-semibold">No rooms yet</p>
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
								<h3 className="card-title text-lg font-semibold">
									{room.name}
								</h3>
								<p className="text-xs opacity-70">
									Created{" "}
									{formatDistanceToNow(room._creationTime, { addSuffix: true })}
								</p>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	)
}

function CreateRoomButton() {
	const [name, setName] = useState("")
	const [slug, setSlug] = useState("")
	const placeholderSlug = kebabCase(name)
	const createRoom = useConvexMutation(api.rooms.create)
	const nameId = useId()
	const slugId = useId()
	const formId = useId()
	const router = useRouter()
	const dialogRef = useRef<HTMLDialogElement>(null)

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
		<>
			<button
				type="button"
				className="btn btn-primary"
				onClick={() => {
					dialogRef.current?.showModal()
				}}
			>
				<Icon icon="mingcute:add-fill" className="btn-icon" />
				Create room
			</button>

			<dialog
				className="modal transition-discrete duration-150"
				ref={dialogRef}
			>
				<div className="modal-box transition-discrete duration-150">
					<h3 className="mb-4 text-lg font-semibold">Create new room</h3>

					<form action={formAction} className="space-y-4" id={formId}>
						{state?.error && (
							<div className="alert alert-error">
								<span>{state.error}</span>
							</div>
						)}

						<div>
							<label className="label" htmlFor={nameId}>
								<span className="label-text">
									Room name<span aria-hidden>*</span>{" "}
									<span className="sr-only">(required)</span>
								</span>
							</label>
							<input
								id={nameId}
								name="name"
								type="text"
								className="input-bordered input w-full"
								placeholder="My awesome campaign"
								required
								disabled={isPending}
								value={name}
								onChange={(event) => setName(event.target.value)}
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
								placeholder={placeholderSlug}
								disabled={isPending}
								value={slug}
								onChange={(event) => setSlug(event.target.value)}
							/>
							<div className="label">
								<span className="label-text-alt opacity-70">
									URL will be: /rooms/{slug || placeholderSlug}
								</span>
							</div>
						</div>
					</form>

					<div className="modal-action">
						<form method="dialog">
							<button type="submit" className="btn" disabled={isPending}>
								Cancel
							</button>
						</form>
						<button
							type="submit"
							className="btn btn-primary"
							disabled={isPending}
							form={formId}
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
				</div>

				<form method="dialog" className="modal-backdrop">
					<button type="submit">close</button>
				</form>
			</dialog>
		</>
	)
}

function kebabCase(str: string) {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
}
