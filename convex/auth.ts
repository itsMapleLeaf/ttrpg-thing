import Discord from "@auth/core/providers/discord"
import { convexAuth } from "@convex-dev/auth/server"

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
	providers: [Discord],
})
