import { getAuthUserId } from "@convex-dev/auth/server"
import { ConvexError, type Infer, v } from "convex/values"
import { omit } from "convex-helpers"
import { literals, partial } from "convex-helpers/validators"
import type { Doc, Id } from "./_generated/dataModel"
import { mutation, type QueryCtx, query } from "./_generated/server"
import { ensureAuthUserId } from "./auth.ts"
import schema from "./schema.ts"

export type ActorListOrder = Infer<typeof actorListOrderValidator>
const actorListOrderValidator = literals("alphabetical", "newestFirst")

export const list = query({
	args: {
		roomId: v.id("rooms"),
		searchTerm: v.optional(v.string()),
		order: v.optional(actorListOrderValidator),
	},
	handler: async (ctx, { roomId, searchTerm, order }) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) return []

		let query
		query = ctx.db.query("actors")

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

		const actors = await query.collect()

		return await Promise.all(
			actors.map((actor) => makeClientActor(ctx, actor, userId)),
		)
	},
})

export const get = query({
	args: { id: v.id("actors") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) {
			return null
		}

		const actor = await ctx.db.get(args.id)
		if (!actor) {
			return null
		}

		return await makeClientActor(ctx, actor, userId)
	},
})

export const create = mutation({
	args: {
		...omit(schema.tables.actors.validator.fields, ["ownerId"]),
	},
	handler: async (ctx, args) => {
		const userId = await ensureAuthUserId(ctx)

		const actorId = await ctx.db.insert("actors", {
			...args,
			ownerId: userId,
		})

		return actorId
	},
})

export const update = mutation({
	args: {
		id: v.id("actors"),
		patch: v.object(partial(schema.tables.actors.validator.fields)),
	},
	handler: async (ctx, args) => {
		const userId = await ensureAuthUserId(ctx)

		const actor = await ctx.db.get(args.id)
		if (!actor) {
			throw new Error("Actor not found")
		}

		if (actor.ownerId !== userId) {
			throw new Error("You don't have permission to update this actor")
		}

		await ctx.db.patch(args.id, args.patch)

		return args.id
	},
})

export const remove = mutation({
	args: { id: v.id("actors") },
	handler: async (ctx, args) => {
		const userId = await ensureAuthUserId(ctx)

		const actor = await ctx.db.get(args.id)
		if (!actor) {
			throw new Error("Actor not found")
		}

		if (actor.ownerId !== userId) {
			throw new Error("You don't have permission to delete this actor")
		}

		await ctx.db.delete(args.id)
	},
})

export const removeMany = mutation({
	args: { ids: v.array(v.id("actors")) },
	handler: async (ctx, args) => {
		const userId = await ensureAuthUserId(ctx)

		const results = await Promise.allSettled(
			args.ids.map(async (id) => {
				const actor = await ctx.db.get(id)
				if (!actor) {
					throw new ConvexError({
						message: "Not found",
						id,
					})
				}

				if (actor.ownerId !== userId) {
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

export type ClientActor = Awaited<ReturnType<typeof makeClientActor>>
async function makeClientActor(
	ctx: QueryCtx,
	actor: Doc<"actors">,
	userId: Id<"users">,
) {
	let imageUrl: string | undefined
	if (actor.assetId) {
		const asset = await ctx.db.get(actor.assetId)
		if (asset?.fileId) {
			imageUrl = (await ctx.storage.getUrl(asset.fileId)) ?? undefined
		}
	}

	return {
		...actor,
		isOwner: actor.ownerId === userId,
		imageUrl,
	}
}
