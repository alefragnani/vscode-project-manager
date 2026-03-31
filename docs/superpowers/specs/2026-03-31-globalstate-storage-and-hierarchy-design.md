# Design: globalState Storage, Group Hierarchy, and Export/Import

**Date:** 2026-03-31
**Status:** Approved (rev 3)

## Summary

Three related changes to the Project Manager extension:

1. **globalState storage with sync** — Move project data from `projects.json` file to VS Code `globalState`, enabling cross-computer sync via Settings Sync.
2. **Group hierarchy** — Add a `group` field to `Project` for folder-like hierarchical organization.
3. **Export/Import** — Provide commands to export and import project data as JSON, compensating for the loss of direct file editing.

## Motivation

- Users want project lists to sync across machines without manual configuration.
- Flat project lists become unmanageable at scale; hierarchical grouping provides natural organization.
- Moving away from file-based storage removes the ability to hand-edit `projects.json`; export/import restores that capability.

---

## 1. globalState Storage with Sync

### Storage Mechanism

Replace `fs.readFileSync` / `fs.writeFileSync` in `ProjectStorage` with `ExtensionContext.globalState`:

- **Storage key:** `"projectManager.projects"`
- **Sync registration:** `context.globalState.setKeysForSync(["projectManager.projects"])` in `activate()`. UI preference keys like `favoritesViewMode` are intentionally **not** synced (view mode is a per-machine preference).
- **Load:** `context.globalState.get<Project[]>(STORAGE_KEY, [])`
- **Save:** `context.globalState.update(STORAGE_KEY, this.projects)`

### ProjectStorage Refactoring

`ProjectStorage` constructor changes from `(filename: string)` to accepting globalState access:

```typescript
constructor(context: ExtensionContext)
```

Internally replaces all `fs` operations with `globalState` calls.

`save()` becomes `async` (returns `Promise<void>`) since `globalState.update()` returns `Thenable`. All call sites must `await` it. `load()` becomes synchronous read from `globalState.get()` (already synchronous in the VS Code API).

### Migration from projects.json

A separate `globalState` flag `"projectManager.migrationCompleted"` tracks whether migration has run. This distinguishes "never migrated" from "user intentionally has zero projects."

On activation, if `migrationCompleted` is falsy:

1. Attempt to read `projects.json` from the legacy path (`getProjectFilePath()` logic).
2. If found, parse and write into `globalState`.
3. Add `group: ""` to each migrated project.
4. Set `migrationCompleted` to `true`.
5. **Do not delete** the old file (safety — user can manually remove later).
6. Show an information message: "Projects migrated from projects.json to synced storage."

If no legacy file exists, still set `migrationCompleted` to `true` (fresh install).

**Migration failure:** If reading or parsing the legacy file throws, do **not** set `migrationCompleted`, allowing retry on next activation. Show an error message with the option to import manually.

**Recovery after globalState wipe:** If `migrationCompleted` is true but `projects` is empty, that is a valid state (user has zero projects). Users who lose data can recover via Import command from a backup or the preserved legacy file.

### Deprecations and Removals

| Item | Action |
|------|--------|
| `projectManager.projectsLocation` setting | Mark deprecated in `package.json` (keep for migration path reading) |
| `fs.watchFile` on `projects.json` | Remove |
| `editProjects` command (opens JSON file) | Repurpose: trigger `projectManager.exportProjects` instead. Update command title to "Export Projects (formerly Edit)". Remove after one major version. |
| `getProjectFilePath()` in `extension.ts` | Keep as private helper for migration only |
| `PathUtils.getFilePathFromAppData()` | Keep for migration, no longer on critical path |

### Affected Files

- `src/storage/storage.ts` — Core refactoring (fs → globalState)
- `src/extension.ts` — Constructor change, remove `fs.watchFile`, register sync keys, migration logic
- `src/core/project.ts` — Add `group` field (see Section 2)
- `src/utils/path.ts` — No changes (kept for migration)
- `package.json` — Deprecate `projectsLocation` setting

---

## 2. Group Hierarchy

