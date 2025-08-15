import { ConvexAuthProvider } from "@convex-dev/auth/react"
import { ConvexQueryClient } from "@convex-dev/react-query"
import { QueryClient } from "@tanstack/react-query"
import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { routerWithQueryClient } from "@tanstack/react-router-with-query"
import { routeTree } from "./routeTree.gen"

export function createRouter() {
	const CONVEX_URL = import.meta.env.VITE_CONVEX_URL
	if (!CONVEX_URL) {
		console.error("missing envar CONVEX_URL")
	}
	const convexQueryClient = new ConvexQueryClient(CONVEX_URL)

	const queryClient: QueryClient = new QueryClient({
		defaultOptions: {
			queries: {
				queryKeyHashFn: convexQueryClient.hashFn(),
				queryFn: convexQueryClient.queryFn(),
				gcTime: 5000,
			},
		},
	})
	convexQueryClient.connect(queryClient)

	const router = routerWithQueryClient(
		createTanStackRouter({
			routeTree,
			defaultPreload: "intent",
			context: { queryClient },
			scrollRestoration: true,
			defaultPreloadStaleTime: 0, // Let React Query handle all caching
			defaultErrorComponent: (err) => <p>{err.error.stack}</p>,
			defaultNotFoundComponent: () => <p>not found</p>,
			Wrap: ({ children }) => (
				<ConvexAuthProvider client={convexQueryClient.convexClient}>
					{children}
				</ConvexAuthProvider>
			),
		}),
		queryClient,
	)

	return router
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof createRouter>
	}
}
