import { getAuthUserId } from "@convex-dev/auth/server"
import type { WithoutSystemFields } from "convex/server"
import { ConvexError, type Infer, v } from "convex/values"
import { omit } from "convex-helpers"
import { literals, partial } from "convex-helpers/validators"
import { roundToNearest } from "../src/lib/helpers.ts"
import type { Doc, Id } from "./_generated/dataModel"
import {
	type MutationCtx,
	mutation,
	type QueryCtx,
	query,
} from "./_generated/server"
import { getAssetImageUrl } from "./assets.ts"
import { ensureAuthUserId } from "./auth.ts"
import schema from "./schema.ts"

export type TileListOrder = Infer<typeof tileListOrderValidator>
const tileListOrderValidator = literals("alphabetical", "newestFirst")

export const list = query({
	args: {
		surfaceId: v.id("surfaces"),
	},
	handler: async (ctx, { surfaceId }) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) return []

		const docs = await ctx.db
			.query("tiles")
			.withIndex("by_surface", (q) => q.eq("surfaceId", surfaceId))
			.collect()

		// tiles in rooms are public for now
		// const room = await ctx.db.get(roomId)
		// if (!room || room.ownerId !== userId) return []

		return await Promise.all(
			docs.map((doc) => makeClientTile(ctx, doc, userId)),
		)
	},
})

export const get = query({
	args: { id: v.id("tiles") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) {
			return null
		}

		const tile = await ctx.db.get(args.id)
		if (!tile) {
			return null
		}

		// tiles in rooms are public for now
		// const room = await ctx.db.get(tile.roomId)
		// if (!room || room.ownerId !== userId) {
		// 	return null
		// }

		return await makeClientTile(ctx, tile, userId)
	},
})

export const create = mutation({
	args: {
		...omit(schema.tables.tiles.validator.fields, ["ownerId"]),
	},
	handler: async (ctx, args) => {
		const userId = await ensureAuthUserId(ctx)

		// for now, all users can add tiles
		// if (room.ownerId !== userId) {
		// 	throw new Error("You don't have permission to add tiles to this room")
		// }

		const tileId = await ctx.db.insert("tiles", {
			...args,
			ownerId: userId,
			left: roundToNearest(args.left, 20),
			top: roundToNearest(args.top, 20),
		})

		return tileId
	},
})

export const update = mutation({
	args: {
		id: v.id("tiles"),
		patch: v.object(partial(schema.tables.tiles.validator.fields)),
	},
	handler: async (ctx, { id, patch }) => {
		await updateTile(ctx, id, patch)
	},
})

export const updateMany = mutation({
	args: {
		updates: v.array(
			v.object({
				id: v.id("tiles"),
				patch: v.object(partial(schema.tables.tiles.validator.fields)),
			}),
		),
	},
	handler: async (ctx, { updates }) => {
		for (const { id, patch } of updates) {
			await updateTile(ctx, id, patch)
		}
	},
})

export const remove = mutation({
	args: { id: v.id("tiles") },
	handler: async (ctx, args) => {
		await removeTile(ctx, args.id)
	},
})

export const removeMany = mutation({
	args: { ids: v.array(v.id("tiles")) },
	handler: async (ctx, args) => {
		const results = await Promise.allSettled(
			args.ids.map(async (id) => removeTile(ctx, id)),
		)

		return {
			errors: results
				.filter((it) => it.status === "rejected")
				.map((result) => {
					console.error(result.reason)
					return result instanceof Error ? result.message : String(result)
				}),
		}
	},
})

export type ClientTile = Awaited<ReturnType<typeof makeClientTile>>
async function makeClientTile(
	ctx: QueryCtx,
	tile: Doc<"tiles">,
	userId: Id<"users">,
) {
	return {
		...tile,
		isOwner: tile.ownerId === userId,
		assetUrl: tile.assetId && (await getAssetImageUrl(ctx, tile.assetId)),
	}
}

async function updateTile(
	ctx: MutationCtx,
	id: Id<"tiles">,
	patch: WithoutSystemFields<Partial<Doc<"tiles">>>,
) {
	const userId = await ensureAuthUserId(ctx)

	const tile = await ctx.db.get(id)
	if (!tile) {
		throw new Error("Tile not found")
	}

	if (tile.ownerId !== userId) {
		throw new Error("You don't have permission to update this tile")
	}

	await ctx.db.patch(id, {
		...patch,
		left: roundToNearest(patch.left ?? tile.left, 20),
		top: roundToNearest(patch.top ?? tile.top, 20),
	})
}

async function removeTile(ctx: MutationCtx, id: Id<"tiles">) {
	const userId = await ensureAuthUserId(ctx)

	const tile = await ctx.db.get(id)
	if (!tile) {
		throw new ConvexError({ message: "Not found", id })
	}

	if (tile.ownerId !== userId) {
		throw new ConvexError({
			message: `You don't have permission to do that.`,
			id,
		})
	}

	await ctx.db.delete(id)
}
