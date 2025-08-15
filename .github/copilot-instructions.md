## Code Style

- Do not add any comments to the code.
- For Convex functions: define `args` schemas, but do not define `returns` schemas.
- Do not use `e` as the argument for event handlers, use `event` instead.
- Use modern React 19 features, such as:
  - `<form action={...}>`
  - `useActionState`
  - `<SomeContext value={...}>` instead of `<SomeContext.Provider value={...}>`
- Prefer `useState` for form state
- Avoid nesting buttons or links inside of interactive elements from base-ui. Either add an `onClick` prop directly, or use the `render` prop, e.g. `render={<Link to="..." />}`

## Styling

- Prefer `font-semibold` for headings over `font-bold`
- Use `btn-icon` for icons in buttons
- Do not add `cursor-pointer` if the element does not already have it

## Technologies

- [Bun](https://bun.sh/)
- [TanStack Start](https://tanstack.com/start/latest/docs/framework/react/overview)
