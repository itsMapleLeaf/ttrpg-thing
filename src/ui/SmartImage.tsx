import type { ComponentProps } from "react"

export function SmartImage(props: ComponentProps<"img">) {
	return (
		<img
			{...props}
			alt={props.alt} // satisfies linter
			ref={(image) => {
				if (!image) return
				if (image.complete) return

				const reveal = () => {
					image.animate([{ opacity: "0" }, { opacity: "1" }], {
						duration: 200,
						fill: "forwards",
					})
				}

				const controller = new AbortController()

				image.style.opacity = "0"
				image.addEventListener("load", reveal, { signal: controller.signal })
				image.addEventListener("error", reveal, { signal: controller.signal })

				// the load listener may not fire (for whatever reason),
				// so ensure the image is revealed _eventually_
				const timeout = setTimeout(() => {
					// TODO: see if we can check the current load state instead of just assuming it loaded
					reveal()
				}, 1000)

				return () => {
					controller.abort()
					clearTimeout(timeout)
				}
			}}
		/>
	)
}
