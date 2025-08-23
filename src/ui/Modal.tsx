import {
	type ComponentProps,
	createContext,
	createRef,
	use,
	useRef,
} from "react"

const DialogRefContext = createContext(createRef<HTMLDialogElement>())

export function Modal(props: { children: React.ReactNode }) {
	const dialogRef = useRef<HTMLDialogElement>(null)
	return <DialogRefContext value={dialogRef}>{props.children}</DialogRefContext>
}

export function ModalButton(props: ComponentProps<"button">) {
	const dialogRef = use(DialogRefContext)
	return (
		<button
			{...props}
			type="button"
			onClick={(event) => {
				props.onClick?.(event)
				if (event.defaultPrevented) return
				dialogRef.current?.showModal()
			}}
		/>
	)
}

export function ModalPanel(props: {
	children: React.ReactNode
	heading: React.ReactNode
}) {
	const dialogRef = use(DialogRefContext)
	return (
		<dialog
			className="group fade fixed inset-0 flex h-dvh max-h-[unset] w-dvw max-w-[unset] flex-col bg-transparent p-4 text-gray-50 opacity-0 duration-200 backdrop:fade backdrop:bg-black/25 backdrop:backdrop-blur-sm open:fade-visible open:backdrop:fade-visible"
			ref={dialogRef}
		>
			<form method="dialog" className="">
				<button type="submit" className="fixed inset-0" tabIndex={-1} />
			</form>

			<div className="fade relative m-auto w-full max-w-md translate-y-4 panel p-4 opacity-0 shadow-lg shadow-black/25 duration-200 group-open:fade-visible group-open:translate-y-0">
				<h3 className="mb-4 text-2xl font-medium">{props.heading}</h3>
				{props.children}
			</div>
		</dialog>
	)
}

export function ModalActions(props: { children: React.ReactNode }) {
	return (
		<div className="mt-6 flex items-center justify-end gap-2">
			<form method="dialog">
				<button type="submit" className="button-clear">
					Cancel
				</button>
			</form>
			{props.children}
		</div>
	)
}
