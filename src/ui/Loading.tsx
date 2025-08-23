export function Loading() {
	return (
		<div className="flex items-center justify-center py-32">
			<div className="flex items-center gap-3" aria-live="polite">
				<span className="loading loading-sm loading-spinner" />
				<span className="text-sm opacity-70">Loading...</span>
			</div>
		</div>
	)
}