### Data Model

Add `group: string` to the `Project` interface:

```typescript
export interface Project {
    name: string;
    rootPath: string;
    paths: string[];
    tags: string[];
    enabled: boolean;
    profile: string;
    group: string;  // hierarchical path, e.g. "Work/Frontend"
}
```

Semantics:
- `""` — root level (ungrouped)
- `"Work"` — single level
- `"Work/Frontend"` — nested levels
- `/` is the separator
- A project belongs to exactly one group
- Normalization: trim whitespace, collapse consecutive `/`, strip leading/trailing `/`. Applied on save.

`createProject()` sets `group: ""` by default.

### Sidebar: New View Mode

Add `viewAsGroups` alongside existing `viewAsList` and `viewAsTags`:

| Mode | Tree Structure |
|------|----------------|
| `viewAsList` | Flat list (existing) |
| `viewAsTags` | Tag → Projects (existing) |
| `viewAsGroups` | Group folders → Subgroup folders → Projects (new) |

The view state stored in `globalState` changes from `boolean` (`viewAsList` key) to a string enum (`favoritesViewMode` key):

```typescript
type FavoritesViewMode = "list" | "tags" | "groups";
```

Backward compatibility: on first load, read old `viewAsList` boolean and convert (`true` → `"list"`, `false` → `"tags"`), write the new key, delete the old key.

Context keys for `package.json` `when` clauses:

| Old | New | Purpose |
|-----|-----|---------|
| `projectManager.viewAsList` (boolean) | `projectManager.favoritesViewMode` (string) | Controls which view mode toggle buttons are visible |

All existing `when` clauses like `"when": "projectManager.viewAsList"` must be updated to `"when": "projectManager.favoritesViewMode == 'list'"` etc. A third toggle button for groups is added to the sidebar title area.

### GroupNode

New tree item type in `src/sidebar/nodes.ts`:

```typescript
export class GroupNode extends TreeItem {
    constructor(
        public readonly label: string,
        public readonly groupPath: string,
        public readonly collapsibleState: TreeItemCollapsibleState,
    ) {
        super(label, collapsibleState);
        this.iconPath = ThemeIcons.folder;
        this.contextValue = "GroupNodeKind";
    }
}
```

### StorageProvider.getChildren() for viewAsGroups

- **Root call (element = undefined):**
  - Collect all unique first-level group segments from projects
  - Create `GroupNode` for each segment
  - Add ungrouped projects (`group: ""`) as `ProjectNode` at root level

- **GroupNode call:**
  - Filter projects whose `group` exactly equals `element.groupPath` OR starts with `element.groupPath + "/"` (strict path-prefix match to avoid `"Work"` matching `"Workshop"`)
  - Parse next-level segments → create child `GroupNode`s
  - Projects whose `group` exactly matches `element.groupPath` → create `ProjectNode`s

### Commands

| Command ID | Title | Description |
|------------|-------|-------------|
| `_projectManager.editGroup` | Edit Group | Right-click project → set/change group path |
| `_projectManager.viewAsGroups#sideBarFavorites` | View as Groups | Switch to group hierarchy view |

`editGroup` uses `InputBox` where user types the group path (e.g. `Work/Frontend`). Empty string moves the project to root level.

### Interaction with Tag Filtering

When `viewAsGroups` is active and `filterByTags` is set:

1. Filter projects by tags first (same logic as existing `viewAsList` + `filterByTags`).
2. Build the group tree from the filtered project set only.
3. Empty group folders (all children filtered out) are hidden.

This means tag filtering applies uniformly regardless of view mode.

### Quick Pick Integration

In `projectsPicker.ts`, when a project has a non-empty `group`, show it in the Quick Pick item's `detail`:

```
my-react-app    /Users/me/projects/my-react-app    Work/Frontend
```

### Affected Files

