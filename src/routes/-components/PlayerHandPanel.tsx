export function PlayerHandPanel() {
	return (
		<div className="flex h-36 gap-2 panel overflow-visible bg-gray-900/50 p-2 backdrop-blur">
			{Array.from({ length: 5 }).map((_, i) => (
				<div
					key={i}
					className="aspect-[3/5] rounded bg-white/10 p-2 transition-transform hover:-translate-y-0.5 hover:shadow-lg"
				/>
			))}
		</div>
	)
}
