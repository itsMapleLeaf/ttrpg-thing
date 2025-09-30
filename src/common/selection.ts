import { useState } from "react"

/**
 * A custom React hook for managing selection state of items in a library/collection.
 *
 * @template T - The type of items that can be selected
 * @param library - The array of items that can be selected from
 *
 * @example
 * const items = ['apple', 'banana', 'cherry'];
 * const {
 *   selection,
 *   selectedCount,
 *   isSelected,
 *   selectAll,
 *   toggleSelected
 * } = useSelection(items);
 *
 * // Select an item
 * toggleSelected('apple');
 *
 * // Check if selected
 * console.log(isSelected('apple')); // true
 *
 * // Select all items
 * selectAll();
 */
export function useSelection<T>(library: T[]) {
	const [items, setSelection] = useState<ReadonlySet<T>>(new Set())
	const isSelected = (item: T) => items.has(item)

	const clear = () => {
		setSelection(new Set())
	}

	const selectAll = () => {
		setSelection(new Set(library))
	}

	const setItemSelected = (item: T, shouldBeSelected: boolean) => {
		setSelection((selection) => {
			const newSelection = new Set(selection)
			if (shouldBeSelected) {
				newSelection.add(item)
			} else {
				newSelection.delete(item)
			}
			return newSelection
		})
	}

	const toggleItemSelected = (item: T) => {
		setSelection((selection) => {
			const newSelection = new Set(selection)
			if (newSelection.has(item)) {
				newSelection.delete(item)
			} else {
				newSelection.add(item)
			}
			return newSelection
		})
	}

	return {
		/** ReadonlySet of currently selected items */
		items,
		/** Number of currently selected items */
		count: items.size,
		/** Check if an item is selected */
		has: isSelected,
		/** Clear all selections */
		clear,
		/** Select all items in the library */
		selectAll,
		/** Set the selection state of a specific item */
		setItemSelected,
		/** Toggle the selection state of a specific item */
		toggleItemSelected,
		/** Replace the entire selection with a new set of items */
		setSelectedItems: (selection: Iterable<T>) => {
			setSelection(new Set(selection))
		},
	}
}
