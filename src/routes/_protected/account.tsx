import { Icon } from "@iconify/react"
import { createFileRoute } from "@tanstack/react-router"
import { useMutation } from "convex/react"
import { useActionState, useId, useMemo, useRef, useState } from "react"
import { api } from "../../../convex/_generated/api.js"
import { Label } from "../../components/Label.tsx"
import { useUploadImage } from "../../hooks/useUploadImage.ts"
import { useUser } from "../../user-context.tsx"

export const Route = createFileRoute("/_protected/account")({
	component: Account,
})

function Account() {
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
					<UpdateProfileForm />
				</div>
			</div>
		</div>
	)
}

function UpdateProfileForm() {
	const user = useUser()
	const updateUser = useMutation(api.users.update)
	const [name, setName] = useState(user.name)
	const [email, setEmail] = useState(user.email)
	const [image, setImage] = useState<File | null>(null)
	const nameId = useId()
	const emailId = useId()
	const uploadImage = useUploadImage()

	const [state, formAction, isPending] = useActionState(
		async (_prevState: { error?: string; success?: string } | null) => {
			try {
				let imageId
				if (image) {
					imageId = await uploadImage(image)
				}

				await updateUser({
					name: name.trim(),
					email: email.trim(),
					...(imageId && { imageId }),
				})

				setImage(null)

				return { success: "Profile updated successfully" }
			} catch (error) {
				return {
					error:
						error instanceof Error ? error.message : "Failed to update profile",
				}
			}
		},
		null,
	)

	return (
		<form action={formAction} className="space-y-6">
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

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div className="flex flex-col items-center space-y-4 text-center">
					<div className="mb-2 block text-sm font-medium">Avatar image</div>
					<AvatarUploader onFileSelect={setImage} selectedFile={image} />
				</div>

				<div className="space-y-4 lg:col-span-2">
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
						<button
							type="submit"
							className="btn btn-primary"
							disabled={isPending}
						>
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
				</div>
			</div>
		</form>
	)
}

function AvatarUploader({
	onFileSelect,
	selectedFile,
}: {
	onFileSelect: (file: File | null) => void
	selectedFile: File | null
}) {
	const user = useUser()
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (file) {
			onFileSelect(file)
		}
	}

	const avatarSrc = useMemo(() => {
		if (selectedFile) {
			return URL.createObjectURL(selectedFile)
		}
		if (user.imageUrl) {
			return user.imageUrl
		}
		return null
	}, [selectedFile, user.imageUrl])

	return (
		<div className="space-y-4">
			<button
				type="button"
				className="size-24 overflow-clip rounded-full border-2 border-black/25 transition hover:brightness-110"
				aria-hidden
				onClick={() => fileInputRef.current?.click()}
			>
				{avatarSrc ? (
					<img src={avatarSrc} alt="" className="avatar" />
				) : (
					<div className="flex items-center justify-center bg-base-300">
						<Icon icon="mingcute:user-fill" className="size-8 opacity-50" />
					</div>
				)}
			</button>

			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				onChange={handleFileChange}
				className="hidden"
			/>

			<div className="flex flex-col gap-2">
				<button
					type="button"
					onClick={() => fileInputRef.current?.click()}
					className="btn btn-ghost btn-sm"
				>
					<Icon icon="mingcute:upload-fill" className="btn-icon" />
					{selectedFile ? "Change photo" : "Choose photo"}
				</button>

				{selectedFile && (
					<p className="text-center text-xs opacity-70">
						Your avatar will be updated when you save
					</p>
				)}
			</div>
		</div>
	)
}
