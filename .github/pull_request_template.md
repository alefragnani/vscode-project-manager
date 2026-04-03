## Description
<!-- Briefly describe the changes in this PR, and which Issue it refers to (if applicable) -->

--- 

## Prerequisites Checklist
- [ ] The code is **up-to-date with the `master` branch**
- [ ] I have reviewed the [CONTRIBUTING.md](../CONTRIBUTING.md) guidelines
- [ ] The code **follows the repository's coding style** (TypeScript conventions, formatting, naming)
- [ ] All changes are **testable and have been manually tested**

--- 

## Regular PR

If your PR is a regular PR, to fix an issue, provide a new feature or change a behavior, follow this additional checklist:

- [ ] This PR must address an **existing issue**

### Changes Made
<!-- Provide a detailed list of changes -->


--- 

## Localization PR

If your PR is related to localization, follow this additional checklist:

- [ ] Identify the language code, like "pt-br" _(There is no need to identify the language name)_
- [ ] All UI strings have been added/updated to `package.nls.json`
- [ ] All translations were added/updated to the corresponding `package.nls.<language>.json` file(s)
- [ ] All new messages and strings located in extension source code have been added/updated to `l10n/bundle.l10n.json`
- [ ] All translations were added/updated to the corresponding `l10n/bundle.l10n.<language>.json` file(s)
- [ ] All walkthrough content has been added/updated to their `Markdown` files
- [ ] All translations were added/updated to the corresponding `walkthrough/someStep.pt-br.md` file(s)

--- 

## Testing
<!-- Describe how you tested your changes -->
- [ ] Tested locally with the extension running in VS Code
- [ ] Tested on Windows (if applicable)
- [ ] Tested on macOS (if applicable)
- [ ] Tested on Linux (if applicable)
- [ ] Tested on Remotes (Containers, WSL, etc.)
- [ ] Verified existing functionality still works (no regressions)

## Documentation
- [ ] Updated [README.md](../README.md) if adding user-facing features (if applicable)

## Additional Notes
<!-- Add any additional context or notes about this PR -->