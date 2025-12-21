# Contributing

First off all, thank you for taking the time to contribute!

When contributing to this project, please first discuss the changes you wish to make via an issue before making changes.

## Your First Code Contribution

Unsure where to begin contributing? You can start by looking through the [`help wanted`](https://github.com/alefragnani/vscode-project-manager/labels/good%20first%20issue) issues.

### Getting the code

```
git clone https://github.com/alefragnani/vscode-project-manager.git
```

Prerequisites

- [Git](https://git-scm.com/), `>= 2.22.0`
- [NodeJS](https://nodejs.org/), `>= 18.17.0`

### Dependencies

From a terminal, where you have cloned the repository, execute the following command to install the required dependencies:

```
git submodule init
git submodule update
npm install
```

### Build / Watch

From inside VS Code, run `Tasks: Run Task Build`. It **Builds** the extension in **Watch Mode**.

This will first do an initial full build and then watch for file changes, compiling those changes incrementally, enabling a fast, iterative coding experience.

> **Tip!** You can press <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> on Windows, Linux) to start the watch task.

> **Tip!** You don't need to stop and restart the development version of Code after each change. You can just execute `Reload Window` from the command palette.

### Linting

This project uses [ESLint](https://eslint.org/) for code linting. You can run ESLint across the code by calling `npm run lint` from a terminal. Warnings from ESLint show up in the `Errors and Warnings` quick box and you can navigate to them from inside VS Code.

To lint the code as you make changes you can install the [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) extension.

### Debugging

1. Open the `vscode-project-manager` folder
2. Ensure the required [dependencies](#dependencies) are installed
3. Choose the `Launch Extension` launch configuration from the launch dropdown in the Run and Debug viewlet and press `F5`.

## Submitting a Pull Request

Be sure your branch is up to date (relative to `master`) and submit your PR. Also add reference to the issue the PR refers to.