import { useState } from "react"

type Message = {
	id: string
	author: string
	text: string
	createdAt: number
}

export function ChatPanel() {
	const [messages, setMessages] = useState<Message[]>([])

	return (
		<div className="flex flex-col gap-3 panel overflow-y-auto rounded-none border-0 border-l bg-gray-900/50 p-2 backdrop-blur-lg">
			<ul className="flex flex-1 flex-col justify-end gap-3 overflow-y-auto">
				{messages.map((msg) => (
					<li key={msg.id} className="leading-snug">
						<div className="flex items-baseline gap-2">
							<strong className="text-sm/tight font-semibold">
								{msg.author}
							</strong>
							<time className="text-xs font-semibold opacity-50">
								{new Date(msg.createdAt).toLocaleString(undefined, {
									timeStyle: "short",
								})}
							</time>
						</div>
						<p className="whitespace-pre-line">{msg.text}</p>
					</li>
				))}
			</ul>

			<textarea
				className="field-sizing-content input h-[unset] resize-none py-2"
				placeholder="Say something!"
				onKeyDown={(e) => {
					if (e.key === "Enter" && !e.shiftKey) {
						e.preventDefault()
						const text = e.currentTarget.value.trim()
						if (text) {
							setMessages((prev) => [
								...prev,
								{
									id: Date.now().toString(),
									author: "You",
									text,
									createdAt: Date.now(),
								},
							])
							e.currentTarget.value = ""
						}
					}
				}}
			/>
		</div>
	)
}
