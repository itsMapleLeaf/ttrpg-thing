export function TextField({
	label,
	...props
}: React.ComponentProps<"input"> & { label: string }) {
	return (
		<label className="grid gap-1">
			<span className="text-sm font-semibold">{label}</span>
			<input type="text" className="input" {...props} />
		</label>
	)
}
