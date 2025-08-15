import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { omit } from "es-toolkit"
import type { Doc } from "./_generated/dataModel.js"
import { mutation, query } from "./_generated/server.js"

export interface ClientUser extends Omit<Doc<"users">, "imageId" | "image"> {
	imageUrl?: string | null
}

export const me = query({
	handler: async (ctx): Promise<ClientUser | null> => {
		const userId = await getAuthUserId(ctx)
		const user = userId && (await ctx.db.get(userId))

		let imageUrl: string | null | undefined
		if (user?.imageId) {
			imageUrl = await ctx.storage.getUrl(user.imageId)
		}
		if (!imageUrl) {
			imageUrl = user?.image
		}

		return user ? { ...omit(user, ["imageId", "image"]), imageUrl } : null
	},
})

export const update = mutation({
	args: {
		name: v.string(),
		email: v.string(),
		imageId: v.optional(v.id("_storage")),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) {
			throw new Error("Unauthorized")
		}

		const user = await ctx.db.get(userId)
		if (!user) {
			throw new Error(`User doc with id "${userId}" not found`)
		}

		if (args.imageId && user.imageId) {
			await ctx.storage.delete(user.imageId)
		}

		await ctx.db.patch(userId, {
			name: args.name,
			email: args.email,
			...(args.imageId && { imageId: args.imageId }),
		})
	},
})
