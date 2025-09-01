import { createFileRoute } from "@tanstack/react-router"
import { SidebarLayout } from "../../components/sidebar/SidebarLayout.tsx"

export const Route = createFileRoute("/_protected/template-builder")({
	component: SheetBuilder,
})

function SheetBuilder() {
	return (
		<SidebarLayout>
			<div className="container mx-auto grid h-full max-w-2xl content-center p-6">
				<main className="grid gap-3 panel p-3">test</main>
			</div>
		</SidebarLayout>
	)
}
