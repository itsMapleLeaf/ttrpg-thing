import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"
import { nullable } from "convex-helpers/validators"

export default defineSchema({
	...authTables,

	users: defineTable({
		...authTables.users.validator.fields,
		name: v.string(),
		email: v.string(),
		imageId: v.optional(nullable(v.id("_storage"))),
	}).index("by_email", ["email"]),

	rooms: defineTable({
		name: v.string(),
		slug: v.string(),
		ownerId: v.id("users"),
		currentSurfaceId: v.optional(nullable(v.id("surfaces"))),
	})
		.index("by_owner", ["ownerId"])
		.index("by_slug", ["slug"]),

	assets: defineTable({
		name: v.string(),
		roomId: v.id("rooms"),
		ownerId: v.id("users"),
		fileId: v.id("_storage"),
	})
		.index("by_room", ["roomId"])
		.index("by_room_and_name", ["roomId", "name"])
		.searchIndex("search_by_name", {
			searchField: "name",
			filterFields: ["roomId"],
		}),

	surfaces: defineTable({
		name: v.string(),
		backgroundId: v.optional(nullable(v.id("assets"))),
		roomId: v.id("rooms"),
		ownerId: v.id("users"),
	})
		.index("by_room", ["roomId"])
		.index("by_room_and_name", ["roomId", "name"])
		.searchIndex("search_by_name", {
			searchField: "name",
			filterFields: ["roomId", "ownerId"],
		}),

	tiles: defineTable({
		surfaceId: v.id("surfaces"),
		ownerId: v.id("users"),
		type: v.string(),
		left: v.number(),
		top: v.number(),
		width: v.number(),
		height: v.number(),
		assetId: v.optional(nullable(v.id("assets"))),
		lastMovedAt: v.optional(v.number()),
		order: v.optional(v.number()),
		text: v.optional(v.string()),
	}).index("by_surface", ["surfaceId"]),
})
