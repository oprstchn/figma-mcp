# CLAUDE.md - Figma Model Context Protocol

## Commands
- Build/Start: `deno task start` or `deno task dev` (with watch)
- Test (all): `deno task test`
- Test (single): `deno test --allow-net --allow-env --allow-read --allow-write tests/figma_api_test.ts`
- Run examples: `deno task example:basic` or `deno task example:ai`

## Code Style Guidelines
- **Imports**: Use relative paths (e.g., "../src/mod.ts")
- **Types**: Always use TypeScript types for parameters, return values, and variables
- **Documentation**: Add JSDoc comments for classes, methods, and functions
- **Error Handling**: Use try/catch blocks with appropriate error logging
- **Naming**: Use camelCase for variables/functions, PascalCase for classes/interfaces
- **File Structure**:
  - One class per file (e.g., FigmaClient in figma_client.ts)
  - Group related functionality in directories (api/, auth/, model/)
- **Async Code**: Use async/await pattern consistently
- **Parameters**: Use object parameter pattern for complex function arguments

## Environment Variables
- FIGMA_ACCESS_TOKEN: Required for API access
- FIGMA_TEST_FILE_KEY: Required for file-based tests
- FIGMA_TEAM_ID: Required for team-based tests