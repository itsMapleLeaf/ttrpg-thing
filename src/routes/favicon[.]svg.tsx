import { loadIcon } from "@iconify/react"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/favicon.svg")({
	server: {
		handlers: {
			GET: async () => {
				const icon = await loadIcon("mingcute:classify-2-fill")
				return new Response(
					/* HTML */ `
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							style="color:white"
						>
							${icon.body}
						</svg>
					`,
					{
						headers: {
							"Content-Type": "image/svg+xml",
							"Cache-Control": "public, max-age=31536000, immutable",
						},
					},
				)
			},
		},
	},
})
