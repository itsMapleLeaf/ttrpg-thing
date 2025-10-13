import { type } from "arktype"
import { useConvex, useQuery } from "convex/react"
import { useActionState, useState } from "react"
import { api } from "../../../convex/_generated/api.js"
import { useLocalStorage } from "../../common/local-storage.ts"
import { Button } from "../../ui/Button.tsx"
import {
	Popover,
	PopoverButton,
	PopoverClose,
	PopoverPanel,
} from "../../ui/Popover.tsx"
import { TextField } from "../../ui/TextField.tsx"
import { useToastContext } from "../../ui/Toast.tsx"

export function ChatPanel() {
	const messages = useQuery(api.messages.list)

	const [senderName, setSenderName] = useLocalStorage({
		key: "Chat:senderName",
		schema: type.string,
		fallback: "",
	})

	const chatSettingsPanel = (
		<PopoverPanel align="end" className="grid w-dvw max-w-64 gap-2 p-2">
			<TextField
				label="Your name"
				placeholder="Awesome Player"
				defaultValue={senderName}
				onBlur={(e) => setSenderName(e.currentTarget.value)}
				maxLength={32}
			/>
			<PopoverClose render={<Button icon="mingcute:close-fill" size="sm" />}>
				Close
			</PopoverClose>
		</PopoverPanel>
	)

	return (
		<div className="flex h-full flex-col gap-3 panel overflow-y-auto rounded-none border-0 border-l bg-gray-900/50 p-2 backdrop-blur-lg">
			<ul className="flex flex-1 flex-col justify-end gap-3 overflow-y-auto">
				{messages?.slice(-100).map((msg) => (
					<li key={msg._id} className="leading-snug">
						<div className="flex items-baseline gap-2">
							<strong className="text-sm/tight font-semibold">
								{msg.sender}
							</strong>
							<time className="text-xs font-semibold opacity-50">
								{new Date(msg._creationTime).toLocaleString(undefined, {
									timeStyle: "short",
								})}
							</time>
						</div>
						<p className="whitespace-pre-line">{msg.text}</p>
					</li>
				))}
			</ul>

			<Popover>
				{chatSettingsPanel}
				{senderName ? (
					<div className="flex gap-1">
						<MessageInput className="min-w-0 flex-1" senderName={senderName} />
						<PopoverButton
							render={
								<Button icon="mingcute:settings-3-fill" presentation="square" />
							}
						>
							Chat settings
						</PopoverButton>
					</div>
				) : (
					<PopoverButton render={<Button icon="mingcute:user-edit-fill" />}>
						Set your name
					</PopoverButton>
				)}
			</Popover>
		</div>
	)
}

function MessageInput({
	className,
	senderName,
}: {
	className?: string
	senderName: string
}) {
	const convex = useConvex()
	const toast = useToastContext()
	const [newMessageText, setNewMessageText] = useState("")

	const [_, submit, pending] = useActionState(async () => {
		try {
			const text = newMessageText.trim()
			if (!text) return

			await convex.mutation(api.messages.create, {
				sender: senderName,
				text,
			})
			setNewMessageText("")
		} catch (error) {
			toast.error("Failed to send message")
			console.error("Failed to send message", error)
		}
	})

	return (
		<form action={submit} className={className}>
			<textarea
				className="input field-sizing-content h-[unset] resize-none py-2 read-only:opacity-70 read-only:duration-0"
				placeholder="Say something!"
				value={newMessageText}
				readOnly={pending}
				onChange={(e) => setNewMessageText(e.currentTarget.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter" && !e.shiftKey) {
						e.currentTarget.form?.requestSubmit()
					}
				}}
			/>
		</form>
	)
}
