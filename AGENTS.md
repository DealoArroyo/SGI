# AGENTS.md

This file contains rules and conventions for AI agents working in the SGI repository.

## Project Structure
- `client/`: React application (Vite, TypeScript, TailwindCSS, Ant Design).
- `server/`: Backend application.

## Build, Lint, and Test Commands

### Client
- **Build**: `npm run build --prefix client`
- **Lint**: `npm run lint --prefix client`
- **Run (Dev)**: `npm run dev --prefix client`
- **Test**: Currently, no testing framework is configured. If adding tests, please use a standard framework like `vitest`.

### Root
- **Run All (Dev)**: `npm run dev` (uses `concurrently` to run client and server).

## Code Style Guidelines

### General
- Follow idiomatic TypeScript practices.
- Favor functional components and hooks for React code.
- Prefer `const` over `let` and `var`.
- Use descriptive naming conventions: `camelCase` for variables/functions, `PascalCase` for components/classes.

### Imports
- Organize imports logically: external libraries first, followed by internal project modules.
- Use absolute paths if configured, otherwise use relative paths clearly.
- Keep imports clean and alphabetical.

### Formatting
- Ensure proper indentation (2 spaces).
- Maintain consistent line lengths.
- Use semicolons.

### Error Handling
- Use `try-catch` blocks for asynchronous operations (e.g., Axios requests, API calls).
- Provide meaningful error messages and handle them gracefully in the UI (e.g., using Ant Design notification/message).

### React Specifics
- Use functional components with hooks (`useState`, `useEffect`, `useContext`, etc.).
- Maintain a clean component structure: extract complex logic into custom hooks.
- Prefer Tailwind CSS for styling, combined with Ant Design for UI components.
- Use TypeScript interfaces for prop types and state shapes.

### Best Practices for AI Agents
- **Self-Verification**: Before making changes, check for existing tests or create a minimal test case if possible to verify the functionality.
- **Project Conventions**: Always mimic existing code style and structure. Do not introduce new paradigms unless strictly necessary.
- **Security**: Never expose API keys, secrets, or hardcoded credentials. Use environment variables.
- **Comments**: Focus comments on *why* a complex logic is implemented in a certain way, not *what* the code does. Keep them minimal.
- **Dependencies**: Before adding new dependencies, verify if existing ones can fulfill the requirement. Always check `package.json` first.
