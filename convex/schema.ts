import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
	...authTables,
	rooms: defineTable({
		name: v.string(),
		slug: v.string(),
		ownerId: v.id("users"),
	})
		.index("by_owner", ["ownerId"])
		.index("by_slug", ["slug"]),
})
