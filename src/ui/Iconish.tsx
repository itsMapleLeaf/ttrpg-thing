import { Icon } from "@iconify/react/dist/iconify.js"
import type { ComponentProps, ReactElement } from "react"
import { twMerge } from "tailwind-merge"

export type IconishIcon = string | ReactElement

export function Iconish({
	icon,
	...props
}: ComponentProps<"span"> & {
	icon: IconishIcon
}) {
	return (
		<span {...props} className={twMerge("size-5 *:size-full", props.className)}>
			{typeof icon === "string" ? <Icon icon={icon} /> : icon}
		</span>
	)
}
