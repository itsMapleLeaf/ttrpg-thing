import fontCss from "@fontsource-variable/quicksand?url"
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router"
import type { ConvexReactClient } from "convex/react"
import * as React from "react"
import appCss from "../styles/app.css?url"
import { Loading } from "../ui/Loading.tsx"
import { ToastProvider } from "../ui/Toast.tsx"
import { UserProvider } from "../user-context.tsx"

export const Route = createRootRouteWithContext<{
	convexClient: ConvexReactClient
}>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "tabletop thing" },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "stylesheet", href: fontCss },
			{ rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
			{ rel: "icon", href: "/favicon.svg" },
		],
	}),
	notFoundComponent: () => <div>Route not found</div>,
	component: RootComponent,
})

function RootComponent() {
	return (
		<html lang="en" className="bg-gray-900 wrap-break-word text-gray-50">
			<head>
				<HeadContent />
			</head>
			<body>
				<UserProvider>
					<ToastProvider>
						<React.Suspense fallback={<Loading />}>
							<Outlet />
						</React.Suspense>
					</ToastProvider>
				</UserProvider>
				<Scripts />
			</body>
		</html>
	)
}
