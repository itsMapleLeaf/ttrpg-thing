import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"
import { literals, nullable } from "convex-helpers/validators"

export const assetTypeValidator = literals("image", "scene", "actor")

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

	scenes: defineTable({
		name: v.string(),
		roomId: v.id("rooms"),
		ownerId: v.id("users"),
		backgroundId: v.optional(v.id("assets")),
	})
		.index("by_room", ["roomId"])
		.index("by_room_and_name", ["roomId", "name"])
		.searchIndex("search_by_name", {
			searchField: "name",
			filterFields: ["roomId"],
		}),

	actors: defineTable({
		name: v.string(),
		roomId: v.id("rooms"),
		ownerId: v.id("users"),
		assetId: v.optional(v.id("assets")),
	})
		.index("by_room", ["roomId"])
		.index("by_room_and_name", ["roomId", "name"])
		.searchIndex("search_by_name", {
			searchField: "name",
			filterFields: ["roomId"],
		}),

	sceneActors: defineTable({
		sceneId: v.id("assets"),
		actorId: v.id("assets"),
		left: v.number(),
		top: v.number(),
		width: v.number(),
		height: v.number(),
	})
		.index("by_scene", ["sceneId"])
		.index("by_actor", ["actorId"])
		.index("by_scene_and_actor", ["sceneId", "actorId"]),
})