- `src/core/project.ts` — Add `group` field, update `createProject()`
- `src/sidebar/nodes.ts` — Add `GroupNode`
- `src/sidebar/storageProvider.ts` — Add `viewAsGroups` rendering logic
- `src/sidebar/constants.ts` — Add `ViewFavoritesAs.VIEW_AS_GROUPS`
- `src/storage/storage.ts` — Add `editGroup()` method (group tree logic stays in `StorageProvider` to avoid duplication)
- `src/extension.ts` — Register new commands, update view toggle logic
- `src/quickpick/projectsPicker.ts` — Show group in Quick Pick items
- `package.json` — Register commands, add menu contributions, update `when` clauses to exclude `GroupNodeKind` from project-only context menus

---

## 3. Export / Import

### Commands

| Command ID | Title | Location |
|------------|-------|----------|
| `projectManager.exportProjects` | Export Projects | Command Palette |
| `projectManager.importProjects` | Import Projects | Command Palette |

### Export Flow

1. Read `Project[]` from `globalState`.
2. Open `SaveDialog` with default filename `projects.json`, filter `*.json`.
3. Write JSON with `\t` indentation (consistent with legacy format).
4. Show success message.

### Import Flow

1. Open `OpenDialog`, filter `*.json`.
2. Read and parse JSON.
3. Validate format: must be `Project[]`, each item requires at least `name` and `rootPath`.
4. Prompt user with three options:
   - **Replace** — overwrite all existing projects
   - **Merge** — merge by name, case-insensitive (consistent with existing `exists()` / `rename()` behavior; imported project wins on conflict). If the import file itself contains duplicate names (case-insensitive), the last entry wins.
   - **Cancel** — abort
5. Fill missing fields with defaults (`group: ""`, `tags: []`, `enabled: true`, `paths: []`, `profile: ""`).
6. Write to `globalState`, refresh tree views.
7. Show success message: "Imported N projects."

### Backward Compatibility

Import supports legacy v1 format (`label`/`description` fields) using the same migration logic currently in `ProjectStorage.load()`.

### Affected Files

- `src/commands/exportImport.ts` — New file with export/import logic
- `src/extension.ts` — Register commands
- `package.json` — Command contributions
- `package.nls.json` — Localization keys

---

## Localization

All new user-facing strings use `l10n.t()`. New keys needed:

| Key | English Value |
|-----|---------------|
| Command: Export Projects | `"Export Projects"` |
| Command: Import Projects | `"Import Projects"` |
| Command: Edit Group | `"Edit Group"` |
| Command: View as Groups | `"View as Groups"` |
| Migration message | `"Projects migrated from projects.json to synced storage."` |
| Import prompt (Replace) | `"Replace"` |
| Import prompt (Merge) | `"Merge"` |
| Import success | `"Imported {0} projects."` |
| Export success | `"Projects exported successfully."` |
| Import validation error | `"Invalid project file format."` |
| Edit Group prompt | `"Group Path (e.g. Work/Frontend)"` |
| Edit Group placeholder | `"Type a group path, or leave empty for root level"` |

Manifest-level strings (command titles) use `%key%` placeholders in `package.json` with values in `package.nls.json`.

---

## Testing Strategy

### Unit Tests

- `ProjectStorage`: load/save via globalState mock, migration from JSON, group CRUD
- `StorageProvider.getChildren()`: viewAsGroups tree building with nested groups
- Export/Import: format validation, merge logic, v1 format migration

### Manual Validation

1. Fresh install → no migration, empty state works
2. Existing `projects.json` → migration populates globalState
3. Settings Sync → projects appear on second machine
4. Group CRUD → edit group, view as groups, Quick Pick shows group
5. Export → produces valid JSON matching legacy format (plus `group` field)
6. Import → Replace and Merge modes both work correctly
7. Import v1 format → migrates correctly

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| globalState size limit | Typical project lists (hundreds of entries) are well within practical limits; warn if export exceeds 1MB |
| Settings Sync conflict resolution | VS Code handles globalState merge; last-write-wins is acceptable for project lists |
| Breaking change for users who rely on `projects.json` file | Migration is automatic; export provides the same file; deprecation warning for `projectsLocation` |
| Group separator `/` in project names | `/` is only interpreted as separator in the `group` field, not in `name` |
