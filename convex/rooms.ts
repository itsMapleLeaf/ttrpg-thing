import { v } from "convex/values"
import { omit } from "convex-helpers"
import { partial } from "convex-helpers/validators"
import { spaceSlug } from "space-slug"
import type { Doc } from "./_generated/dataModel.js"
import { mutation, type QueryCtx, query } from "./_generated/server.js"
import schema from "./schema.js"

export type ClientRoom = Awaited<ReturnType<typeof createClientRoom>>
async function createClientRoom(ctx: QueryCtx, room: Doc<"rooms">) {
	const backgroundImageUrl =
		room.backgroundImageId && (await ctx.storage.getUrl(room.backgroundImageId))
	return {
		...room,
		backgroundImageUrl,
	}
}

export const getBySlug = query({
	args: {
		slug: v.string(),
	},
	async handler(ctx, args) {
		const room = await ctx.db
			.query("rooms")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.unique()
		return room && createClientRoom(ctx, room)
	},
})

export const create = mutation({
	args: omit(schema.tables.rooms.validator.fields, ["slug"]),
	async handler(ctx, args) {
		const slug = spaceSlug()
		const id = await ctx.db.insert("rooms", { ...args, slug })
		return { id, slug }
	},
})

export const update = mutation({
	args: {
		id: v.id("rooms"),
		data: v.object(partial(schema.tables.rooms.validator.fields)),
	},
	async handler(ctx, { id, data }) {
		await ctx.db.patch(id, data)
	},
})

export { delete_ as delete }
const delete_ = mutation({
	args: { id: v.id("rooms") },
	async handler(ctx, { id }) {
		await ctx.db.delete(id)
	},
})
