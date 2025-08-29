import { Icon as IconifyIcon } from "@iconify/react"
import type { ComponentProps, ReactElement } from "react"
import { twMerge } from "tailwind-merge"

/**
 * Either an icon name, or an element to be rendered in the place of an icon
 * @see renderIconish
 * @see Icon
 */
export type Iconish = string | ReactElement

/**
 * Wrapper around the Iconify Icon with a default fixed size
 * to avoid layout shift from icons loading in,
 * overridable by passing a `size-*` class
 */
export function Icon({
	icon,
	...props
}: ComponentProps<"span"> & {
	icon: Iconish
}) {
	return (
		<span
			{...props}
			className={twMerge("block size-5 *:size-full", props.className)}
		>
			{typeof icon === "string" ? <IconifyIcon icon={icon} /> : icon}
		</span>
	)
}
