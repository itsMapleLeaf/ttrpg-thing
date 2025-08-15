import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const list = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) {
			return []
		}

		return await ctx.db
			.query("rooms")
			.withIndex("by_owner", (q) => q.eq("ownerId", userId))
			.order("desc")
			.collect()
	},
})

export const get = query({
	args: { slug: v.string() },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) {
			return null
		}

		const room = await ctx.db
			.query("rooms")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.unique()

		if (!room || room.ownerId !== userId) {
			return null
		}

		return room
	},
})

export const create = mutation({
	args: {
		name: v.string(),
		slug: v.string(),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) {
			throw new Error("Unauthorized")
		}

		const existingRoom = await ctx.db
			.query("rooms")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.unique()

		if (existingRoom) {
			throw new Error("A room with this slug already exists")
		}

		const roomId = await ctx.db.insert("rooms", {
			name: args.name,
			slug: args.slug,
			ownerId: userId,
		})

		return roomId
	},
})
