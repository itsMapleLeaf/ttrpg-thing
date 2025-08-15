import { getAuthUserId } from "@convex-dev/auth/server"
import { mutation } from "./_generated/server.js"

export const generateUploadUrl = mutation({
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) {
			throw new Error("Unauthorized")
		}
		return await ctx.storage.generateUploadUrl()
	},
})
