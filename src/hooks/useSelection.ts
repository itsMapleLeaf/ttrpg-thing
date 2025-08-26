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
	const [selection, setSelection] = useState<ReadonlySet<T>>(new Set())

	const clearSelection = () => {
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

	const toggleSelected = (item: T) => {
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

	const isSelected = (item: T) => selection.has(item)

	const selectedCount = selection.size

	return {
		/** ReadonlySet of currently selected items */
		selection,
		/** Number of currently selected items */
		selectedCount,
		/** Function to check if an item is selected */
		isSelected,
		/** Function to clear all selections */
		clearSelection,
		/** Function to select all items in the library */
		selectAll,
		/** Function to set the selection state of a specific item */
		setSelected: setItemSelected,
		/** Function to toggle the selection state of a specific item */
		toggleSelected,
		/** Function to replace the entire selection with a new set of items */
		setSelection: (selection: Iterable<T>) => {
			setSelection(new Set(selection))
		},
	}
}
