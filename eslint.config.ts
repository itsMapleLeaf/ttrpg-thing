import js from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"
import react from "eslint-plugin-react-x"
import { defineConfig } from "eslint/config"
import reactHooks from "eslint-plugin-react-hooks"

export default defineConfig([
	{
		ignores: [
			"**/node_modules/**",
			"**/dist/**",
			"**/build/**",
			"**/.tanstack/**",
			"**/.netlify/**",
			"convex/_generated/**",
		],
	},
	{
		files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
		plugins: { js },
		extends: ["js/recommended"],
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
	},
	tseslint.configs.recommended,
	{
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					args: "all",
					argsIgnorePattern: "^_",
					caughtErrors: "all",
					caughtErrorsIgnorePattern: "^_",
					destructuredArrayIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					ignoreRestSiblings: true,
				},
			],
		},
	},

	react.configs.recommended,
	reactHooks.configs.flat["recommended-latest"]!,
	{
		rules: {
			"react-hooks/refs": "off",
			"react-hooks/purity": "off",
		},
	},
])
