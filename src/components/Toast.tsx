import { Toast as BaseToast } from "@base-ui-components/react"
import { Icon } from "@iconify/react/dist/iconify.js"
import { createContext, type ReactNode, useContext, useMemo } from "react"
import { twMerge } from "tailwind-merge"
import { Button } from "./Button.tsx"

type ToastData = {
	type: "error" | "success" | "info"
}

const toastManager = BaseToast.createToastManager()

type ToastContextValue = {
	error: (message: string, timeout?: number) => void
	success: (message: string, timeout?: number) => void
	info: (message: string, timeout?: number) => void
}

const ToastContext = createContext<ToastContextValue>()

export function useToastContext() {
	const context = useContext(ToastContext)
	if (!context) {
		throw new Error("useToast must be used within ToastProvider")
	}
	return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
	const contextValue: ToastContextValue = useMemo(() => {
		return {
			error: (message: string, timeout?: number) => {
				toastManager.add({
					type: "error",
					description: message,
					timeout,
					data: { type: "error" },
				})
			},
			success: (message: string, timeout?: number) => {
				toastManager.add({
					type: "success",
					description: message,
					timeout,
					data: { type: "success" },
				})
			},
			info: (message: string, timeout?: number) => {
				toastManager.add({
					type: "info",
					description: message,
					timeout,
					data: { type: "info" },
				})
			},
		}
	}, [])

	return (
		<ToastContext value={contextValue}>
			<BaseToast.Provider toastManager={toastManager}>
				{children}
				<ToastContainer />
			</BaseToast.Provider>
		</ToastContext>
	)
}

function ToastContainer() {
	return (
		<BaseToast.Portal>
			<BaseToast.Viewport className="pointer-events-none fixed top-4 right-4 flex flex-col items-end gap-2">
				<ToastRenderer />
			</BaseToast.Viewport>
		</BaseToast.Portal>
	)
}

function ToastRenderer() {
	const toastManager = BaseToast.useToastManager()

	return (
		<>
			{toastManager.toasts.map((toast) => (
				<ToastItem key={toast.id} toast={toast} />
			))}
		</>
	)
}

function ToastItem({
	toast,
}: {
	toast: BaseToast.Root.ToastObject<ToastData>
}) {
	const getToastStyles = () => {
		switch (toast.data?.type) {
			case "error":
				return "bg-red-900/90 border-red-700 text-red-100"
			case "success":
				return "bg-green-900/90 border-green-700 text-green-100"
			case "info":
				return "bg-blue-900/90 border-blue-700 text-blue-100"
			default:
				return "bg-gray-900/90 border-gray-700 text-gray-100"
		}
	}

	const getToastIcon = () => {
		switch (toast.data?.type) {
			case "error":
				return "mingcute:alert-circle-fill"
			case "success":
				return "mingcute:check-circle-fill"
			case "info":
				return "mingcute:information-fill"
			default:
				return "mingcute:notification-fill"
		}
	}

	return (
		<BaseToast.Root
			toast={toast}
			className={twMerge(
				`pointer-events-auto flex w-fit max-w-sm base-ui-fade-rise-transition items-center gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-sm transition-all duration-150`,
				getToastStyles(),
			)}
		>
			<Icon icon={getToastIcon()} className="size-5 shrink-0" />

			<BaseToast.Description className="flex-1 text-sm font-medium whitespace-pre-line" />

			<BaseToast.Close
				render={
					<Button
						icon="mingcute:close-line"
						appearance="clear"
						shape="square"
					/>
				}
				className="size-6 shrink-0 !p-0 hover:bg-white/10"
			>
				Dismiss
			</BaseToast.Close>
		</BaseToast.Root>
	)
}
