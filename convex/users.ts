import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { mutation, query } from "./_generated/server.js"

export const me = query({
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx)
		return userId && (await ctx.db.get(userId))
	},
})

export const update = mutation({
	args: {
		name: v.string(),
		email: v.string(),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) {
			throw new Error("Unauthorized")
		}

		await ctx.db.patch(userId, {
			name: args.name,
			email: args.email,
		})
	},
})
