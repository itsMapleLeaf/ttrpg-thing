import { getAuthUserId } from "@convex-dev/auth/server"
import { ConvexError, type Infer, v } from "convex/values"
import { omit } from "convex-helpers"
import { literals, partial } from "convex-helpers/validators"
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

export type SurfaceListOrder = Infer<typeof surfaceListOrderValidator>
const surfaceListOrderValidator = literals("alphabetical", "newestFirst")

export const list = query({
	args: {
		roomId: v.id("rooms"),
		searchTerm: v.optional(v.string()),
		order: v.optional(surfaceListOrderValidator),
	},
	handler: async (ctx, { roomId, searchTerm, order }) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) return []

		// surfaces in rooms are public for now
		// const room = await ctx.db.get(roomId)
		// if (!room || room.ownerId !== userId) return []

		let query
		query = ctx.db.query("surfaces")

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

		const surfaces = await query.collect()

		return await Promise.all(
			surfaces.map((surface) => makeClientSurface(ctx, surface, userId)),
		)
	},
})

export const get = query({
	args: { id: v.id("surfaces") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) {
			return null
		}

		const surface = await ctx.db.get(args.id)
		if (!surface) {
			return null
		}

		// surfaces in rooms are public for now
		// const room = await ctx.db.get(surface.roomId)
		// if (!room || room.ownerId !== userId) {
		// 	return null
		// }

		return await makeClientSurface(ctx, surface, userId)
	},
})

export const create = mutation({
	args: {
		...omit(schema.tables.surfaces.validator.fields, ["ownerId"]),
	},
	handler: async (ctx, args) => {
		const userId = await ensureAuthUserId(ctx)

		// for now, all users can add surfaces
		// if (room.ownerId !== userId) {
		// 	throw new Error("You don't have permission to add surfaces to this room")
		// }

		const surfaceId = await ctx.db.insert("surfaces", {
			...args,
			ownerId: userId,
		})

		return surfaceId
	},
})

export const update = mutation({
	args: {
		id: v.id("surfaces"),
		patch: v.object(partial(schema.tables.surfaces.validator.fields)),
	},
	handler: async (ctx, args) => {
		const userId = await ensureAuthUserId(ctx)

		const surface = await ctx.db.get(args.id)
		if (!surface) {
			throw new Error("Surface not found")
		}

		if (surface.ownerId !== userId) {
			throw new Error("You don't have permission to update this surface")
		}

		await ctx.db.patch(args.id, args.patch)

		return args.id
	},
})

export const remove = mutation({
	args: { id: v.id("surfaces") },
	handler: async (ctx, args) => {
		await removeSurface(ctx, args.id)
	},
})

export const removeMany = mutation({
	args: { ids: v.array(v.id("surfaces")) },
	handler: async (ctx, args) => {
		const results = await Promise.allSettled(
			args.ids.map(async (id) => removeSurface(ctx, id)),
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

export type ClientSurface = Awaited<ReturnType<typeof makeClientSurface>>
export async function makeClientSurface(
	ctx: QueryCtx,
	surface: Doc<"surfaces">,
	userId: Id<"users">,
) {
	const room = await ctx.db.get(surface.roomId)
	return {
		...surface,
		isOwner: surface.ownerId === userId,
		isCurrent: room?.currentSurfaceId === surface._id,
		backgroundUrl:
			surface.backgroundId &&
			(await getAssetImageUrl(ctx, surface.backgroundId)),
	}
}

async function removeSurface(ctx: MutationCtx, id: Id<"surfaces">) {
	const userId = await ensureAuthUserId(ctx)

	const surface = await ctx.db.get(id)
	if (!surface) {
		throw new ConvexError({ message: "Not found", id })
	}

	if (surface.ownerId !== userId) {
		throw new ConvexError({
			message: `You don't have permission to do that.`,
			id,
		})
	}

	for await (const tile of ctx.db
		.query("tiles")
		.withIndex("by_surface", (q) => q.eq("surfaceId", id))) {
		await ctx.db.delete(tile._id)
	}

	await ctx.db.delete(id)
}
