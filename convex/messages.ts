import { ConvexError, v } from "convex/values"
import { partial } from "convex-helpers/validators"
import { mutation, query } from "./_generated/server.js"
import { handleRollCommand } from "./dice.js"
import schema from "./schema.js"

export const list = query({
	async handler(ctx) {
		return await ctx.db.query("messages").collect()
	},
})

export const create = mutation({
	args: schema.tables.messages.validator.fields,
	async handler(ctx, args) {
		const text = args.text.trim()
		if (text.length === 0) {
			throw new ConvexError("Message text cannot be empty")
		}

		if (text.length > 500) {
			throw new ConvexError("Message text cannot exceed 500 characters")
		}

		if (args.sender.length > 100) {
			throw new ConvexError("Sender name cannot exceed 100 characters")
		}

		if (text.startsWith("/roll")) {
			const { summary } = handleRollCommand(text.slice(5).trim().split(/\s+/))
			return ctx.db.insert("messages", {
				sender: args.sender,
				text: summary,
			})
		}

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

export { delete_ as delete }
const delete_ = mutation({
	args: { id: v.id("messages") },
	async handler(ctx, { id }) {
		await ctx.db.delete(id)
	},
})
