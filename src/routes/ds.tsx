import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "../components/PageHeader.tsx"
import { Button } from "../ui/Button.tsx"
import { useToastContext } from "../ui/Toast.tsx"

export const Route = createFileRoute("/ds")({
	component: TestToasts,
})

function TestToasts() {
	const toast = useToastContext()

	return (
		<>
			<PageHeader heading="Design System" />
			<div className="container mx-auto grid max-w-lg gap-4 py-6">
				<Section heading="Buttons">
					<div className="flex gap-2">
						<Button icon="mingcute:square-fill" appearance="solid">
							Solid
						</Button>
						<Button icon="mingcute:square-line" appearance="clear">
							Clear
						</Button>
					</div>

					<section>
						<h3 className="mb-1 label">Pending</h3>
						<div className="flex gap-2">
							<Button icon="mingcute:square-fill" appearance="solid" pending>
								Solid
							</Button>
							<Button icon="mingcute:square-line" appearance="clear" pending>
								Clear
							</Button>
						</div>
					</section>

					<section>
						<h3 className="mb-1 label">Danger</h3>
						<div className="flex gap-2">
							<Button
								icon="mingcute:square-fill"
								appearance="solid"
								intent="danger"
							>
								Solid
							</Button>
							<Button
								icon="mingcute:square-line"
								appearance="clear"
								intent="danger"
							>
								Clear
							</Button>
						</div>
					</section>
				</Section>

				<Section heading="Toasts">
					<Button
						icon="mingcute:alert-circle-fill"
						appearance="solid"
						onClick={() => {
							toast.error("This is an error message!")
						}}
					>
						Show Error Toast
					</Button>

					<Button
						icon="mingcute:check-circle-fill"
						appearance="solid"
						onClick={() => {
							toast.success("Operation completed successfully!")
						}}
					>
						Show Success Toast
					</Button>

					<Button
						icon="mingcute:information-fill"
						appearance="solid"
						onClick={() => {
							toast.info("This is some helpful information.")
						}}
					>
						Show Info Toast
					</Button>

					<Button
						icon="mingcute:file-upload-fill"
						appearance="solid"
						onClick={() => {
							toast.error(
								"Failed to upload files:\nimage1.jpg\nimage2.png\nvery-long-filename-that-might-wrap.jpg",
							)
						}}
					>
						Show Multi-line Error
					</Button>

					<Button
						icon="mingcute:spam-2-fill"
						appearance="solid"
						onClick={() => {
							for (let i = 1; i <= 5; i++) {
								setTimeout(() => {
									const types = ["error", "success", "info"] as const
									const type = types[i % 3] as "error" | "success" | "info"
									toast[type](
										`${type.charAt(0).toUpperCase() + type.slice(1)} toast #${i}`,
									)
								}, i * 200)
							}
						}}
					>
						Spam Multiple Toasts
					</Button>

					<Button
						icon="mingcute:time-fill"
						appearance="solid"
						onClick={() => {
							toast.error(
								"This is a very long error message that should test how the toast handles longer content. It might wrap to multiple lines or be truncated depending on the implementation.",
							)
						}}
					>
						Show Long Message
					</Button>
				</Section>
			</div>
		</>
	)
}

function Section({
	heading,
	children,
}: {
	heading: string
	children: React.ReactNode
}) {
	return (
		<section className="grid gap-3">
			<h2 className="text-2xl font-light">{heading}</h2>
			{children}
		</section>
	)
}
