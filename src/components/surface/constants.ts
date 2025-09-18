import { vec } from "../../lib/vec.ts"

export const SURFACE_WIDTH = 1600 * 4
export const SURFACE_HEIGHT = 900 * 4
export const SURFACE_SIZE = vec(SURFACE_WIDTH, SURFACE_HEIGHT)
export const GRID_SNAP = 20

export const ACCEPTED_FILE_TYPES = new Set([
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/svg+xml",
])
