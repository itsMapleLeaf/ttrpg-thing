export type Vec = { x: number; y: number }
export type VecInput = Vec | [number, number] | number
export type VecInputArgs = [VecInput] | [number, number] | [number]

export function vec(...input: VecInputArgs): Vec {
	if (input.length === 2) {
		const [x, y] = input
		return { x, y }
	}
	const [v] = input
	if (typeof v === "number") {
		return { x: v, y: v }
	}
	if (Array.isArray(v)) {
		return { x: v[0], y: v[1] }
	}
	return v
}

vec.zero = vec(0)
vec.one = vec(1)
vec.left = vec(-1, 0)
vec.right = vec(1, 0)
vec.up = vec(0, -1)
vec.down = vec(0, 1)

vec.map = (v: VecInput, fn: (n: number) => number): Vec => {
	v = vec(v)
	return { x: fn(v.x), y: fn(v.y) }
}

vec.mapWith = (
	a: VecInput,
	b: VecInput,
	fn: (a: number, b: number) => number,
): Vec => {
	a = vec(a)
	b = vec(b)
	return { x: fn(a.x, b.x), y: fn(a.y, b.y) }
}

vec.add = (a: VecInput, b: VecInput): Vec => {
	a = vec(a)
	b = vec(b)
	return { x: a.x + b.x, y: a.y + b.y }
}

vec.subtract = (a: VecInput, b: VecInput): Vec => {
	a = vec(a)
	b = vec(b)
	return { x: a.x - b.x, y: a.y - b.y }
}

vec.multiply = (a: VecInput, b: VecInput): Vec => {
	a = vec(a)
	b = vec(b)
	return { x: a.x * b.x, y: a.y * b.y }
}

vec.divide = (a: VecInput, b: VecInput): Vec => {
	a = vec(a)
	b = vec(b)
	return { x: a.x / b.x, y: a.y / b.y }
}

vec.distance = (a: VecInput, b: VecInput): number => {
	a = vec(a)
	b = vec(b)
	return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
}

vec.abs = (v: VecInput) => vec.map(v, Math.abs)
vec.min = (a: VecInput, b: VecInput) => vec.mapWith(a, b, Math.min)
vec.max = (a: VecInput, b: VecInput) => vec.mapWith(a, b, Math.max)
vec.clamp = (v: VecInput, min: VecInput, max: VecInput) =>
	vec.mapWith(vec.max(v, min), max, Math.min)

vec.floor = (v: VecInput) => vec.map(v, Math.floor)
vec.ceil = (v: VecInput) => vec.map(v, Math.ceil)
vec.round = (v: VecInput) => vec.map(v, Math.round)

vec.roundTo = (input: VecInput, multiple: VecInput) => {
	input = vec(input)
	multiple = vec(multiple)
	return vec(
		Math.round(input.x / multiple.x) * multiple.x,
		Math.round(input.y / multiple.y) * multiple.y,
	)
}

vec.intersects = (
	firstTopLeft: VecInput,
	firstBottomRight: VecInput,
	secondTopLeft: VecInput,
	secondBottomRight: VecInput,
) => {
	firstTopLeft = vec(firstTopLeft)
	firstBottomRight = vec(firstBottomRight)
	secondTopLeft = vec(secondTopLeft)
	secondBottomRight = vec(secondBottomRight)
	return (
		firstTopLeft.x < secondBottomRight.x &&
		firstBottomRight.x > secondTopLeft.x &&
		firstTopLeft.y < secondBottomRight.y &&
		firstBottomRight.y > secondTopLeft.y
	)
}

vec.corners = (a: VecInput, b: VecInput) => {
	a = vec(a)
	b = vec(b)
	return [
		vec(Math.min(a.x, b.x), Math.min(a.y, b.y)),
		vec(Math.max(a.x, b.x), Math.max(a.y, b.y)),
	] as const
}

vec.asSize = (input: VecInput) => {
	input = vec(input)
	return { width: input.x, height: input.y }
}

vec.with = (input: VecInput) => ({
	add: (...args: VecInputArgs) => vec.with(vec.add(input, vec(...args))),

	subtract: (...args: VecInputArgs) =>
		vec.with(vec.subtract(input, vec(...args))),

	multiply: (...args: VecInputArgs) =>
		vec.with(vec.multiply(input, vec(...args))),

	divide: (...args: VecInputArgs) => vec.with(vec.divide(input, vec(...args))),

	result: () => vec(input),
})

vec.css = {
	/**
	 * For use with the CSS `translate` property
	 *
	 * @example
	 * <div style={{ translate: vec.css.translate(position) }} />
	 */
	translate: (v: VecInput) => {
		v = vec(v)
		return `${v.x}px ${v.y}px`
	},
}
