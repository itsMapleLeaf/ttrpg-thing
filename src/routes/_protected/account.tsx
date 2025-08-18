import { Icon } from "@iconify/react"
import { createFileRoute } from "@tanstack/react-router"
import { useMutation } from "convex/react"
import { useActionState, useId, useMemo, useRef, useState } from "react"
import { api } from "../../../convex/_generated/api.js"
import { Label } from "../../components/Label.tsx"
import { PageHeader } from "../../components/PageHeader.tsx"
import { useUploadImage } from "../../hooks/useUploadImage.ts"
import { useUser } from "../../user-context.tsx"

export const Route = createFileRoute("/_protected/account")({
	component: Account,
})

function Account() {
	return (
		<>
			<PageHeader heading="Account Settings" />
			<div className="container mx-auto max-w-2xl p-6">
				<UpdateProfileForm />
			</div>
		</>
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
		<form action={formAction} className="grid gap-6 panel p-4">
			<div className="items-center gap-6 sm:flex">
				<div className="flex flex-col items-center space-y-4 text-center">
					<div className="mb-2 label">Avatar image</div>
					<AvatarUploader onFileSelect={setImage} selectedFile={image} />
				</div>

				<div className="flex-1 space-y-4">
					<div>
						<Label htmlFor={nameId} required>
							Display name
						</Label>
						<input
							id={nameId}
							name="name"
							type="text"
							className="input w-full"
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
							className="input w-full"
							placeholder="your.email@example.com"
							required
							disabled={isPending}
							value={email}
							onChange={(event) => setEmail(event.target.value)}
						/>
					</div>

					<div className="flex justify-end pt-4">
						<button type="submit" className="button-solid" disabled={isPending}>
							{isPending ? (
								<Icon icon="mingcute:loading-3-fill" className="animate-spin" />
							) : (
								<Icon icon="mingcute:check-fill" className="button-icon" />
							)}
							Save changes
						</button>
					</div>
				</div>
			</div>

			{state?.error && !isPending && (
				<div className="callout-error">
					<Icon icon="mingcute:close-circle-fill" />
					<span>{state.error}</span>
				</div>
			)}

			{state?.success && !isPending && (
				<div className="callout-info">
					<Icon icon="mingcute:check-circle-fill" className="h-4 w-4" />
					<span>{state.success}</span>
				</div>
			)}
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
					<div className="bg-base-300 flex items-center justify-center">
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
					className="button-clear"
				>
					<Icon icon="mingcute:upload-fill" className="button-icon" />
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
