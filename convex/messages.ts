import { v } from "convex/values"
import { partial } from "convex-helpers/validators"
import { mutation, query } from "./_generated/server.js"
import schema from "./schema.js"

export const list = query({
	async handler(ctx) {
		return await ctx.db.query("messages").collect()
	},
})

export const create = mutation({
	args: schema.tables.messages.validator.fields,
	async handler(ctx, args) {
		return await ctx.db.insert("messages", args)
	},
})

export const update = mutation({
	args: {
		id: v.id("messages"),
		data: v.object(partial(schema.tables.messages.validator.fields)),
	},
	async handler(ctx, { id, data }) {
		return await ctx.db.patch(id, data)
	},
})

export const remove = mutation({
	args: { id: v.id("messages") },
	async handler(ctx, { id }) {
		await ctx.db.delete(id)
	},
})
