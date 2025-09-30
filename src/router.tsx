import { ConvexAuthProvider } from "@convex-dev/auth/react"

import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { ConvexReactClient } from "convex/react"
import { routeTree } from "./routeTree.gen"

export function getRouter() {
	const convexClient = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

	const router = createTanStackRouter({
		routeTree,
		defaultPreload: "intent",
		context: {
			convexClient,
		},
		scrollRestoration: true,
		defaultErrorComponent: (err) => <p>{err.error.stack}</p>,
		defaultNotFoundComponent: () => <p>not found</p>,
		Wrap: ({ children }) => (
			<ConvexAuthProvider client={convexClient}>{children}</ConvexAuthProvider>
		),
	})

	return router
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>
	}
}
