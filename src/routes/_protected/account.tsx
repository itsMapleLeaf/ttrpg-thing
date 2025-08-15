import { Icon } from "@iconify/react"
import { createFileRoute } from "@tanstack/react-router"
import { useMutation } from "convex/react"
import { useActionState, useId, useState } from "react"
import { api } from "../../../convex/_generated/api.js"
import type { Doc } from "../../../convex/_generated/dataModel.js"
import { Label } from "../../components/Label.tsx"
import { useUser } from "../../user-context.tsx"

export const Route = createFileRoute("/_protected/account")({
	component: Account,
})

function Account() {
	const user = useUser()

	return (
		<div className="container mx-auto max-w-2xl p-6">
			<div className="space-y-6">
				<header>
					<h2 className="text-3xl font-semibold">Account settings</h2>
					<p className="mt-1 text-sm opacity-70">
						Manage your personal information and preferences
					</p>
				</header>

				<div className="card card-body border border-base-300 bg-base-100">
					<UpdateProfileForm user={user} />
				</div>
			</div>
		</div>
	)
}

function UpdateProfileForm({ user }: { user: Doc<"users"> }) {
	const updateUser = useMutation(api.users.update)
	const [name, setName] = useState(user.name || "")
	const [email, setEmail] = useState(user.email || "")
	const nameId = useId()
	const emailId = useId()

	const updateProfileAction = async (
		_prevState: { error?: string; success?: string } | null,
		formData: FormData,
	) => {
		const formName = formData.get("name") as string
		const formEmail = formData.get("email") as string

		if (!formName?.trim()) {
			return { error: "Name is required" }
		}

		if (!formEmail?.trim()) {
			return { error: "Email is required" }
		}

		try {
			await updateUser({ name: formName.trim(), email: formEmail.trim() })
			return { success: "Profile updated successfully" }
		} catch (error) {
			return {
				error:
					error instanceof Error ? error.message : "Failed to update profile",
			}
		}
	}

	const [state, formAction, isPending] = useActionState(
		updateProfileAction,
		null,
	)

	return (
		<form action={formAction} className="space-y-4">
			{state?.error && (
				<div className="alert alert-error">
					<Icon icon="mingcute:close-circle-fill" className="h-4 w-4" />
					<span>{state.error}</span>
				</div>
			)}

			{state?.success && (
				<div className="alert alert-success">
					<Icon icon="mingcute:check-circle-fill" className="h-4 w-4" />
					<span>{state.success}</span>
				</div>
			)}

			<div>
				<Label htmlFor={nameId} required>
					Display name
				</Label>
				<input
					id={nameId}
					name="name"
					type="text"
					className="input-bordered input w-full"
					placeholder="Your display name"
					required
					disabled={isPending}
					value={name}
					onChange={(event) => setName(event.target.value)}
				/>
			</div>

			<div>
				<Label htmlFor={emailId} required>
					Email address
				</Label>
				<input
					id={emailId}
					name="email"
					type="email"
					className="input-bordered input w-full"
					placeholder="your.email@example.com"
					required
					disabled={isPending}
					value={email}
					onChange={(event) => setEmail(event.target.value)}
				/>
			</div>

			<div className="card-actions justify-end pt-4">
				<button type="submit" className="btn btn-primary" disabled={isPending}>
					{isPending ? (
						<>
							<span className="loading loading-sm loading-spinner" />
							Updating...
						</>
					) : (
						<>
							<Icon icon="mingcute:check-fill" className="btn-icon" />
							Save changes
						</>
					)}
				</button>
			</div>
		</form>
	)
}
