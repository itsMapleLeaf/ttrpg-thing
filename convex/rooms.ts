import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { omit } from "convex-helpers"
import { mutation, query } from "./_generated/server"
import { ensureAuthUserId } from "./auth.ts"
import schema from "./schema.ts"

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
	args: omit(schema.tables.rooms.validator.fields, ["ownerId"]),
	handler: async (ctx, args) => {
		const userId = await ensureAuthUserId(ctx)

		const existingRoom = await ctx.db
			.query("rooms")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.unique()

		if (existingRoom) {
			throw new Error("A room with this slug already exists")
		}

		const roomId = await ctx.db.insert("rooms", {
			...args,
			ownerId: userId,
		})

		return roomId
	},
})
