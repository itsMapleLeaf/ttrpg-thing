import { getAuthUserId } from "@convex-dev/auth/server"
import { query } from "./_generated/server.js"

export const me = query({
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx)
		return userId && (await ctx.db.get(userId))
	},
})
