import type { ComponentProps } from "react"

export function SmartImage(props: ComponentProps<"img">) {
	return (
		<img
			{...props}
			alt={props.alt} // satisfies linter
			ref={(image) => {
				if (!image) return
				if (image.complete) return

				const controller = new AbortController()

				image.style.opacity = "0"

				image.addEventListener(
					"load",
					() => {
						image.animate([{ opacity: "0" }, { opacity: "1" }], {
							duration: 200,
							fill: "forwards",
						})
					},
					{ signal: controller.signal },
				)

				return () => controller.abort()
			}}
		/>
	)
}
