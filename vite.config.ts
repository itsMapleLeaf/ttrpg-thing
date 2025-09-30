import netlify from "@netlify/vite-plugin-tanstack-start"
import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
	plugins: [
		tailwindcss(),
		tanstackStart({
			router: { quoteStyle: "double" },
		}),
		netlify(),
		react(),
	],
	server: {
		watch: {
			ignored: (path) => path.includes(".tsbuildinfo"),
		},
	},
})
