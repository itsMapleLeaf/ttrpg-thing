import { ConvexAuthProvider } from "@convex-dev/auth/react"

import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { ConvexReactClient } from "convex/react"
import { Suspense } from "react"
import { Loading } from "./components/Loading.tsx"
import { routeTree } from "./routeTree.gen"

export function createRouter() {
	const convexClient = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

	const router = createTanStackRouter({
		routeTree,
		defaultPreload: "intent",
		context: {
			convexClient,
		},
		scrollRestoration: true,
		defaultPreloadStaleTime: 0, // Let React Query handle all caching
		defaultErrorComponent: (err) => <p>{err.error.stack}</p>,
		defaultNotFoundComponent: () => <p>not found</p>,
		Wrap: ({ children }) => (
			<ConvexAuthProvider client={convexClient}>
				<Suspense fallback={<Loading />}>{children}</Suspense>
			</ConvexAuthProvider>
		),
	})

	return router
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof createRouter>
	}
}
