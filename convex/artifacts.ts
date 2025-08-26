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
import { ensureAuthUserId } from "./auth.ts"
import schema from "./schema.ts"

export type ArtifactListOrder = Infer<typeof artifactListOrderValidator>
const artifactListOrderValidator = literals("alphabetical", "newestFirst")

export const list = query({
	args: {
		roomId: v.id("rooms"),
		searchTerm: v.optional(v.string()),
		order: v.optional(artifactListOrderValidator),
	},
	handler: async (ctx, { roomId, searchTerm, order }) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) return []

		// artifacts in rooms are public for now
		// const room = await ctx.db.get(roomId)
		// if (!room || room.ownerId !== userId) return []

		let query
		query = ctx.db.query("artifacts")

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

		const artifacts = await query.collect()

		return await Promise.all(
			artifacts.map((artifact) => makeClientArtifact(ctx, artifact, userId)),
		)
	},
})

export const get = query({
	args: { id: v.id("artifacts") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) {
			return null
		}

		const artifact = await ctx.db.get(args.id)
		if (!artifact) {
			return null
		}

		// artifacts in rooms are public for now
		// const room = await ctx.db.get(artifact.roomId)
		// if (!room || room.ownerId !== userId) {
		// 	return null
		// }

		return await makeClientArtifact(ctx, artifact, userId)
	},
})

export const create = mutation({
	args: {
		...omit(schema.tables.artifacts.validator.fields, ["ownerId"]),
	},
	handler: async (ctx, args) => {
		const userId = await ensureAuthUserId(ctx)

		// for now, all users can add artifacts
		// if (room.ownerId !== userId) {
		// 	throw new Error("You don't have permission to add artifacts to this room")
		// }

		const artifactId = await ctx.db.insert("artifacts", {
			...args,
			ownerId: userId,
		})

		return artifactId
	},
})

export const update = mutation({
	args: {
		id: v.id("artifacts"),
		patch: v.object(partial(schema.tables.artifacts.validator.fields)),
	},
	handler: async (ctx, args) => {
		const userId = await ensureAuthUserId(ctx)

		const artifact = await ctx.db.get(args.id)
		if (!artifact) {
			throw new Error("Artifact not found")
		}

		if (artifact.ownerId !== userId) {
			throw new Error("You don't have permission to update this artifact")
		}

		await ctx.db.patch(args.id, args.patch)

		return args.id
	},
})

export const remove = mutation({
	args: { id: v.id("artifacts") },
	handler: async (ctx, args) => {
		await removeArtifact(ctx, args.id)
	},
})

export const removeMany = mutation({
	args: { ids: v.array(v.id("artifacts")) },
	handler: async (ctx, args) => {
		const results = await Promise.allSettled(
			args.ids.map(async (id) => removeArtifact(ctx, id)),
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

export type ClientArtifact = Awaited<ReturnType<typeof makeClientArtifact>>
async function makeClientArtifact(
	_ctx: QueryCtx,
	artifact: Doc<"artifacts">,
	userId: Id<"users">,
) {
	return {
		...artifact,
		isOwner: artifact.ownerId === userId,
	}
}

async function removeArtifact(ctx: MutationCtx, id: Id<"artifacts">) {
	const userId = await ensureAuthUserId(ctx)

	const artifact = await ctx.db.get(id)
	if (!artifact) {
		throw new ConvexError({ message: "Not found", id })
	}

	if (artifact.ownerId !== userId) {
		throw new ConvexError({
			message: `You don't have permission to do that.`,
			id,
		})
	}

	await ctx.db.delete(id)
}
