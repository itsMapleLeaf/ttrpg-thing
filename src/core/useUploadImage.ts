import { useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

export function useUploadImage() {
	const generateUploadUrl = useMutation(api.storage.generateUploadUrl)

	return async function uploadImage(image: Blob): Promise<Id<"_storage">> {
		const uploadUrl = await generateUploadUrl()

		const result = await fetch(uploadUrl, {
			method: "POST",
			headers: { "Content-Type": image.type },
			body: image,
		})

		const { storageId } = (await result.json()) as { storageId: Id<"_storage"> }
		return storageId
	}
}
