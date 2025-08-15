import Discord from "@auth/core/providers/discord"
import { convexAuth } from "@convex-dev/auth/server"
import type { MutationCtx } from "./_generated/server.js"

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
	providers: [Discord],
	callbacks: {
		async createOrUpdateUser(ctx: MutationCtx, args) {
			if (args.existingUserId) {
				// don't update their account info
				return args.existingUserId
			}

			return await ctx.db.insert("users", {
				name: args.profile.name as string,
				email: args.profile.email as string,
				image: args.profile.image as string | undefined,
			})
		},
	},
})
