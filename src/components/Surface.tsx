export function Surface() {
	return (
		<canvas
			className="size-full"
			ref={(canvas) => {
				if (!canvas) return

				const observer = new ResizeObserver((entries) => {
					for (const entry of entries) {
						canvas.width = entry.contentRect.width
						canvas.height = entry.contentRect.height

						// show the dimensions on the canvas for fun
						const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
						ctx.clearRect(0, 0, canvas.width, canvas.height)
						ctx.fillStyle = "white"
						ctx.font = `16px "Quicksand Variable"`
						ctx.fillText(`Width: ${canvas.width}px`, 10, 24)
						ctx.fillText(`Height: ${canvas.height}px`, 10, 44)
					}
				})
				observer.observe(canvas)

				return () => {
					observer.disconnect()
				}
			}}
		/>
	)
}
