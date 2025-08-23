import { getAuthUserId } from "@convex-dev/auth/server"
import { ConvexError, type Infer, v } from "convex/values"
import { omit } from "convex-helpers"
import { literals, partial } from "convex-helpers/validators"
import type { Doc, Id } from "./_generated/dataModel"
import { mutation, type QueryCtx, query } from "./_generated/server"
import { ensureAuthUserId } from "./auth.ts"
import schema from "./schema.ts"

export type AssetListOrder = Infer<typeof assetListOrderValidator>
const assetListOrderValidator = literals("alphabetical", "newestFirst")

export const list = query({
	args: {
		roomId: v.id("rooms"),
		searchTerm: v.optional(v.string()),
		order: v.optional(assetListOrderValidator),
	},
	handler: async (ctx, { roomId, searchTerm, order }) => {
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
		} else if (order === "alphabetical") {
			query = query.withIndex("by_room_and_name", (q) => q.eq("roomId", roomId))
		} else {
			query = query
				.withIndex("by_room", (q) => q.eq("roomId", roomId))
				.order("desc") // indexes sort by creation date by default
		}

		const assets = await query.collect()

		return await Promise.all(
			assets.map((asset) => makeClientAsset(ctx, asset, userId)),
		)
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

		return await makeClientAsset(ctx, asset, userId)
	},
})

export const create = mutation({
	args: {
		...omit(schema.tables.assets.validator.fields, ["ownerId"]),
		image: v.optional(
			v.object({
				...omit(schema.tables.assets.validator.fields.image.fields, ["key"]),
			}),
		),
		scene: v.optional(
			v.object({
				...omit(schema.tables.assets.validator.fields.scene.fields, ["key"]),
			}),
		),
		actor: v.optional(
			v.object({
				...omit(schema.tables.assets.validator.fields.actor.fields, ["key"]),
			}),
		),
	},
	handler: async (ctx, args) => {
		const userId = await ensureAuthUserId(ctx)

		// for now, all users can add assets
		// if (room.ownerId !== userId) {
		// 	throw new Error("You don't have permission to add assets to this room")
		// }

		const assetId = await ctx.db.insert("assets", {
			...args,
			ownerId: userId,
			image: args.image && { ...args.image, key: crypto.randomUUID() },
			scene: args.scene && { ...args.scene, key: crypto.randomUUID() },
			actor: args.actor && { ...args.actor, key: crypto.randomUUID() },
		})

		return assetId
	},
})

export const update = mutation({
	args: {
		id: v.id("assets"),
		patch: v.object(partial(schema.tables.assets.validator.fields)),
	},
	handler: async (ctx, args) => {
		const userId = await ensureAuthUserId(ctx)

		const asset = await ctx.db.get(args.id)
		if (!asset) {
			throw new Error("Asset not found")
		}

		if (asset.ownerId !== userId) {
			throw new Error("You don't have permission to update this asset")
		}

		await ctx.db.patch(args.id, args.patch)

		return args.id
	},
})

export const remove = mutation({
	args: { id: v.id("assets") },
	handler: async (ctx, args) => {
		const userId = await ensureAuthUserId(ctx)

		const asset = await ctx.db.get(args.id)
		if (!asset) {
			throw new Error("Asset not found")
		}

		if (asset.ownerId !== userId) {
			throw new Error("You don't have permission to delete this asset")
		}

		// this can only fail if the file doesn't exist,
		// but we'll warn just in case
		if (asset.image?.fileId) {
			try {
				await ctx.storage.delete(asset.image.fileId)
			} catch (error) {
				console.warn("Failed to delete asset file", asset, error)
			}
		}

		await ctx.db.delete(args.id)
	},
})

export const removeMany = mutation({
	args: { ids: v.array(v.id("assets")) },
	handler: async (ctx, args) => {
		const userId = await ensureAuthUserId(ctx)

		const results = await Promise.allSettled(
			args.ids.map(async (id) => {
				const asset = await ctx.db.get(id)
				if (!asset) {
					throw new ConvexError({
						message: "Not found",
						id,
					})
				}

				if (asset.ownerId !== userId) {
					throw new ConvexError({
						message: `You don't have permission to do that.`,
						id,
					})
				}

				// this can only fail if the file doesn't exist,
				// but we'll warn just in case
				if (asset.image?.fileId) {
					try {
						await ctx.storage.delete(asset.image.fileId)
					} catch (error) {
						console.warn("Failed to delete asset file", asset, error)
					}
				}

				await ctx.db.delete(id)
			}),
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

export type ClientAsset = Awaited<ReturnType<typeof makeClientAsset>>
async function makeClientAsset(
	ctx: QueryCtx,
	asset: Doc<"assets">,
	userId: Id<"users">,
) {
	return {
		...asset,
		isOwner: asset.ownerId === userId,
		image: asset.image && {
			...asset.image,
			imageUrl: await getAssetImageUrl(ctx, asset._id),
		},
		scene: asset.scene && {
			...asset.scene,
			backgroundUrl:
				asset.scene?.backgroundId &&
				(await getAssetImageUrl(ctx, asset.scene.backgroundId)),
		},
		actor: asset.actor && {
			...asset.actor,
			imageUrl:
				asset.actor?.imageId &&
				(await getAssetImageUrl(ctx, asset.actor.imageId)),
		},
	}
}

async function getAssetImageUrl(ctx: QueryCtx, assetId: Id<"assets">) {
	const asset = await ctx.db.get(assetId)
	if (!asset?.image?.fileId) return

	return await ctx.storage.getUrl(asset.image.fileId)
}
