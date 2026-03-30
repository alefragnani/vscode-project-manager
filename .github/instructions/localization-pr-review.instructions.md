---
description: "Use when reviewing pull requests that add or update localization files (package.nls.*.json, bundle.l10n.*.json, walkthrough .nls.*.md files) for VS Code extensions. Validates key completeness, JSON syntax, placeholder preservation, and file structure."
applyTo: "package.nls.*.json,l10n/bundle.l10n.*.json,walkthrough/*.nls.*.md"
---

# Localization Pull Request Review Instructions

These instructions guide the Copilot Code Review agent when reviewing pull requests that add or update localization files for the Project Manager VS Code extension.

## Overview

This extension supports multiple localization approaches:
1. **Package contributions** (`package.nls.*.json`) - for settings, commands, menus, views, and walkthrough metadata
2. **Walkthrough content** (`walkthrough/*.nls.*.md`) - for walkthrough step content
3. **Runtime messages** (`l10n/bundle.l10n.*.json`) - for messages displayed in extension code

## Language Code Format

All language identifiers must follow the BCP 47 format and match VS Code's supported languages:
- Use lowercase for language codes: `es`, `fr`, `pt-br`, `zh-cn`, `zh-tw`
- Use hyphen separator for regional variants: `pt-br` (not `pt_br` or `pt-BR`)
- Verify the language code is supported by VS Code

## File Naming Conventions

### Package Localization Files
- **Pattern**: `package.nls.{LANGID}.json`
- **Location**: Root directory
- **Example**: `package.nls.es.json`, `package.nls.pt-br.json`

### Walkthrough Localization Files
- **Pattern**: `{stepName}.nls.{LANGID}.md`
- **Location**: `walkthrough/` directory
- **Example**: `toggle.nls.es.md`, `exclusiveSideBar.nls.pt-br.md`

### Runtime Bundle Localization Files
- **Pattern**: `bundle.l10n.{LANGID}.json`
- **Location**: `l10n/` directory
- **Example**: `bundle.l10n.es.json`, `bundle.l10n.pt-br.json`

## Critical Validation Checks

### 1. Key Completeness and Consistency

**For `package.nls.*.json` files:**
- ✅ All keys from `package.nls.json` must be present in the localized file
- ✅ No extra keys should exist that aren't in the base file
- ✅ Key names must match exactly (case-sensitive)
- ❌ Missing keys mean incomplete localization
- ❌ Extra keys indicate misalignment with base file

**For `bundle.l10n.*.json` files:**
- ✅ All keys from `l10n/bundle.l10n.json` must be present
- ✅ Check for proper translation of variable placeholders (e.g., `{0}`, `{1}`)
- ✅ Preserve format specifiers and escape sequences

**For walkthrough `.nls.*.md` files:**
- ✅ Corresponding base `.md` file must exist
- ✅ Markdown structure should be preserved (headings, lists, links)
- ✅ Command links must remain functional: `[text](command:commandId)`

### 2. JSON Format and Syntax

