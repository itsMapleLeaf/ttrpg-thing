import { useId } from "react"

interface LabelProps {
	children: React.ReactNode
	required?: boolean
	htmlFor?: string
	className?: string
}

export function Label({
	children,
	required = false,
	htmlFor,
	className = "",
}: LabelProps) {
	const id = useId()
	const labelId = htmlFor || id

	return (
		<label className={`label ${className}`} htmlFor={labelId}>
			{children}
			{required && (
				<>
					<span aria-hidden className="ml-0.5 text-base text-gray-400">
						*
					</span>
					<span className="sr-only">(required)</span>
				</>
			)}
		</label>
	)
}
