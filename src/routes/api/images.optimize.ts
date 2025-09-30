import { createFileRoute } from "@tanstack/react-router"
import { type } from "arktype"
import { LRUCache } from "lru-cache"
import sharp from "sharp"

export const Route = createFileRoute("/api/images/optimize")({
	server: {
		handlers: {
			GET: async (ctx) => {
				try {
					const result = await cache.fetch(ctx.request.url)
					return new Response(result, {
						headers: {
							"Content-Type": "image/webp",
							"Cache-Control": "public, max-age=31536000, immutable",
						},
					})
				} catch (error) {
					console.error("Error resizing image:", error)
					return new Response("", { status: 500 })
				}
			},
		},
	},
})

const ResizeImageArgs = type({
	url: "string",
	width: "string.integer.parse",
})

const cache = new LRUCache({
	max: 100,
	fetchMethod: async (input: string) => {
		const url = new URL(input)

		const args = ResizeImageArgs.assert({
			url: url.searchParams.get("url"),
			width: url.searchParams.get("width"),
		})

		const imageResponse = await fetch(args.url)
		if (!imageResponse.ok) {
			throw new Error(`Failed to fetch image: ${imageResponse.statusText}`)
		}

		const image = sharp(await imageResponse.arrayBuffer())

		const meta = await image.metadata()

		const resized = await image
			.webp({ quality: 100 })
			.resize(
				meta.width > meta.height
					? { height: args.width }
					: { width: args.width },
			)
			.toBuffer()

		return new Uint8Array(resized)
	},
})
