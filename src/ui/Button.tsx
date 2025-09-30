import { Icon } from "@iconify/react/dist/iconify.js"
import { type ComponentProps, type ReactElement, useTransition } from "react"
import { twMerge } from "tailwind-merge"
import { usePendingDelay } from "../common/react.ts"
import { useToastContext } from "./Toast.tsx"
import { WithTooltip } from "./Tooltip.tsx"

export interface ButtonProps extends ComponentProps<"button"> {
	icon: string | ReactElement | null
	appearance?: "solid" | "clear"
	shape?: "default" | "square"
	size?: "default" | "sm"
	intent?: "default" | "danger"
	pending?: boolean
	tooltipProps?: Partial<ComponentProps<typeof WithTooltip>>
	onClick?: (event: React.MouseEvent<HTMLButtonElement>) => unknown
}

export function Button({
	children,
	className,
	icon,
	appearance = "clear",
	shape = "default",
	size = "default",
	intent = "default",
	pending: pendingProp,
	tooltipProps,
	onClick,
	...props
}: ButtonProps) {
	const [transitionPending, startTransition] = useTransition()
	const pending = usePendingDelay(transitionPending || pendingProp)
	const toast = useToastContext()

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		startTransition(async () => {
			try {
				await onClick?.(event)
			} catch (error) {
				toast.error(String(error))
			}
		})
	}

	const iconClass = twMerge(
		"pointer-events-none",
		size === "default" && "size-5",
		size === "sm" && "size-4",
	)

	const iconElement = pending ? (
		<div aria-hidden className={iconClass}>
			<Icon icon="mingcute:loading-3-fill" className="size-full animate-spin" />
		</div>
	) : typeof icon === "string" ? (
		<div aria-hidden className={iconClass}>
			<Icon icon={icon} className="size-full" />
		</div>
	) : (
		icon
	)

	const derivedClassName = twMerge(
		appearance === "solid" && "button-solid",
		appearance === "clear" && "button-clear",
		shape === "square" && "button-square",
		size === "sm" && "button-sm",
		intent === "danger" && "button-danger",
		pending && "opacity-50",
		className,
	)

	const derivedProps: ComponentProps<"button"> = {
		...props,
		className: derivedClassName,
		onClick: handleClick,
	}

	return (
		<>
			{shape === "square" ? (
				<WithTooltip content={children} {...tooltipProps}>
					<button type="button" {...derivedProps}>
						{iconElement}
						<div className="sr-only">{children}</div>
					</button>
				</WithTooltip>
			) : (
				<button type="button" {...derivedProps}>
					{iconElement}
					<div>{children}</div>
				</button>
			)}
		</>
	)
}
