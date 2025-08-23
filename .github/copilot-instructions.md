## Comments

- Do not add any comments to the code, especially if they only say what the code does.

  Example (**avoid this**):

  ```tsx
  // Generate upload URL
  const uploadUrl = await generateAvatarUploadUrl()

  // Update user with new avatar
  await updateAvatar({ storageId })
  ```

## JavaScript/TypeScript

- Do not use `e` as the argument for event handlers, use `event` instead.

- Do **not** preemptively add type casts. Only consider doing so if you encounter a type error

## React

- Use `<form action={...}>` for form submissions instead of `<form onSubmit={...}>`

- Instead of using the `formData` argument in form action callbacks, use `useState` for form state

- Use `useActionState` for form submissions, as well as **any** asynchronous action

- For React context, use `<SomeContext value={...}>` instead of `<SomeContext.Provider value={...}>`

- This project has a special overload for `React.createContext()` that allows passing zero arguments for an automatic `| undefined` fallback:

  ```tsx
  // Prefer:
  const MyContext = createContext<SomeType>()

  // Instead of:
  const MyContext = createContext<SomeType | undefined>(undefined)
  const MyContext = createContext<SomeType | null>(null)
  ```

- Avoid nesting buttons or links inside of interactive elements from base-ui. Either add an `onClick` prop directly, or use the `render` prop, e.g. `render={<Link to="..." />}`

- Arrays can be returned directly from components in React 19. Avoid wrapping them in fragments:

  ```tsx
  // Bad:
  return (
  	<>
  		{items.map((item) => (
  			<Item key={item.id} item={item} />
  		))}
  	</>
  )

  // Good:
  return items.map((item) => <Item key={item.id} item={item} />)
  ```

## Convex (backend)

- For Convex functions: define `args` schemas, but do not define `returns` schemas.

## Styling

- Prefer `font-semibold` for headings over `font-bold`
- Use `button-icon` for icons in buttons
- Do not add `cursor-pointer` if the element does not already have it
- Use `size-*` for setting the same width and height of an element, e.g. `size-6` instead of `w-6 h-6`
- Use `twMerge` from `tailwind-merge` to combine Tailwind CSS classes.
- Avoid using `space-*` classes, and prefer grid or flex with gap instead

## Technologies

- [Bun](https://bun.sh/)
- [TanStack Start](https://tanstack.com/start/latest/docs/framework/react/overview)
