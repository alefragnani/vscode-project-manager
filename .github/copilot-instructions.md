# GitHub Copilot Instructions for Project Manager Extension

## Project Overview

**Project Manager** is a Visual Studio Code extension that helps users easily access and manage their projects, whether they are favorites, Git repositories, Mercurial, SVN, or VSCode folders. The extension provides a dedicated sidebar, status bar integration, and quick-pick commands for seamless project navigation.

## Technology Stack

- **Language**: TypeScript
- **Runtime**: Node.js (targeting ES2020)
- **Framework**: VS Code Extension API
- **Build Tool**: Webpack with ts-loader
- **Testing**: Mocha with @vscode/test-electron
- **Linting**: ESLint with @typescript-eslint parser and eslint-config-vscode-ext

## Architecture & Project Structure

```
src/
├── autodetect/         # Project auto-detection logic (Git, SVN, Mercurial, VSCode)
├── commands/           # Command implementations
├── core/              # Core domain models and constants
│   ├── constants.ts   # Enums and constants (PROJECTS_FILE, CommandLocation, etc.)
│   ├── container.ts   # Dependency injection container
│   └── project.ts     # Project interface and factory functions
├── quickpick/         # QuickPick UI implementations (project picker, tag picker)
├── sidebar/           # Sidebar tree view providers and decorations
├── statusbar/         # Status bar integration
├── storage/           # Project storage management (projects.json)
├── utils/             # Utility functions (path, remote detection, URI building)
├── whats-new/         # What's New notifications
├── test/              # Test suites
│   ├── suite/         # Test cases
│   └── runTest.ts     # Test runner
└── extension.ts       # Extension entry point (activate/deactivate)
```

## Build & Development Commands

### Essential Commands
- `npm run build` - Development build using Webpack
- `npm run watch` - Watch mode for development
- `npm run lint` - Run ESLint on TypeScript files
- `npm run compile` - TypeScript compilation
- `npm test` - Run full test suite (compile + lint + test)
- `npm run webpack` - Webpack development build
- `npm run vscode:prepublish` - Production build (minified)

### Testing
- `npm run pretest` - Compile and lint before testing
- `npm run test-compile` - Compile TypeScript and build webpack
- `npm run just-test` - Run tests only (without compilation)

## Coding Conventions & Style Guidelines

### General Principles
1. **License Headers**: All source files must include the GPL-3.0 license header:
   ```typescript
   /*---------------------------------------------------------------------------------------------
   *  Copyright (c) Alessandro Fragnani. All rights reserved.
   *  Licensed under the GPLv3 License. See License.md in the project root for license information.
   *--------------------------------------------------------------------------------------------*/
   ```

2. **Imports Organization**: Group imports logically:
   - Node.js built-in modules first
   - VS Code API imports
   - Internal module imports (relative paths)

3. **TypeScript Settings**:
   - Target: ES2020
   - Module: CommonJS
   - Strict mode: enabled (`alwaysStrict: true`)
   - Source maps: enabled for debugging

### Indentation & Formatting
- We use spaces, not tabs   
- Use **4 spaces** for indentation
- We use **semicolons** at the end of statements

### Naming Conventions
- **Interfaces**: PascalCase (e.g., `Project`, `ProjectStorage`)
- **Classes**: PascalCase (e.g., `Locators`, `Providers`, `Container`)
- **Functions/Methods**: camelCase (e.g., `registerWhatsNew`, `getProjectFilePath`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `PROJECTS_FILE`)
- **Enums**: PascalCase for enum name, camelCase for members (e.g., `CommandLocation.SideBar`)
- **Private fields**: Prefix with underscore (e.g., `_context`, `_stack`)

### Code Organization
- Use **namespace imports** for Node.js modules: `import fs = require("fs")`
- Use **named imports** for VS Code and internal modules
- Prefer **async/await** over promises for better readability
- Use **l10n** (localization) for all user-facing strings: `l10n.t("message")`

### Extension-Specific Patterns
1. **Command Registration**: Register commands in `activate()` using `context.subscriptions.push()`
2. **Context Management**: Use the `Container` class for shared state (context, stack, currentProject)
3. **Configuration**: Access settings via `vscode.workspace.getConfiguration("projectManager")`
4. **Storage**: Use `context.globalState` for persistent data, `projects.json` for project definitions
5. **URI Handling**: Use `buildProjectUri()` helper for cross-platform path handling

## Key Dependencies

### Production
- **minimatch**: Glob pattern matching for ignored folders
- **vscode-ext-codicons**: Icon utilities for VS Code
- **vscode-ext-help-and-feedback-view**: Help and feedback tree view
- **walker**: Directory traversal for project detection

### Development
- **webpack** & **ts-loader**: Bundle extension for production
- **terser-webpack-plugin**: Minification and optimization
- **eslint-config-vscode-ext**: VS Code extension-specific ESLint rules

## Testing Approach

- **Framework**: Mocha with @vscode/test-electron
- **Test Location**: `src/test/suite/`
- **Test Patterns**: 
  - Unit tests for core logic (e.g., `stack.test.ts`)
  - Integration tests for extension functionality (e.g., `extension.test.ts`)