- ✅ Valid JSON syntax (no trailing commas, proper quotes, balanced braces)
- ✅ UTF-8 encoding without BOM
- ✅ Consistent indentation (4 spaces per the project's style)
- ✅ Keys and values properly quoted with double quotes
- ✅ Proper escaping of special characters (`\n`, `\"`, `\\`)
- ❌ No single quotes for strings
- ❌ No comments in JSON files

### 3. Translation Quality Indicators

While you cannot verify translation accuracy, watch for:
- ⚠️ Values that are identical to the English version (may indicate incomplete translation)
- ⚠️ Missing diacritics or special characters expected in the target language
- ⚠️ Broken variable placeholders: `{0}`, `{1}` must be preserved
- ⚠️ Broken markdown links or command references in walkthrough files
- ⚠️ Inconsistent use of terms across the same file

### 4. Structural Integrity

**Package files:**
- ✅ Structure matches `package.nls.json` exactly
- ✅ Nested properties preserved (e.g., `"projectManager.commands.saveProject.title"`)
- ✅ Array elements and object structures maintained

**Bundle files:**
- ✅ Multi-line strings preserve `\n` characters
- ✅ Format placeholders maintained: `{0}`, `{1}`, etc.
- ✅ Contextual consistency with surrounding text

**Walkthrough files:**
- ✅ Markdown syntax valid
- ✅ Command links intact: `(command:projectManager.saveProject)`
- ✅ Image references preserved
- ✅ Code blocks and formatting maintained

### 5. Full Localization Pack Validation

When a new language is added, ensure that all three types of localization files are included:
- `package.nls.{LANGID}.json`
- `l10n/bundle.l10n.{LANGID}.json`
- Walkthrough `.nls.{LANGID}.md` files for all steps

## Common Issues to Flag

### High Priority Issues ❌

1. **Missing keys** - Incomplete localization
   ```
   Missing keys: ["projectManager.commands.saveProject.title", "projectManager.commands.saveProject.title"]
   ```

2. **Invalid JSON syntax** - File cannot be parsed
   ```
   Syntax error at line 45: Unexpected token ,
   ```

3. **Broken placeholders** - Runtime errors possible
   ```
   English: "Selected tags: {0}"
   Localized: "Selected tags:" // Missing {0}
   ```

4. **Wrong file location** - Files won't be loaded
   ```
   ❌ src/l10n/bundle.l10n.es.json  (wrong location)
   ✅ l10n/bundle.l10n.es.json      (correct location)
   ```

5. **Incomplete localization pack** - Missing files for a new language
   ```
   ❌ Missing files for language 'es':
   - `package.nls.es.json`
   - `l10n/bundle.l10n.es.json`
   - Walkthrough `.nls.es.md` files
   ```

### Medium Priority Issues ⚠️

1. **Extra keys** - May indicate stale translations
   ```
   Extra keys not in base file: ["projectManager.commands.oldCommand.title"]
   ```

2. **Untranslated values** - Values identical to English
   ```
   "projectManager.activitybar.title": "Project Manager"  // Appears untranslated
   ```

3. **Inconsistent formatting** - Reduce diff noise
   ```
   // Inconsistent indentation or line endings
   ```

### Low Priority Issues ℹ️

1. **Missing newline at end of file**
2. **Inconsistent quote escaping** (if functionally equivalent)
3. **Whitespace inconsistencies** (if not affecting output)

## Review Checklist

When reviewing a localization PR, verify:

- [ ] Language code is correctly formatted and consistent
- [ ] Files are placed in the correct directories
- [ ] File naming follows conventions exactly
- [ ] All required keys are present (compare with base files)
- [ ] No extra keys exist that aren't in base files
- [ ] JSON syntax is valid (run through JSON validator)
- [ ] UTF-8 encoding is used
- [ ] Indentation matches project style (4 spaces)
- [ ] Variable placeholders `{0}`, `{1}`, etc. are preserved
- [ ] Escape sequences `\n`, `\"` are properly maintained
- [ ] Markdown links and commands are intact (walkthrough files)
- [ ] No obvious machine translation artifacts (if detectable)

## Helpful Review Comments

### For Missing Keys
```
⚠️ This localization is missing the following keys that exist in the base file:
- `projectManager.commands.export.title`
- `projectManager.configuration.newSetting.description`

Please add these keys with appropriate translations.
```

### For Extra Keys
```
⚠️ This file contains keys that don't exist in the base file:
- `projectManager.commands.oldFeature.title`

These may be from an older version. Please remove them or verify they're still needed.
```

### For Broken Placeholders
```
❌ The placeholder `{0}` is missing in this translation:
- English: "The project's file was last modified at {0}"
- Localized: "El archivo del proyecto fue modificado"

Please include the `{0}` placeholder to show the modification time.
```

### For Structural Issues
```
❌ Invalid JSON syntax detected at line 23. Please ensure:
- All keys and values are enclosed in double quotes
- No trailing commas after the last item
- All braces and brackets are properly balanced
```

### For Untranslated Content
```
ℹ️ Some values appear to be identical to English. Please verify these are intentionally untranslated or if they should be localized:
- `projectManager.activitybar.title`: "Project Manager"
- `projectManager.editor.title.label`: "Project Manager"

(Note: Some terms like "Project Manager" may be intentionally kept in English depending on localization guidelines)
```

## Automated Checks to Run

If possible, recommend or run:

1. **JSON validation**: `jq . package.nls.{LANGID}.json` or Node.js `JSON.parse()`
2. **Key comparison**: Compare keys between base and localized files
3. **Encoding check**: Verify UTF-8 encoding
4. **Placeholder verification**: Regex to find `{n}` patterns and ensure they match

## Exceptions and Edge Cases

1. **Product names** - May remain in English: "Project Manager", "VS Code"
2. **Technical terms** - Some terms may be transliterated rather than translated
3. **Command IDs** - Must never be translated: `command:projectManager.saveProject`
4. **Setting keys** - Must never be translated: `projectManager.configuration.title`
5. **Partial translations** - In-progress work may have some untranslated strings; verify with PR description

## Final Recommendation Format

Provide a structured review:

```markdown
## Localization Review Summary

**Language**: {language name} ({language code})
**Files Changed**: {count} files

### ✅ Passed Checks
- All required keys present
- Valid JSON syntax
- Proper file locations
- Placeholders preserved

### ⚠️ Issues Found
1. [Priority] {Issue description} in {file}:{line}
2. [Priority] {Issue description} in {file}:{line}

### 💡 Suggestions
- {Optional improvement suggestion}

### Overall Assessment
{Approve / Request Changes / Comment}
```

## Resources

- [VS Code Extension Localization Guide](https://code.visualstudio.com/api/extension-guides/localization)
- [BCP 47 Language Codes](https://tools.ietf.org/html/bcp47)
- Project localization skill: `.github/skills/vscode-ext-localization/SKILL.md`
