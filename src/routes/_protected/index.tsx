import { useConvexMutation } from "@convex-dev/react-query"
import { Icon } from "@iconify/react"
import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { formatDistanceToNow } from "date-fns"
import { useActionState, useId, useRef, useState } from "react"
import { api } from "../../../convex/_generated/api.js"
import { Label } from "../../components/Label.js"
import {
	Modal,
	ModalActions,
	ModalButton,
	ModalPanel,
} from "../../components/Modal.js"
import { PageHeader } from "../../components/PageHeader.js"

export const Route = createFileRoute("/_protected/")({
	component: Home,
	loader: ({ context }) => {
		return context.convexClient.query(api.rooms.list)
	},
})

function Home() {
	const loaderData = Route.useLoaderData()
	const rooms = useQuery(api.rooms.list) ?? loaderData

	return (
		<>
			<PageHeader heading="Your rooms" actions={<CreateRoomButton />} />
			<div className="container py-6">
				{rooms.length === 0 ? (
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
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
						{rooms.map((room) => (
							<Link
								key={room._id}
								to="/rooms/$slug"
								params={{ slug: room.slug }}
								className="panel-interactive"
							>
								<h3 className="text-lg font-medium">{room.name}</h3>
								<p className="text-xs opacity-70">
									Created{" "}
									{formatDistanceToNow(room._creationTime, {
										addSuffix: true,
									})}
								</p>
							</Link>
						))}
					</div>
				)}
			</div>
		</>
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
		<Modal>
			<ModalButton
				type="button"
				className="button-clear"
				onClick={() => {
					dialogRef.current?.showModal()
				}}
			>
				<Icon icon="mingcute:add-fill" className="button-icon" />
				Create room
			</ModalButton>

			<ModalPanel heading="New room">
				<form action={formAction} id={formId} className="grid gap-2">
					<div>
						<Label htmlFor={nameId} required>
							Room name
						</Label>
						<input
							id={nameId}
							name="name"
							type="text"
							className="input-bordered input w-full"
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
							className="input-bordered input w-full"
							placeholder={placeholderSlug}
							disabled={isPending}
							value={slug}
							onChange={(event) => setSlug(event.target.value)}
						/>
						<div
							className="label-text-alt mt-1 label text-sm opacity-0 data-visible:opacity-70 data-visible:transition"
							data-visible={slug || placeholderSlug || undefined}
						>
							URL will be: /rooms/{slug || placeholderSlug}
						</div>
					</div>

					{state?.error && (
						<div className="callout-error">
							<Icon icon="mingcute:close-circle-fill" />
							<p>{state.error}</p>
						</div>
					)}
				</form>
				<ModalActions>
					<button
						type="submit"
						className="button-solid"
						disabled={isPending}
						form={formId}
					>
						Create room
					</button>
				</ModalActions>
			</ModalPanel>
		</Modal>
	)
}

function kebabCase(str: string) {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
}
