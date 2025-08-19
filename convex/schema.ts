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
	})
		.index("by_owner", ["ownerId"])
		.index("by_slug", ["slug"]),

	assets: defineTable({
		name: v.string(),
		roomId: v.id("rooms"),
		ownerId: v.id("users"),
		fileId: v.optional(nullable(v.id("_storage"))),
		data: v.optional(v.record(v.string(), v.any())),
	})
		.index("by_room", ["roomId"])
		.index("by_room_and_name", ["roomId", "name"])
		.searchIndex("search_by_name", {
			searchField: "name",
			filterFields: ["roomId"],
		}),

	scenes: defineTable({
		name: v.string(),
		roomId: v.id("rooms"),
		ownerId: v.id("users"),
		backgroundAssetId: v.optional(nullable(v.id("assets"))),
	})
		.index("by_room", ["roomId"])
		.index("by_room_and_name", ["roomId", "name"])
		.searchIndex("search_by_name", {
			searchField: "name",
			filterFields: ["roomId"],
		}),

	actors: defineTable({
		sceneId: v.id("rooms"),
		ownerId: v.id("users"),
		assetId: v.id("assets"),
		left: v.number(),
		top: v.number(),
		width: v.number(),
		height: v.number(),
		locked: v.optional(v.boolean()),
	}).index("by_scene", ["sceneId"]),
})
