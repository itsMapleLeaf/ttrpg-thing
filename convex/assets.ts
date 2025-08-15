import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import type { Doc } from "./_generated/dataModel.js"
import { mutation, type QueryCtx, query } from "./_generated/server"

export const list = query({
	args: {
		roomId: v.id("rooms"),
		searchTerm: v.optional(v.string()),
	},
	handler: async (ctx, { roomId, searchTerm }) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) return []

		// assets in rooms are public for now
		// const room = await ctx.db.get(roomId)
		// if (!room || room.ownerId !== userId) return []

		let query
		query = ctx.db.query("assets")

		searchTerm = searchTerm?.trim()

		if (searchTerm) {
			query = query.withSearchIndex("search_by_name", (q) =>
				q.search("name", searchTerm).eq("roomId", roomId),
			)
		} else {
			query = query.withIndex("by_room_and_name", (q) => q.eq("roomId", roomId))
		}

		const assets = await query.collect()

		return await Promise.all(assets.map((asset) => makeClientAsset(ctx, asset)))
	},
})

export const get = query({
	args: { id: v.id("assets") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) {
			return null
		}

		const asset = await ctx.db.get(args.id)
		if (!asset) {
			return null
		}

		// assets in rooms are public for now
		// const room = await ctx.db.get(asset.roomId)
		// if (!room || room.ownerId !== userId) {
		// 	return null
		// }

		return await makeClientAsset(ctx, asset)
	},
})

export const create = mutation({
	args: {
		name: v.string(),
		fileId: v.id("_storage"),
		roomId: v.id("rooms"),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) {
			throw new Error("Unauthorized")
		}

		// for now, all users can add assets
		// if (room.ownerId !== userId) {
		// 	throw new Error("You don't have permission to add assets to this room")
		// }

		const assetId = await ctx.db.insert("assets", {
			name: args.name,
			fileId: args.fileId,
			roomId: args.roomId,
			ownerId: userId,
		})

		return assetId
	},
})

export const update = mutation({
	args: {
		id: v.id("assets"),
		name: v.string(),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) {
			throw new Error("Unauthorized")
		}

		const asset = await ctx.db.get(args.id)
		if (!asset) {
			throw new Error("Asset not found")
		}

		if (asset.ownerId !== userId) {
			throw new Error("You don't have permission to update this asset")
		}

		await ctx.db.patch(args.id, {
			name: args.name,
		})

		return args.id
	},
})

export const remove = mutation({
	args: { id: v.id("assets") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) {
			throw new Error("Unauthorized")
		}

		const asset = await ctx.db.get(args.id)
		if (!asset) {
			throw new Error("Asset not found")
		}

		if (asset.ownerId !== userId) {
			throw new Error("You don't have permission to delete this asset")
		}

		// this can only fail if the file doesn't exist,
		// but we'll warn just in case
		try {
			await ctx.storage.delete(asset.fileId)
		} catch (error) {
			console.warn("Failed to delete asset file", asset, error)
		}

		await ctx.db.delete(args.id)

		return args.id
	},
})

export type ClientAsset = Awaited<ReturnType<typeof makeClientAsset>>
async function makeClientAsset(ctx: QueryCtx, asset: Doc<"assets">) {
	return {
		...asset,
		url: await ctx.storage.getUrl(asset.fileId),
	}
}
