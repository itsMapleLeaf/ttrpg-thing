import "react"
declare module "react" {
	export function createContext<T>(): React.Context<T | undefined>
}

declare global {
	interface ImportMetaEnv {
		VITE_CONVEX_URL: string
	}
}
