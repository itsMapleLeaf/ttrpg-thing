import { Icon } from "../../ui/Icon.tsx"

export function PlayerHandPanel() {
	return (
		<div className="flex h-36 justify-center panel overflow-visible bg-gray-900/50 backdrop-blur">
			<div className="flex w-108 justify-center gap-2 p-2">
				{[
					{
						name: "fire",
						url: new URL("./cards/fire.svg", import.meta.url),
					},
					{
						name: "water",
						url: new URL("./cards/water.svg", import.meta.url),
					},
					{
						name: "wind",
						url: new URL("./cards/wind.svg", import.meta.url),
					},
					{
						name: "light",
						url: new URL("./cards/light.svg", import.meta.url),
					},
					{
						name: "darkness",
						url: new URL("./cards/darkness.svg", import.meta.url),
					},
				].map((card) => (
					<button
						key={card.name}
						type="button"
						className="aspect-[3/5] shadow-black/50 transition hover:-translate-y-0.5 hover:shadow-gray-950/50"
					>
						<img
							src={card.url.href}
							alt={card.name}
							className="size-full object-contain"
							draggable={false}
						/>
					</button>
				))}
			</div>

			<div className="my-3 shrink-0 basis-px bg-white/10"></div>

			<div className="ms-auto flex-center-col gap-1 p-1">
				<button
					type="button"
					className="flex-center rounded p-1.5 opacity-75 transition hover:bg-white/10 hover:opacity-100"
				>
					<Icon icon="mingcute:refresh-2-fill" className="size-6" />
				</button>
				<button
					type="button"
					className="flex-center rounded p-1.5 opacity-75 transition hover:bg-white/10 hover:opacity-100"
				>
					<Icon icon="mingcute:layer-fill" className="size-6" />
				</button>
			</div>
		</div>
	)
}
