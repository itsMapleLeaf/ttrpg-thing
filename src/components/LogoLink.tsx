import { Link, useNavigate } from "@tanstack/react-router"

export function LogoLink() {
	const navigate = useNavigate()
	return (
		<Link
			to="/"
			className="text-xl opacity-75 transition-opacity hover:opacity-100"
			onContextMenu={(event) => {
				event.preventDefault()
				navigate({ to: "/ds" })
			}}
		>
			<span className="font-medium text-primary-400">tabletop</span>
			<span className="text-gray-200">thing</span>
		</Link>
	)
}
