import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
	plugins: [
		tailwindcss(),
		tanstackStart({
			customViteReactPlugin: true,
		}),
		react(),
	],
	server: {
		watch: {
			ignored: (path) => path.includes(".tsbuildinfo"),
		},
	},
})
