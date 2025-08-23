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
		type: assetTypeValidator,
		image: v.optional(
			v.object({
				key: v.string(),
				fileId: v.id("_storage"),
			}),
		),
		scene: v.optional(
			v.object({
				key: v.string(),
				backgroundId: v.optional(v.id("assets")),
			}),
		),
		actor: v.optional(
			v.object({
				key: v.string(),
				imageId: v.id("assets"),
				left: v.number(),
				top: v.number(),
				width: v.number(),
				height: v.number(),
				locked: v.optional(v.boolean()),
			}),
		),
	})
		.index("by_room", ["roomId"])
		.index("by_room_and_name", ["roomId", "name"])
		.index("by_image_key", ["image.key"])
		.index("by_scene_key", ["scene.key"])
		.index("by_actor_key", ["actor.key"])
		.searchIndex("search_by_name", {
			searchField: "name",
			filterFields: ["roomId", "type"],
		}),
})