- **Running Tests**: Tests run in actual VS Code instance via test-electron

## Configuration Files

- **tsconfig.json**: TypeScript compiler configuration (ES2020, CommonJS, strict mode)
- **webpack.config.js**: Webpack bundling for production (minification, source maps)
- **package.json**: Extension manifest with commands, views, configuration, and dependencies
- **.vscodeignore**: Files to exclude from extension package
- **.gitignore**: Standard exclusions (out/, node_modules/, dist/, *.vsix)

## Common Patterns & Best Practices

### 1. Internationalization (i18n)
Always use VS Code's localization API for user-facing strings:
```typescript
import { l10n } from "vscode";
vscode.window.showInformationMessage(l10n.t("Could not open the project!"));
```

### 2. Command Pattern
Commands should be registered in `activate()` and follow this pattern:
```typescript
context.subscriptions.push(
    vscode.commands.registerCommand("projectManager.commandName", async () => {
        // Command implementation
    })
);
```

### 3. Tree View Providers
- Located in `src/sidebar/`
- Implement `vscode.TreeDataProvider` interface
- Use `_onDidChangeTreeData` event emitter for updates

### 4. Path Handling
- Use `PathUtils` for cross-platform path operations
- Support `~` and `$home` expansion in user-defined paths
- Use `buildProjectUri()` for proper URI construction (supports remotes)

### 5. Remote Development Support
- Extension supports Remote Development (SSH, WSL, Containers, Codespaces)
- Use `isWindows`, `isMacOS` helper functions from `utils/remote`
- Handle both local and remote URIs appropriately

## Multi-language Support

The extension supports multiple languages via `l10n` bundles:
- English (package.nls.json)
- French, Portuguese (Brazil), Russian, Ukrainian, Chinese (Simplified/Traditional), Czech

All localization files follow the pattern `package.nls.{locale}.json` in the root directory.

## Important Configuration Settings

### Project Detection
- `projectManager.git.baseFolders`: Base folders for Git project detection
- `projectManager.git.ignoredFolders`: Folders to ignore (supports glob patterns)
- `projectManager.git.maxDepthRecursion`: Maximum depth for recursive search

### UI Behavior
- `projectManager.sortList`: Sorting strategy (Saved, Name, Path, Recent)
- `projectManager.groupList`: Group projects by type
- `projectManager.showProjectNameInStatusBar`: Display current project in status bar
- `projectManager.tags`: Available tags for project organization

## Extension Points

### Commands (Key Examples)
- `projectManager.saveProject`: Save current folder/workspace as project
- `projectManager.listProjects`: Show project picker
- `projectManager.editProjects`: Open projects.json for editing
- `projectManager.filterProjectsByTag`: Filter by tags

### Views
- `projectsExplorerFavorites`: Favorite projects tree view
- `projectsExplorerGit`: Git repositories tree view
- `projectsExplorerSVN`: SVN repositories tree view
- `projectsExplorerMercurial`: Mercurial repositories tree view
- `projectsExplorerVSCode`: VSCode folders tree view
- `projectsExplorerAny`: Any folder tree view

### Context Keys
- `projectManager.viewAsList`: Current view mode (list vs tags)
- `projectManager.sortBy`: Current sort mode
- `projectManager.canShowTreeView{Type}`: Visibility conditions for tree views

## Development Workflow

1. **Setup**: Run `npm install` to install dependencies
2. **Development**: Run `npm run watch` for continuous compilation
3. **Testing**: Run `npm test` for full test suite
4. **Debugging**: Press F5 in VS Code to launch Extension Development Host
5. **Linting**: Run `npm run lint` before committing
6. **Building**: Run `npm run build` for development build or `npm run vscode:prepublish` for production

## Things to Avoid

1. **Don't** hardcode strings - always use `l10n.t()` for internationalization
2. **Don't** use synchronous file operations in main thread - prefer async APIs
3. **Don't** directly access workspace folders - use extension's path utilities
4. **Don't** ignore cross-platform path differences - use `path` module and helpers
5. **Don't** forget license headers in new source files
6. **Don't** commit `out/`, `node_modules/`, or `dist/` folders

## Security Considerations

- User-defined paths support `~` and `$home` expansion but are validated
- Project files (projects.json) are stored in user's VS Code configuration directory
- Extension requires no special permissions beyond file system access
- Untrusted workspace support is enabled with appropriate restrictions

## Troubleshooting Tips

1. **Build failures**: Check TypeScript version compatibility and webpack configuration
2. **Test failures**: Ensure @vscode/test-electron matches VS Code engine version
3. **Linting errors**: Follow eslint-config-vscode-ext rules strictly
4. **Path issues**: Use PathUtils and verify remote/local context handling
5. **Localization**: Verify all new strings are added to package.nls.json

## Additional Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Extension Manifest (package.json)](https://code.visualstudio.com/api/references/extension-manifest)
- [Testing Extensions](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
