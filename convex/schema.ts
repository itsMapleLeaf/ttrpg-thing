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
		currentSceneKey: v.optional(nullable(v.string())),
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

	artifacts: defineTable({
		name: v.string(),
		type: v.string(),
		data: v.optional(v.record(v.string(), v.any())),
		roomId: v.id("rooms"),
		ownerId: v.id("users"),
	})
		.index("by_room", ["roomId"])
		.index("by_room_and_name", ["roomId", "name"])
		.searchIndex("search_by_name", {
			searchField: "name",
			filterFields: ["roomId", "type", "ownerId"],
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

	surfaceArtifacts: defineTable({
		surfaceId: v.id("surfaces"),
		artifactId: v.id("artifacts"),
		left: v.number(),
		top: v.number(),
		width: v.number(),
		height: v.number(),
		roomId: v.id("rooms"),
		ownerId: v.id("users"),
	}).index("roomId_surfaceId", ["roomId", "surfaceId"]),
})
