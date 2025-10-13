import { randomInt, range, sum } from "es-toolkit"

/**
 * Makes dice rolls based on standard dice notation
 *
 * @param dieInputs A list of die inputs, e.g. `["1d6", "2d8"]`
 */
export function handleRollCommand(dieInputs: string[]) {
	type DieResult =
		| { input: string; success: true; outcomes: number[] }
		| { input: string; success: false; error: string }

	const results: DieResult[] = []

	for (const dieInput of dieInputs) {
		const [dieCountInput = "", dieSidesInput = ""] = dieInput.split("d")

		const dieCount = dieCountInput ? parseInt(dieCountInput, 10) : 1
		if (dieCount <= 0 || Number.isNaN(dieCount)) {
			results.push({
				input: dieInput,
				success: false,
				error: `Invalid die count: ${dieCountInput}`,
			})
			continue
		}
		if (dieCount > 100) {
			results.push({
				input: dieInput,
				success: false,
				error: `Die count too high: ${dieCountInput} (max 100)`,
			})
			continue
		}

		if (!dieSidesInput) {
			results.push({
				input: dieInput,
				success: false,
				error: `Missing die sides in: ${dieInput} (e.g. 6 in 1d6)`,
			})
			continue
		}

		const dieSides = parseInt(dieSidesInput, 10)
		if (dieSides <= 1 || Number.isNaN(dieSides)) {
			results.push({
				input: dieInput,
				success: false,
				error: `Invalid die sides: ${dieSidesInput} (must be >= 1)`,
			})
			continue
		}

		if (dieSides > 1000) {
			results.push({
				input: dieInput,
				success: false,
				error: `Die sides too high: ${dieSidesInput} (max 1000)`,
			})
			continue
		}

		const outcomes = range(dieCount).map(() => randomInt(1, dieSides + 1))
		results.push({
			input: dieInput,
			success: true,
			outcomes,
		})
	}

	const summary = results
		.map((result) => {
			if (!result.success) {
				return `Error with ${result.input}: ${result.error}`
			}

			let text = `Rolled ${result.input}: ${result.outcomes.join(", ")}`
			if (result.outcomes.length > 1) {
				text += ` = ${sum(result.outcomes)}`
			}
			return text
		})
		.join("\n")

	return { summary, results }
}
