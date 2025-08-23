import { Icon } from "@iconify/react/dist/iconify.js"
import { type ComponentProps, type ReactElement, useTransition } from "react"
import { twMerge } from "tailwind-merge"
import { usePendingDelay } from "../hooks/usePendingDelay.ts"
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip.tsx"

export interface ButtonProps extends ComponentProps<"button"> {
	icon: string | ReactElement | null
	appearance?: "solid" | "clear"
	shape?: "default" | "square"
	intent?: "default" | "danger"
	pending?: boolean
	onClick?: (event: React.MouseEvent<HTMLButtonElement>) => unknown
}

export function Button({
	children,
	className,
	icon,
	appearance = "clear",
	shape = "default",
	intent = "default",
	pending: pendingProp,
	onClick,
	...props
}: ButtonProps) {
	const [transitionPending, startTransition] = useTransition()
	const pending = usePendingDelay(transitionPending || pendingProp)

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		startTransition(async () => {
			try {
				await onClick?.(event)
			} catch (error) {
				alert(error) // todo: toast
			}
		})
	}

	const iconElement = pending ? (
		<div aria-hidden className="pointer-events-none size-5">
			<Icon icon="mingcute:loading-3-fill" className="size-full animate-spin" />
		</div>
	) : typeof icon === "string" ? (
		<div aria-hidden className="pointer-events-none size-5">
			<Icon icon={icon} className="size-full" />
		</div>
	) : (
		icon
	)

	const derivedClassName = twMerge(
		appearance === "solid" && "button-solid",
		appearance === "clear" && "button-clear",
		shape === "square" && "button-square",
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
				<Tooltip>
					<TooltipTrigger type="button" {...derivedProps}>
						{iconElement}
						<div className="sr-only">{children}</div>
					</TooltipTrigger>
					<TooltipContent>{children}</TooltipContent>
				</Tooltip>
			) : (
				<button type="button" {...derivedProps}>
					{iconElement}
					<div>{children}</div>
				</button>
			)}
		</>
	)
}
