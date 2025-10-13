import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"
import { nullable } from "convex-helpers/validators"

export const vectorValidator = v.object({
	x: v.number(),
	y: v.number(),
})

export default defineSchema({
	...authTables,

	users: defineTable({
		...authTables.users.validator.fields,
		name: v.string(),
		email: v.string(),
		imageId: v.optional(nullable(v.id("_storage"))),
	}).index("by_email", ["email"]),

	rooms: defineTable({
		slug: v.string(),
		backgroundImageId: v.optional(nullable(v.id("_storage"))),
	}).index("by_slug", ["slug"]),

	messages: defineTable({
		sender: v.string(), // will be a userId later
		text: v.string(),
		roomId: v.id("rooms"),
	}).index("by_room", ["roomId"]),

	tiles: defineTable({
		position: vectorValidator,
		size: vectorValidator,
		orderTime: v.number(),
		orderIndex: v.number(),
		imageId: v.id("_storage"),
		roomId: v.id("rooms"),
	}).index("by_room", ["roomId"]),
})
