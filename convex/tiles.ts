import { type Infer, v } from "convex/values"
import { partial } from "convex-helpers/validators"
import type { Doc } from "./_generated/dataModel.js"
import { mutation, query } from "./_generated/server.js"
import schema from "./schema.js"

export type ClientTile = Doc<"tiles"> & {
	imageUrl: string | null
}

export const list = query({
	args: {
		roomId: v.id("rooms"),
	},
	async handler(ctx, args): Promise<ClientTile[]> {
		return await Array.fromAsync(
			ctx.db
				.query("tiles")
				.withIndex("by_room", (q) => q.eq("roomId", args.roomId)),
			async (tile) => {
				const imageUrl = await ctx.storage.getUrl(tile.imageId)
				return { ...tile, imageUrl }
			},
		)
	},
})

export type CreateManyInput = Infer<typeof createManyInputValidator>
const createManyInputValidator = v.object(schema.tables.tiles.validator.fields)

export const createMany = mutation({
	args: {
		items: v.array(createManyInputValidator),
	},
	async handler(ctx, args) {
		return Promise.all(args.items.map((item) => ctx.db.insert("tiles", item)))
	},
})

export const updateMany = mutation({
	args: {
		items: v.array(
			v.object({
				id: v.id("tiles"),
				data: v.object(partial(schema.tables.tiles.validator.fields)),
			}),
		),
	},
	async handler(ctx, args) {
		await Promise.all(
			args.items.map((item) => ctx.db.patch(item.id, item.data)),
		)
	},
})

export const deleteMany = mutation({
	args: {
		ids: v.array(v.id("tiles")),
	},
	async handler(ctx, args) {
		await Promise.all(args.ids.map((id) => ctx.db.delete(id)))
	},
})
