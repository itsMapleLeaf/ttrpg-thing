export type Vec = { x: number; y: number }

export function vec(x: number, y = x): Vec {
	return { x, y }
}

vec.zero = vec(0)
vec.one = vec(1)
vec.left = vec(-1, 0)
vec.right = vec(1, 0)
vec.up = vec(0, -1)
vec.down = vec(0, 1)

vec.add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y })
vec.subtract = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y })
vec.multiply = (a: Vec, b: Vec): Vec => ({ x: a.x * b.x, y: a.y * b.y })
vec.divide = (a: Vec, b: Vec): Vec => ({ x: a.x / b.x, y: a.y / b.y })

vec.distance = (a: Vec, b: Vec): number =>
	Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
