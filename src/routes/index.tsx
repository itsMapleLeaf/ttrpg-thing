import { createFileRoute } from "@tanstack/react-router"
import { useMutation } from "convex/react"
import { api } from "../../convex/_generated/api.js"
import { Button } from "../ui/Button.tsx"

export const Route = createFileRoute("/")({
	component: RouteComponent,
})

function RouteComponent() {
	const createRoom = useMutation(api.rooms.create)
	const navigate = Route.useNavigate()

	const submit = async () => {
		const { slug } = await createRoom({})
		await navigate({ to: "/rooms/$room", params: { room: slug } })
	}

	return (
		<form action={submit}>
			<Button type="submit" icon="mingcute:classify-add-2-fill">
				New Room
			</Button>
		</form>
	)
}
