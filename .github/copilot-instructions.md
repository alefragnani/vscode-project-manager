# GitHub Copilot Instructions for Project Manager Extension

Always reference these instructions first and fall back to additional search or terminal commands only when project files do not provide enough context.

## Project Overview

**Project Manager** is a Visual Studio Code extension that helps users easily access and manage their projects, whether they are favorites, Git repositories, Mercurial, SVN, or VS Code folders. The extension provides a dedicated sidebar, status bar integration, and quick-pick commands for seamless project navigation.

## Technology Stack

- Language: TypeScript
- Runtime: VS Code Extension API (Node.js)
- Bundler: Webpack with ts-loader
- Linting: ESLint (`eslint-config-vscode-ext`)
- Testing: Mocha + `@vscode/test-electron`

## Working Effectively

Bootstrap and local setup:

```bash
git submodule init
git submodule update
npm install
```

Build and development quickstart:

```bash
npm run build
npm run lint
```

- Use `npm run watch` during active development.
- Use VS Code "Launch Extension" (F5) to validate behavior in Extension Development Host.
- Expected command timings are usually under 10 seconds.
- Never cancel `npm install`, `npm run watch`, or `npm test` once started.
## Build and Development Commands

- `npm run compile` - TypeScript compilation
- `npm run build` - Webpack development build
- `npm run watch` - Continuous webpack build
- `npm run lint` - ESLint validation
- `npm run test` - Full test suite
- `npm run vscode:prepublish` - Production build

## Testing and Validation

Automated tests use the VS Code test runner and may fail in restricted environments due to VS Code download/network constraints.

Manual validation checklist:

1. Run `npm run build` successfully.
2. Press F5 to launch Extension Development Host.
3. Save/list/open projects using quick pick and sidebar flows.
4. Validate project detection for supported providers.
5. Validate status bar updates and project switching behavior.

## Project Structure and Key Files

```
src/
├── autodetect/           # Project auto-detection logic (Git, SVN, Mercurial, VS Code)
├── commands/             # Command implementations
├── core/                 # Core domain models and constants
│   ├── constants.ts      # Enums and constants (PROJECTS_FILE, CommandLocation, etc.)
│   ├── container.ts      # Dependency injection container
│   └── project.ts        # Project interface and factory functions
├── quickpick/            # QuickPick UI implementations (project picker, tag picker)
├── sidebar/              # Sidebar tree view providers and decorations
├── statusbar/            # Status bar integration
├── storage/              # Project storage management (projects.json)
├── utils/                # Utility functions (path, remote detection, URI building)
├── whats-new/            # What's New notifications
├── test/                 # Test suites
│   ├── suite/            # Test cases
│   └── runTest.ts        # Test runner
└── extension.ts          # Extension entry point (activate/deactivate)

dist/                     # Webpack bundles (extension.js)
l10n/                     # Localization files
out/                      # Compiled TypeScript files
vscode-whats-new/         # Git submodule for What's New
walkthrough/              # Getting Started walkthrough content
```

## Coding Conventions and Patterns

### Indentation

- Use spaces, not tabs.
- Use 4 spaces for indentation.

### Naming Conventions

- Use PascalCase for `type` names
- Use PascalCase for `enum` values
- Use camelCase for `function` and `method` names
- Use camelCase for `property` names and `local variables`
- Use whole words in names when possible

### Types

- Do not export `types` or `functions` unless you need to share it across multiple components
- Do not introduce new `types` or `values` to the global namespace
- Prefer `const` over `let` when possible.

### Strings

- Prefer double quotes for new code; some existing files may still use single quotes.
- User-facing strings use two localization mechanisms:
  - **Manifest contributions** (commands, settings, walkthrough metadata): use `%key%` placeholders in `package.json`, with translations in `package.nls.json` and `package.nls.{LANGID}.json`. Do **not** use `l10n.t` for these.
  - **Runtime messages** (shown from extension code): use `l10n.t("message")`, with translations in `l10n/bundle.l10n.json` and `l10n/bundle.l10n.{LANGID}.json`.
- Externalized strings must not use string concatenation. Use placeholders instead (`{0}`).

### Code Quality

- All production source files under `src/` (excluding tests under `src/test`) must include the standard project copyright header
- Prefer `async` and `await` over `Promise` and `then` calls
- All user facing messages must be localized using the applicable localization framework (for example `l10n.t` method)
- Keep imports organized: VS Code first, then internal modules.
- Use semicolons at the end of statements.
- Keep changes minimal and aligned with existing style.

### Import Organization

- Import VS Code API first: `import * as vscode from "vscode"`
- Group related imports together
- Use named imports for specific VS Code types
- Import from local modules using relative paths

### Architecture Patterns
- **Container Pattern**: The `Container` class stores global state like `Container.context`
- **TreeDataProvider Pattern**: The sidebar uses VS Code's `TreeDataProvider` API for project listing and management.
- **Cached Data**: The extension caches autodetected projects to optimize listing
- **setContext Pattern**: Uses `VS Code.commands.executeCommand("setContext", "projectManager:hasProjects", true/false)` to control command visibility based on project availability.
- **Helper Utilities**: Use helper utilities for URI and cross-platform path handling.

## Extension Features and Configuration

### Key Features
1. **Favorite Projects**: Save favorite projects for easier switch
2. **Project Providers**: Support for Git, Mercurial, SVN, and VS Code folders with auto-detection
3. **Auto-detected Projects**: Auto-detect different kind of projects with a wide variety of configurations
4. **Sidebar**: Tree views showing all projects
5. **Status bar**: Show current project and allow quick switching
6. **Project Tags**: Tag projects and filter by tags in quick pick and sidebar
7. **Remote Support**: Full support for remote development (SSH/WSL/Containers/Codespaces)
8. **Internationalization support**: Localization of all user-facing strings

### Important Settings
- `projectManager.sortList`
- `projectManager.groupList`
- `projectManager.showProjectNameInStatusBar`
- `projectManager.tags`
- `projectManager.git.baseFolders`
- `projectManager.git.ignoredFolders`
- `projectManager.git.maxDepthRecursion`

## Dependencies and External Tools

- Requires `vscode-whats-new` submodule initialization.
- No external runtime tools are required beyond standard extension toolchain.

## Troubleshooting and Known Limitations

- Build failures: check TypeScript/Webpack config compatibility.
- Test failures in restricted networks can be environment-related due to VS Code download.
- Path handling bugs are commonly related to remote/local URI differences.
- Keep localization files in sync when adding new user-facing strings.

## CI and Pre-Commit Validation

Before committing:

1. Run `npm run lint`.
2. Run `npm run build`.
3. Run `npm run test-compile`.
4. Validate core quick pick/sidebar workflows in Extension Host.

## Common Tasks

1. Add/update commands and keep `package.json` contributions synchronized.
2. Update settings and ensure configuration handling reacts to changes.
3. Update localization keys in `package.nls*.json` when adding user-facing text.
4. Verify remote and local path behavior when touching project URI logic.
