import { Icon } from "@iconify/react/dist/iconify.js"
import type { ComponentProps, ReactElement } from "react"
import type { OverrideProperties } from "type-fest"

export type IconishIcon = string | ReactElement

export function Iconish({
	icon,
	...props
}: OverrideProperties<ComponentProps<typeof Icon>, { icon: IconishIcon }>) {
	return typeof icon === "string" ? <Icon {...props} icon={icon} /> : icon
}
