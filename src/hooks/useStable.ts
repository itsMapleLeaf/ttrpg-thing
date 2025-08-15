import { useState } from "react"

/**
 * Returns a value that only updates when the input value is not undefined.
 * Primarily intended for convex queries that may change often (e.g. type to search),
 * where the data frequently becomes undefined, and the UI flickers with loading states
 */
export function useStable<T>(input: T | undefined): T | undefined {
	const [output, setOutput] = useState(input)
	if (input !== output && input !== undefined) {
		setOutput(input)
	}
	return output
}
