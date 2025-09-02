import Discord from "@auth/core/providers/discord"
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server"
import type { MutationCtx, QueryCtx } from "./_generated/server.js"

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

		async redirect(params) {
			const url = new URL(params.redirectTo, process.env.SITE_URL)
			if (url.hostname === "localhost") return url.href
			if (url.hostname === "tabletopthing.netlify.app") return url.href
			if (url.hostname === "tabletop.mapleleaf.dev") return url.href
			return process.env.SITE_URL as string
		},
	},
})

export async function ensureAuthUserId(ctx: QueryCtx) {
	const userId = await getAuthUserId(ctx)
	if (!userId) {
		throw new Error("Unauthorized")
	}
	return userId
}
