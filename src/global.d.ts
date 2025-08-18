import "react"
declare module "react" {
	export function createContext<T>(): React.Context<T | undefined>

	export function useActionState<State, Args = void>(
		action: (state: State | undefined, args: Args) => State | Promise<State>,
	): [
		state: State | undefined,
		dispatch: (args: Args) => void,
		isPending: boolean,
	]
}

declare global {
	interface ImportMetaEnv {
		VITE_CONVEX_URL: string
	}
}
