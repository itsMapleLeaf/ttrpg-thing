export function trace<T>(value: T) {
	if (process.env.NODE_ENV === "development") {
		console.log("TRACE:", value)
	}
	return value
}

export function counted(
	count: number,
	singluarWord: string,
	pluralWord = `${singluarWord}s`,
) {
	return `${count} ${count === 1 ? singluarWord : pluralWord}`
}

/**
 * Convert a file name into a human-readable title:
 * - Removes the file extension
 * - Turns all non-word characters (alphanumeric and period, e.g. for "Mr.") into spaces
 * - Converts the file name to Title Case, special-casing articles like "the" and "of"
 */
export function titleifyFileName(fileName: string) {
	const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, "")
	const parts = nameWithoutExtension.matchAll(/[a-z0-9.]+/gi)
	return [...parts]
		.map(([part]) => {
			if (titleifyFileName.articles.has(part.toLowerCase())) {
				return part.toLowerCase()
			}
			return part.slice(0, 1).toUpperCase() + part.slice(1).toLowerCase()
		})
		.join(" ")
}
titleifyFileName.articles = new Set([
	"the",
	"of",
	"and",
	"a",
	"in",
	"to",
	"is",
	"by",
	"with",
])

export function getOptimizedImageUrl(url: string, width: number) {
	const imageUrl = new URL("/api/images/optimize", window.origin)
	imageUrl.searchParams.set("url", url)
	imageUrl.searchParams.set("width", String(width))
	return imageUrl
}
