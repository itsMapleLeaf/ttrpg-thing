import { createServerFileRoute } from "@tanstack/react-start/server"
import { type } from "arktype"
import sharp from "sharp"

const ServerRouteArgs = type({
	url: "string",
	width: "string.integer.parse",
})

export const ServerRoute = createServerFileRoute("/api/resize-image").methods({
	GET: async (ctx) => {
		try {
			const url = new URL(ctx.request.url)

			const args = ServerRouteArgs.assert({
				url: url.searchParams.get("url"),
				width: url.searchParams.get("width"),
			})

			const imageResponse = await fetch(args.url)
			if (!imageResponse.ok) {
				throw new Error(`Failed to fetch image: ${imageResponse.statusText}`)
			}

			const resized = await sharp(await imageResponse.arrayBuffer())
				.webp({ quality: 100 })
				.resize(args.width)
				.toBuffer()

			return new Response(new Uint8Array(resized), {
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
})
