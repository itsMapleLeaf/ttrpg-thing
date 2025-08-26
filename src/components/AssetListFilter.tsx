import { Icon } from "@iconify/react/dist/iconify.js"
import { type } from "arktype"
import { useState } from "react"
import type { AssetListOrder } from "../../convex/assets.ts"
import { useLocalStorage } from "../hooks/useLocalStorage.ts"
import type { NonEmptyArray } from "../types.ts"
import { Button } from "../ui/Button.tsx"

type SortOption = {
	id: AssetListOrder
	name: string
	icon: string
}

const sortOptions: NonEmptyArray<SortOption> = [
	{
		id: "alphabetical",
		name: "Alphabetical",
		icon: "mingcute:az-sort-ascending-letters-fill",
	},
	{
		id: "newestFirst",
		name: "Newest first",
		icon: "mingcute:time-fill",
	},
]

export type { FilterState as AssetListFilterState }
type FilterState = ReturnType<typeof useFilterState>

export { useFilterState as useAssetListFilterState }
function useFilterState() {
	const [searchTerm, setSearchTerm] = useState("")

	const [sortOptionId, setSortOptionId] = useLocalStorage({
		key: "AssetList:sortOptionId",
		fallback: sortOptions[0].id,
		schema: type.enumerated("alphabetical", "newestFirst"),
	})

	const sortOption =
		sortOptions.find((it) => it.id === sortOptionId) ?? sortOptions[0]

	return {
		searchTerm,
		setSearchTerm,
		sortOption,
		setSortOptionId,
	}
}

export function AssetListFilter({
	searchTerm,
	setSearchTerm,
	sortOption,
	setSortOptionId,
}: FilterState) {
	return (
		<div className="flex flex-col gap-2 border-b border-gray-700 p-2">
			<div className="flex gap-2">
				<div className="relative flex flex-1 items-center">
					<input
						type="text"
						placeholder="Search..."
						value={searchTerm}
						onChange={(event) => setSearchTerm(event.target.value)}
						className="input pl-8"
					/>
					<Icon
						icon="mingcute:search-line"
						className="pointer-events-none absolute left-3 size-4 opacity-50"
					/>
				</div>
				<Button
					icon={sortOption.icon}
					shape="square"
					onClick={() => {
						setSortOptionId((orderId) => {
							const currentIndex = sortOptions.findIndex(
								(it) => it.id === orderId,
							)
							const nextIndex = (currentIndex + 1) % sortOptions.length
							return (sortOptions[nextIndex] ?? sortOptions[0]).id
						})
					}}
				>
					Toggle sorting{"\n"}(current: {sortOption.name})
				</Button>
			</div>
		</div>
	)
}
