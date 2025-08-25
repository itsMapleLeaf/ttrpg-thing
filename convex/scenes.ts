import { getAuthUserId } from "@convex-dev/auth/server"
import { ConvexError, type Infer, v } from "convex/values"
import { omit } from "convex-helpers"
import { literals, partial } from "convex-helpers/validators"
import type { Doc, Id } from "./_generated/dataModel"
import { mutation, type QueryCtx, query } from "./_generated/server"
import { ensureAuthUserId } from "./auth.ts"
import schema from "./schema.ts"

export type SceneListOrder = Infer<typeof sceneListOrderValidator>
const sceneListOrderValidator = literals("alphabetical", "newestFirst")

export const list = query({
	args: {
		roomId: v.id("rooms"),
		searchTerm: v.optional(v.string()),
		order: v.optional(sceneListOrderValidator),
	},
	handler: async (ctx, { roomId, searchTerm, order }) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) return []

		let query
		query = ctx.db.query("scenes")

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
				.order("desc")
		}

		const scenes = await query.collect()

		return await Promise.all(
			scenes.map((scene) => makeClientScene(ctx, scene, userId)),
		)
	},
})

export const get = query({
	args: { id: v.id("scenes") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) {
			return null
		}

		const scene = await ctx.db.get(args.id)
		if (!scene) {
			return null
		}

		return await makeClientScene(ctx, scene, userId)
	},
})

export const create = mutation({
	args: {
		...omit(schema.tables.scenes.validator.fields, ["ownerId"]),
	},
	handler: async (ctx, args) => {
		const userId = await ensureAuthUserId(ctx)

		const sceneId = await ctx.db.insert("scenes", {
			...args,
			ownerId: userId,
		})

		return sceneId
	},
})

export const update = mutation({
	args: {
		id: v.id("scenes"),
		patch: v.object(partial(schema.tables.scenes.validator.fields)),
	},
	handler: async (ctx, args) => {
		const userId = await ensureAuthUserId(ctx)

		const scene = await ctx.db.get(args.id)
		if (!scene) {
			throw new Error("Scene not found")
		}

		if (scene.ownerId !== userId) {
			throw new Error("You don't have permission to update this scene")
		}

		await ctx.db.patch(args.id, args.patch)

		return args.id
	},
})

export const remove = mutation({
	args: { id: v.id("scenes") },
	handler: async (ctx, args) => {
		const userId = await ensureAuthUserId(ctx)

		const scene = await ctx.db.get(args.id)
		if (!scene) {
			throw new Error("Scene not found")
		}

		if (scene.ownerId !== userId) {
			throw new Error("You don't have permission to delete this scene")
		}

		await ctx.db.delete(args.id)
	},
})

export const removeMany = mutation({
	args: { ids: v.array(v.id("scenes")) },
	handler: async (ctx, args) => {
		const userId = await ensureAuthUserId(ctx)

		const results = await Promise.allSettled(
			args.ids.map(async (id) => {
				const scene = await ctx.db.get(id)
				if (!scene) {
					throw new ConvexError({
						message: "Not found",
						id,
					})
				}

				if (scene.ownerId !== userId) {
					throw new ConvexError({
						message: `You don't have permission to do that.`,
						id,
					})
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

export type ClientScene = Awaited<ReturnType<typeof makeClientScene>>
async function makeClientScene(
	ctx: QueryCtx,
	scene: Doc<"scenes">,
	userId: Id<"users">,
) {
	let backgroundUrl: string | undefined
	if (scene.backgroundId) {
		const backgroundAsset = await ctx.db.get(scene.backgroundId)
		if (backgroundAsset?.fileId) {
			backgroundUrl =
				(await ctx.storage.getUrl(backgroundAsset.fileId)) ?? undefined
		}
	}

	return {
		...scene,
		isOwner: scene.ownerId === userId,
		backgroundUrl,
	}
}
