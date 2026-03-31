# globalState Storage, Group Hierarchy, and Export/Import — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move project storage from `projects.json` to synced `globalState`, add hierarchical group organization, and provide export/import commands.

**Architecture:** `ProjectStorage` switches from file I/O to `globalState` backed by `ExtensionContext`. A `group` field on `Project` enables folder-like hierarchy. `StorageProvider` gains a third view mode (`viewAsGroups`). Export/Import commands compensate for loss of direct JSON editing.

**Tech Stack:** TypeScript, VS Code Extension API (`globalState`, `setKeysForSync`, `TreeDataProvider`), Mocha tests.

**Spec:** `docs/superpowers/specs/2026-03-31-globalstate-storage-and-hierarchy-design.md`

---

### Task 1: Add `group` Field to Project Interface

**Files:**
- Modify: `src/core/project.ts`
- Modify: `src/test/suite/storage.test.ts`

- [ ] **Step 1: Update Project interface and createProject factory**

In `src/core/project.ts`, add `group: string` to `Project` and update `createProject`:

```typescript
export interface Project {
    name: string;
    rootPath: string;
    paths: string[];
    tags: string[];
    enabled: boolean;
    profile: string;
    group: string;
}

export function createProject(name: string, rootPath: string, group: string = ""): Project {
    const newProject: Project = {
        name,
        rootPath,
        paths: [],
        tags: [],
        enabled: true,
        profile: "",
        group
    };
    return newProject;
}
```

- [ ] **Step 2: Add normalizeGroupPath utility**

In `src/core/project.ts`, add:

```typescript
export function normalizeGroupPath(group: string): string {
    return group
        .trim()
        .replace(/\/+/g, "/")
        .replace(/^\/|\/$/g, "");
}
```

- [ ] **Step 3: Write tests for normalizeGroupPath**

In `src/test/suite/storage.test.ts`, add a new suite at the bottom:

```typescript
suite("normalizeGroupPath", () => {
    test("trims whitespace", () => {
        assert.strictEqual(normalizeGroupPath("  Work  "), "Work");
    });

    test("collapses consecutive slashes", () => {
        assert.strictEqual(normalizeGroupPath("Work//Frontend"), "Work/Frontend");
    });

    test("strips leading and trailing slashes", () => {
        assert.strictEqual(normalizeGroupPath("/Work/Frontend/"), "Work/Frontend");
    });

    test("handles empty string", () => {
        assert.strictEqual(normalizeGroupPath(""), "");
    });

    test("handles complex case", () => {
        assert.strictEqual(normalizeGroupPath("  /Work///Frontend/ "), "Work/Frontend");
    });
});
```

Add this import at top of test file:

```typescript
import { normalizeGroupPath } from "../../core/project";
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test-compile && npm run test`
Expected: All tests pass including new `normalizeGroupPath` suite.

- [ ] **Step 5: Commit**

```bash
git add src/core/project.ts src/test/suite/storage.test.ts
git commit -m "feat: add group field to Project interface with normalizeGroupPath utility"
```

---

### Task 2: Add `editGroup` Method to ProjectStorage

**Files:**
- Modify: `src/storage/storage.ts`
- Modify: `src/test/suite/storage.test.ts`

- [ ] **Step 1: Write failing test for editGroup**

In `src/test/suite/storage.test.ts`, inside the `ProjectStorage` suite, add:

```typescript
test("editGroup updates project group with normalization", () => {
    const filename = createTempFilename();
    const storage = new ProjectStorage(filename);

    storage.push("MyProject", "/path/project");
    storage.editGroup("myproject", "Work/Frontend");

    const project = storage.existsWithRootPath("/path/project");
    assert.ok(project);
    assert.strictEqual(project!.group, "Work/Frontend");
});

test("editGroup normalizes group path", () => {
    const filename = createTempFilename();
    const storage = new ProjectStorage(filename);

    storage.push("MyProject", "/path/project");
    storage.editGroup("myproject", "  /Work//Frontend/ ");

    const project = storage.existsWithRootPath("/path/project");
    assert.ok(project);
    assert.strictEqual(project!.group, "Work/Frontend");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test-compile`
Expected: Compile error — `editGroup` does not exist on `ProjectStorage`.

- [ ] **Step 3: Implement editGroup in ProjectStorage**

In `src/storage/storage.ts`, add import and method:

Add to imports at top:
```typescript
import { createProject, Project, normalizeGroupPath } from "../core/project";
```

(Replace existing `import { createProject, Project } from "../core/project";`)

Add method to `ProjectStorage` class:

```typescript
public editGroup(name: string, group: string): void {
    for (const element of this.projects) {
        if (element.name.toLowerCase() === name.toLowerCase()) {
            element.group = normalizeGroupPath(group);
            return;
        }
    }
}
```

- [ ] **Step 4: Update load() to handle missing group field**

In `src/storage/storage.ts`, in the `load()` method, update the v2 default mapping to include `group`:

Change the defaults object from:
```typescript
this.projects = (items as Array<Partial<Project>>).map(item => ({
    name: "",
    rootPath: "",
    paths: [],
    tags: [],
    enabled: true,
    profile: "",
    ...item
}));
```

To:
```typescript
this.projects = (items as Array<Partial<Project>>).map(item => ({
    name: "",
    rootPath: "",
    paths: [],
    tags: [],
    enabled: true,
    profile: "",
    group: "",
    ...item
}));
```

And update the sanitization map below it to include `group`:

```typescript
this.projects = this.projects.map(project => ({
    name: project.name,
    rootPath: project.rootPath,
    paths: project.paths,
    tags: project.tags,
    enabled: project.enabled,
    profile: project.profile,
    group: project.group
}));
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test-compile && npm run test`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/storage/storage.ts src/test/suite/storage.test.ts
git commit -m "feat: add editGroup method to ProjectStorage with group normalization"
```

---

### Task 3: Refactor ProjectStorage from File I/O to globalState

**Files:**
- Modify: `src/storage/storage.ts`
- Modify: `src/test/suite/storage.test.ts`
This is the biggest change. `ProjectStorage` constructor changes from `(filename: string)` to `(globalState: vscode.Memento)`. Note: the spec says `constructor(context: ExtensionContext)` but we intentionally inject just `Memento` for testability.

- [ ] **Step 1: Write new tests using MockMemento**

In `src/test/suite/storage.test.ts`, add a new suite that tests the globalState-based storage. The old file-based tests will be removed after migration.

```typescript
suite("ProjectStorage (globalState)", () => {
    function createGlobalStateStorage(): ProjectStorage {
        const memento = new MockMemento();
        return new ProjectStorage(memento);
    }

    test("push and length track added projects", () => {
        const storage = createGlobalStateStorage();
        assert.strictEqual(storage.length(), 0);
        storage.push("Project A", "/path/a");
        storage.push("Project B", "/path/b");
        assert.strictEqual(storage.length(), 2);
    });

    test("save and load round-trip via globalState", async () => {
        const memento = new MockMemento();
        const storage = new ProjectStorage(memento);

        storage.push("A", "/path/a");
        storage.editTags("A", ["x"]);
        storage.editGroup("A", "Work");
        await storage.save();

        const storage2 = new ProjectStorage(memento);
        storage2.load();
        assert.strictEqual(storage2.length(), 1);
        assert.ok(storage2.exists("A"));

        const project = storage2.existsWithRootPath("/path/a");
        assert.ok(project);
        assert.deepStrictEqual(project!.tags, ["x"]);
        assert.strictEqual(project!.group, "Work");
    });

    test("load with empty globalState returns no error", () => {
        const storage = createGlobalStateStorage();
        const error = storage.load();
        assert.strictEqual(error, "");
        assert.strictEqual(storage.length(), 0);
    });

    test("load fills missing fields with defaults", async () => {
        const memento = new MockMemento();
        await memento.update("projectManager.projects", [
            { name: "Legacy", rootPath: "/legacy" }
        ]);

        const storage = new ProjectStorage(memento);
        storage.load();
        assert.strictEqual(storage.length(), 1);

        const project = storage.existsWithRootPath("/legacy");
        assert.ok(project);
        assert.deepStrictEqual(project!.tags, []);
        assert.strictEqual(project!.group, "");
        assert.strictEqual(project!.enabled, true);
    });
});
```

Add import at top:
```typescript
import { MockMemento } from "./mocks/MockMemento";
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test-compile`
Expected: Compile error — `ProjectStorage` constructor expects `string`, not `Memento`.

- [ ] **Step 3: Rewrite ProjectStorage to use globalState**

Replace the entire `src/storage/storage.ts` with:

```typescript
/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Memento, Uri } from "vscode";
import { PathUtils } from "../utils/path";
import { isRemotePath } from "../utils/remote";
import { createProject, normalizeGroupPath, Project } from "../core/project";
import { NO_TAGS_DEFINED } from "../sidebar/constants";

const STORAGE_KEY = "projectManager.projects";

export class ProjectStorage {

    private projects: Project[];
    private globalState: Memento;

    constructor(globalState: Memento) {
        this.globalState = globalState;
        this.projects = [];
    }

    public push(name: string, rootPath: string): void {
        this.projects.push(createProject(name, rootPath));
        return;
    }

    public pop(name: string): Project {
        for (let index = 0; index < this.projects.length; index++) {
            const element: Project = this.projects[ index ];
            if (element.name.toLowerCase() === name.toLowerCase()) {
                return this.projects.splice(index, 1)[ 0 ];
            }
        }
    }

    public rename(oldName: string, newName: string): void {
        for (const element of this.projects) {
            if (element.name.toLowerCase() === oldName.toLowerCase()) {
                element.name = newName;
                return;
            }
        }
    }

    public editTags(name: string, tags: string[]): void {
        for (const element of this.projects) {
            if (element.name.toLowerCase() === name.toLowerCase()) {
                element.tags = tags;
                return;
            }
        }
    }

    public editGroup(name: string, group: string): void {
        for (const element of this.projects) {
            if (element.name.toLowerCase() === name.toLowerCase()) {
                element.group = normalizeGroupPath(group);
                return;
            }
        }
    }

    public toggleEnabled(name: string): boolean | undefined {
        for (const element of this.projects) {
            if (element.name.toLowerCase() === name.toLowerCase()) {
                element.enabled = !element.enabled;
                return element.enabled;
            }
        }
    }

    public disabled(): Array<Project> | undefined {
        return this.projects.filter(project => !project.enabled);
    }

    public updateRootPath(name: string, path: string): void {
        for (const element of this.projects) {
            if (element.name.toLowerCase() === name.toLowerCase()) {
                element.rootPath = path;
            }
        }
    }

    public exists(name: string): boolean {
        let found = false;

        for (const element of this.projects) {
            if (element.name.toLocaleLowerCase() === name.toLocaleLowerCase()) {
                found = true;
            }
        }
        return found;
    }

    public existsWithRootPath(rootPath: string, returnExpandedHomePath: boolean = false): Project {
        for (const element of this.projects) {
            const elementPath = PathUtils.expandHomePath(element.rootPath);
            if ((elementPath.toLocaleLowerCase() === rootPath.toLocaleLowerCase()) || (elementPath === rootPath)) {
                if (returnExpandedHomePath) {
                    return {
                        ...element,
                        rootPath: elementPath
                    };
                }
                return element;
            }
        }
    }

    public existsRemoteWithRootPath(uri: Uri): Project {
        for (const element of this.projects) {
            if (!isRemotePath(element.rootPath)) { continue; }

            const uriElement = Uri.parse(element.rootPath);
            if (uriElement.path === uri.path) {
                return element;
            }
        }
    }

    public length(): number {
        return this.projects.length;
    }

    public load(): string {
        try {
            const items = this.globalState.get<Array<Partial<Project>>>(STORAGE_KEY, []);

            this.projects = items.map(item => ({
                name: "",
                rootPath: "",
                paths: [],
                tags: [],
                enabled: true,
                profile: "",
                group: "",
                ...item
            }));

            this.projects = this.projects.map(project => ({
                name: project.name,
                rootPath: project.rootPath,
                paths: project.paths,
                tags: project.tags,
                enabled: project.enabled,
                profile: project.profile,
                group: project.group
            }));

            this.updatePaths();
            return "";
        } catch (error) {
            console.log(error);
            return error.toString();
        }
    }

    public async save(): Promise<void> {
        await this.globalState.update(STORAGE_KEY, this.projects);
    }

    public getProjects(): Project[] {
        return [...this.projects];
    }

    public setProjects(projects: Project[]): void {
        this.projects = projects;
    }

    public map(): any {
        const newItems = this.projects.filter(item => item.enabled).map(item => {
            return {
                label: item.name,
                description: item.rootPath,
                profile: item.profile
            };
        });
        return newItems;
    }

    private updatePaths(): void {
        for (const project of this.projects) {
            if (!isRemotePath(project.rootPath)) {
                project.rootPath = PathUtils.updateWithPathSeparatorStr(project.rootPath);
            }
        }
    }

    public getAvailableTags(): string[] {
        const tags: string[] = [];
        for (const project of this.projects) {
            tags.push(...project.tags);
        }
        const tagsSet = new Set(tags);
        return [ ...tagsSet ];
    }

    public getProjectsByTag(tag: string): any {
        const newItems = this.projects.filter(item => item.enabled && (item.tags.includes(tag) || (tag === '' && item.tags.length === 0))).map(item => {
            return {
                label: item.name,
                description: item.rootPath
            };
        });
        return newItems;
    }

    public getProjectsByTags(tags: string[]): any {
        const newItems = this.projects.filter(
            item => item.enabled
                && (item.tags.some(t => tags.includes(t))
                    || ((tags.length === 0 || tags.includes(NO_TAGS_DEFINED) && item.tags.length === 0)
                    ))
        ).map(item => {
            return {
                label: item.name,
                description: item.rootPath,
                profile: item.profile
            };
        });
        return newItems;
    }

}
```

Key changes:
- Constructor takes `Memento` instead of `string`
- `load()` reads from `globalState.get()` instead of `fs.readFileSync`
- `save()` is now `async`, calls `globalState.update()` instead of `fs.writeFileSync`
- Removed `fs` import
- Added `getProjects()` and `setProjects()` for export/import
- v1 migration removed from `load()` (handled separately in migration logic)

- [ ] **Step 4: Update existing storage tests to use MockMemento**

Replace all file-based `ProjectStorage` tests. Every test that does `new ProjectStorage(filename)` changes to `new ProjectStorage(new MockMemento())`. Remove `createTempFilename()` helper. Remove `fs.unlinkSync` cleanup calls. Change `storage.save()` to `await storage.save()` and make test functions `async`.

The `save and load` test changes to:
```typescript
test("save and load preserve projects in v2 format", async () => {
    const memento = new MockMemento();
    const storage = new ProjectStorage(memento);

    storage.push("A", "/path/a");
    storage.push("B", "/path/b");
    storage.editTags("A", [ "x" ]);
    storage.editTags("B", [ "y" ]);

    await storage.save();

    const loadedStorage = new ProjectStorage(memento);
    const error = loadedStorage.load();
    assert.strictEqual(error, "");
    assert.strictEqual(loadedStorage.length(), 2);
    assert.ok(loadedStorage.exists("A"));
    assert.ok(loadedStorage.exists("B"));

    const tags = loadedStorage.getAvailableTags().sort();
    assert.deepStrictEqual(tags, [ "x", "y" ]);
});
```

The v1 migration test is removed (v1 migration moves to the migration module).

- [ ] **Step 5: Run tests**

Run: `npm run test-compile && npm run test`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/storage/storage.ts src/test/suite/storage.test.ts
git commit -m "refactor: switch ProjectStorage from file I/O to globalState"
```

---

### Task 4: Migration Logic from projects.json

**Files:**
- Create: `src/storage/migration.ts`
- Modify: `src/extension.ts`

- [ ] **Step 1: Create migration module**

Create `src/storage/migration.ts`:

```typescript
/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import fs = require("fs");
import path = require("path");
import * as vscode from "vscode";
import { Project } from "../core/project";
import { PathUtils } from "../utils/path";
import { PROJECTS_FILE } from "../core/constants";

const MIGRATION_COMPLETED_KEY = "projectManager.migrationCompleted";
const STORAGE_KEY = "projectManager.projects";

export function needsMigration(globalState: vscode.Memento): boolean {
    return !globalState.get<boolean>(MIGRATION_COMPLETED_KEY, false);
}

export async function migrateFromFile(
    globalState: vscode.Memento,
    projectsLocation: string
): Promise<{ migrated: boolean; count: number }> {
    const filePath = getProjectFilePath(projectsLocation);

    if (!fs.existsSync(filePath)) {
        await globalState.update(MIGRATION_COMPLETED_KEY, true);
        return { migrated: false, count: 0 };
    }

    try {
        const content = fs.readFileSync(filePath).toString();
        let items: Array<any> = JSON.parse(content);

        let projects: Project[];

        if (items.length > 0 && items[0].label) {
            projects = items.map(item => ({
                name: item.label || "",
                rootPath: item.description || "",
                paths: [],
                tags: [],
                enabled: true,
                profile: "",
                group: ""
            }));
        } else {
            projects = items.map(item => ({
                name: item.name || "",
                rootPath: item.rootPath || "",
                paths: item.paths || [],
                tags: item.tags || [],
                enabled: item.enabled !== undefined ? item.enabled : true,
                profile: item.profile || "",
                group: item.group || ""
            }));
        }

        await globalState.update(STORAGE_KEY, projects);
        await globalState.update(MIGRATION_COMPLETED_KEY, true);

        return { migrated: true, count: projects.length };
    } catch (error) {
        console.error("Migration failed:", error);
        throw error;
    }
}

function getProjectFilePath(projectsLocation: string): string {
    if (projectsLocation !== "") {
        return path.join(PathUtils.expandHomePath(projectsLocation), PROJECTS_FILE);
    }
    return PathUtils.getFilePathFromAppData(PROJECTS_FILE);
}
```

- [ ] **Step 2: Update extension.ts to use migration and globalState**

In `src/extension.ts`, make these changes:

Remove the `fs` import (no longer needed for project file operations).

Replace:
```typescript
const projectStorage: ProjectStorage = new ProjectStorage(getProjectFilePath());
```
With:
```typescript
context.globalState.setKeysForSync(["projectManager.projects"]);

if (needsMigration(context.globalState)) {
    try {
        const projectsLocation = vscode.workspace.getConfiguration("projectManager").get<string>("projectsLocation", "");
        const result = await migrateFromFile(context.globalState, projectsLocation);
        if (result.migrated) {
            vscode.window.showInformationMessage(
                l10n.t("Projects migrated from projects.json to synced storage. ({0} projects)", result.count)
            );
        }
    } catch {
        vscode.window.showErrorMessage(
            l10n.t("Failed to migrate projects.json. You can use Import Projects to load them manually.")
        );
    }
}

const projectStorage: ProjectStorage = new ProjectStorage(context.globalState);
```

Add imports at top:
```typescript
import { needsMigration, migrateFromFile } from "./storage/migration";
```

Remove `getProjectFilePath()` function (at bottom of activate).

Remove `fs.watchFile(getProjectFilePath(), ...)` block.

Remove `fs` import from the file header.

Update `editProjects()` function to trigger export instead:
```typescript
function editProjects() {
    vscode.commands.executeCommand("projectManager.exportProjects");
}
```

Update `folderNotFound` in `src/quickpick/projectsPicker.ts`: change `projectStorage.save()` to `await projectStorage.save()` and make `folderNotFound` async. All call sites that use `projectStorage.save()` across the codebase must be updated to `await`.

Update all `projectStorage.save()` calls to `await projectStorage.save()`. This requires making the calling functions `async` if they aren't already. Affected functions:
- `saveProjectInternal` — already returns `Promise`, add `await`
- `deleteProject` — make async, add `await`
- `renameProject` — inner callback already has `async` potential, add `await`
- `editTags` — already async, add `await`
- `toggleProjectEnabled` — make async, add `await`

- [ ] **Step 3: Fix loadProjectsFile**

`loadProjectsFile()` in `extension.ts` no longer needs special JSON error handling (globalState won't have parse errors). Simplify to:

```typescript
function loadProjectsFile() {
    const errorLoading: string = projectStorage.load();
    if (errorLoading !== "") {
        vscode.window.showErrorMessage(
            l10n.t("Error loading projects: {0}", errorLoading)
        );
    }
}
```

- [ ] **Step 4: Build and fix compile errors**

Run: `npm run compile`
Expected: Fix any remaining compile errors from the refactoring.

- [ ] **Step 5: Run lint**

Run: `npm run lint`
Expected: No new lint errors.

- [ ] **Step 6: Commit**

```bash
git add src/storage/migration.ts src/extension.ts
git commit -m "feat: add migration from projects.json to globalState with sync support"
```

---

### Task 5: Update View Mode System (Three-State)

**Files:**
- Modify: `src/sidebar/constants.ts`
- Modify: `src/extension.ts`

- [ ] **Step 1: Update ViewFavoritesAs enum**

In `src/sidebar/constants.ts`, change:

```typescript
export enum ViewFavoritesAs { VIEW_AS_LIST, VIEW_AS_TAGS }
```

To:

```typescript
export enum ViewFavoritesAs { VIEW_AS_LIST, VIEW_AS_TAGS, VIEW_AS_GROUPS }
```

- [ ] **Step 2: Update view toggle logic in extension.ts**

Replace the `toggleViewAsFavoriteProjects` function and related code.

Replace the `viewAsList` initialization block:
```typescript
const viewAsList = Container.context.globalState.get<boolean>("viewAsList", true);
vscode.commands.executeCommand("setContext", "projectManager.viewAsList", viewAsList);
```

With:
```typescript
const viewMode = getViewMode();
setViewModeContext(viewMode);
```

Add helper functions inside `activate()`:

```typescript
function getViewMode(): string {
    const stored = Container.context.globalState.get<string>("favoritesViewMode", undefined);
    if (stored !== undefined) {
        return stored;
    }
    const legacyViewAsList = Container.context.globalState.get<boolean>("viewAsList", true);
    const mode = legacyViewAsList ? "list" : "tags";
    Container.context.globalState.update("favoritesViewMode", mode);
    Container.context.globalState.update("viewAsList", undefined);
    return mode;
}

function setViewModeContext(mode: string) {
    vscode.commands.executeCommand("setContext", "projectManager.favoritesViewMode", mode);
    // Backward compat: keep the old boolean for any external consumers
    vscode.commands.executeCommand("setContext", "projectManager.viewAsList", mode === "list");
}

async function setViewMode(mode: string) {
    await Container.context.globalState.update("favoritesViewMode", mode);
    setViewModeContext(mode);
    providerManager.refreshTreeViews();
}
```

Replace `toggleViewAsFavoriteProjects`:
```typescript
function toggleViewAsFavoriteProjects(view: ViewFavoritesAs) {
    switch (view) {
        case ViewFavoritesAs.VIEW_AS_LIST:
            setViewMode("list");
            break;
        case ViewFavoritesAs.VIEW_AS_TAGS:
            setViewMode("tags");
            break;
        case ViewFavoritesAs.VIEW_AS_GROUPS:
            setViewMode("groups");
            break;
    }
}
```

- [ ] **Step 3: Register viewAsGroups command**

In `src/extension.ts`, add after the existing viewAsList/viewAsTags registrations:

```typescript
vscode.commands.registerCommand("_projectManager.viewAsGroups#sideBarFavorites", () => toggleViewAsFavoriteProjects(ViewFavoritesAs.VIEW_AS_GROUPS));
```

Update the import from `./sidebar/constants` to include `ViewFavoritesAs.VIEW_AS_GROUPS` (it's already imported via `ViewFavoritesAs`).

- [ ] **Step 4: Build**

Run: `npm run compile`
Expected: No compile errors.

- [ ] **Step 5: Commit**

```bash
git add src/sidebar/constants.ts src/extension.ts
git commit -m "feat: add three-state view mode (list, tags, groups)"
```

---

### Task 6: Add GroupNode and Update StorageProvider for viewAsGroups

**Files:**
- Modify: `src/sidebar/nodes.ts`
- Modify: `src/sidebar/storageProvider.ts`
- Modify: `src/test/suite/storageProvider.test.ts`

- [ ] **Step 1: Add GroupNode to nodes.ts**

In `src/sidebar/nodes.ts`, add:

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

- [ ] **Step 2: Update StorageProvider to handle GroupNode and viewAsGroups**

In `src/sidebar/storageProvider.ts`:

Update the class declaration to include `GroupNode`:
```typescript
export class StorageProvider implements vscode.TreeDataProvider<ProjectNode | TagNode | GroupNode> {
```

Update imports:
```typescript
import { GroupNode, NoTagNode, ProjectNode, TagNode } from "./nodes";
```

Update `onDidChangeTreeData` and `internalOnDidChangeTreeData` types to include `GroupNode`.

Update `getTreeItem` and `getChildren` signatures accordingly.

In `getChildren`, before the existing `viewAsTags` check, add the `viewAsGroups` path:

```typescript
public getChildren(element?: ProjectNode | TagNode | GroupNode): Thenable<ProjectNode[] | TagNode[] | GroupNode[]> {
    return new Promise(resolve => {
        if (element) {
            if (element instanceof GroupNode) {
                resolve(this.getGroupChildren(element));
                return;
            }

            // existing TagNode children logic...
            const nodes: ProjectNode[] = [];
            let projectsMapped = <ProjectInQuickPickList>this.projectSource.getProjectsByTag(element.label);
            // ... rest of existing code
        } else { // ROOT
            if (this.projectSource.length() === 0) {
                return resolve([]);
            }

            const viewMode = Container.context.globalState.get<string>("favoritesViewMode",
                Container.context.globalState.get<boolean>("viewAsList", true) ? "list" : "tags");

            if (viewMode === "groups") {
                resolve(this.getGroupRootChildren());
                return;
            }

            if (viewMode === "tags") {
                // existing viewAsTags logic (currently under `if (!viewAsList)`)
                // ...
            }

            // existing viewAsList logic...
        }
    });
}
```

Add private methods for group tree building:

```typescript
private getGroupRootChildren(): (ProjectNode | GroupNode)[] {
    let projects = this.getFilteredEnabledProjects();
    projects = sortProjects(projects.map(p => ({
        label: p.name, description: p.rootPath, profile: p.profile
    }))).map(sorted => projects.find(p => p.name === sorted.label)!);

    return this.buildGroupLevel(projects, "");
}

private getGroupChildren(groupNode: GroupNode): (ProjectNode | GroupNode)[] {
    let projects = this.getFilteredEnabledProjects();
    return this.buildGroupLevel(projects, groupNode.groupPath);
}

private getFilteredEnabledProjects(): Array<{ name: string; rootPath: string; profile: string; group: string; tags: string[] }> {
    const allProjects = this.projectSource.getProjects().filter(p => p.enabled);
    const filterByTags = Container.context.globalState.get<string[]>("filterByTags", []);
    if (filterByTags.length === 0) {
        return allProjects;
    }
    return allProjects.filter(p =>
        p.tags.some(t => filterByTags.includes(t)) ||
        (filterByTags.includes(NO_TAGS_DEFINED) && p.tags.length === 0)
    );
}

private buildGroupLevel(projects: Array<any>, parentPath: string): (ProjectNode | GroupNode)[] {
    const projectNodes: ProjectNode[] = [];
    const childGroupNames = new Set<string>();

    for (const project of projects) {
        const group: string = project.group || "";
        const isChild = parentPath === ""
            ? group === ""
            : group === parentPath;
        const isDescendant = parentPath === ""
            ? group !== ""
            : group.startsWith(parentPath + "/");

        if (isChild) {
            projectNodes.push(this.createProjectNode(project));
        } else if (isDescendant) {
            const remainder = parentPath === ""
                ? group
                : group.substring(parentPath.length + 1);
            childGroupNames.add(remainder.split("/")[0]);
        }
    }

    const groupNodes: GroupNode[] = [...childGroupNames].sort().map(name => {
        const fullPath = parentPath === "" ? name : `${parentPath}/${name}`;
        return new GroupNode(name, fullPath, vscode.TreeItemCollapsibleState.Expanded);
    });

    return [...groupNodes, ...projectNodes];
}

private createProjectNode(project: any): ProjectNode {
    const prjPath = PathUtils.expandHomePath(project.rootPath);
    let iconFavorites = "favorites";
    if (path.extname(prjPath) === ".code-workspace") {
        iconFavorites = "favorites-workspace";
    } else if (isRemotePath(prjPath)) {
        iconFavorites = "favorites-remote";
    }
    return new ProjectNode(project.name, vscode.TreeItemCollapsibleState.None,
        iconFavorites, {
            name: project.name,
            path: prjPath
        }, {
            command: "_projectManager.open",
            title: "",
            arguments: [prjPath, project.name, project.profile],
        });
}
```

Add missing imports at top of file:
```typescript
import path = require("path");
```
(if not already present — check existing imports)

- [ ] **Step 3: Update providers.ts TreeView type**

In `src/sidebar/providers.ts`:

Update import to include `GroupNode`:
```typescript
import { GroupNode, ProjectNode, TagNode } from "./nodes";
```

Update `storageTreeView` type:
```typescript
private storageTreeView: vscode.TreeView<ProjectNode | TagNode | GroupNode>;
```

Update `handleStorageTreeViewExpansionChange` signature:
```typescript
private async handleStorageTreeViewExpansionChange(event: vscode.TreeViewExpansionEvent<ProjectNode | TagNode | GroupNode>, state: "expanded" | "collapsed") {
```

- [ ] **Step 4: Build and verify**

Run: `npm run compile`
Expected: No compile errors.

- [ ] **Step 5: Commit**

```bash
git add src/sidebar/nodes.ts src/sidebar/storageProvider.ts src/sidebar/providers.ts
git commit -m "feat: add GroupNode and viewAsGroups tree rendering in StorageProvider"
```

---

### Task 7: Add editGroup Command

**Files:**
- Modify: `src/extension.ts`

- [ ] **Step 1: Register editGroup command**

In `src/extension.ts`, add after the `_projectManager.editTags` registration:

```typescript
vscode.commands.registerCommand("_projectManager.editGroup", async (node: ProjectNode) => {
    const project = projectStorage.existsWithRootPath(node.command.arguments[0]);
    if (!project) {
        return;
    }

    const currentGroup = project.group || "";
    const ibo = <vscode.InputBoxOptions>{
        prompt: l10n.t("Group Path (e.g. Work/Frontend)"),
        placeHolder: l10n.t("Type a group path, or leave empty for root level"),
        value: currentGroup
    };

    const newGroup = await vscode.window.showInputBox(ibo);
    if (newGroup === undefined) {
        return;
    }

    projectStorage.editGroup(project.name, newGroup);
    await projectStorage.save();
    providerManager.updateTreeViewStorage();
    vscode.window.showInformationMessage(l10n.t("Project group updated!"));
});
```

- [ ] **Step 2: Build**

Run: `npm run compile`
Expected: No compile errors.

- [ ] **Step 3: Commit**

```bash
git add src/extension.ts
git commit -m "feat: add editGroup command for setting project hierarchy"
```

---

### Task 8: Add Export/Import Commands

**Files:**
- Create: `src/commands/exportImport.ts`
- Modify: `src/extension.ts`

- [ ] **Step 1: Create exportImport.ts**

Create `src/commands/exportImport.ts`:

```typescript
/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import fs = require("fs");
import * as vscode from "vscode";
import { Project } from "../core/project";
import { ProjectStorage } from "../storage/storage";

export async function exportProjects(projectStorage: ProjectStorage): Promise<void> {
    const projects = projectStorage.getProjects();

    const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file("projects.json"),
        filters: { "JSON": ["json"] }
    });

    if (!uri) {
        return;
    }

    const content = JSON.stringify(projects, null, "\t");
    fs.writeFileSync(uri.fsPath, content);
    vscode.window.showInformationMessage(
        vscode.l10n.t("Projects exported successfully.")
    );
}

export async function importProjects(
    projectStorage: ProjectStorage,
    onUpdate: () => void
): Promise<void> {
    const uris = await vscode.window.showOpenDialog({
        canSelectMany: false,
        filters: { "JSON": ["json"] }
    });

    if (!uris || uris.length === 0) {
        return;
    }

    let items: Array<any>;
    try {
        const content = fs.readFileSync(uris[0].fsPath).toString();
        items = JSON.parse(content);
    } catch {
        vscode.window.showErrorMessage(
            vscode.l10n.t("Invalid project file format.")
        );
        return;
    }

    if (!Array.isArray(items)) {
        vscode.window.showErrorMessage(
            vscode.l10n.t("Invalid project file format.")
        );
        return;
    }

    let projects: Project[];
    if (items.length > 0 && items[0].label) {
        projects = items.map(item => ({
            name: item.label || "",
            rootPath: item.description || "",
            paths: [],
            tags: [],
            enabled: true,
            profile: "",
            group: ""
        }));
    } else {
        projects = items.map(item => ({
            name: item.name || "",
            rootPath: item.rootPath || "",
            paths: item.paths || [],
            tags: item.tags || [],
            enabled: item.enabled !== undefined ? item.enabled : true,
            profile: item.profile || "",
            group: item.group || ""
        }));
    }

    const validProjects = projects.filter(p => p.name && p.rootPath);
    if (validProjects.length === 0) {
        vscode.window.showErrorMessage(
            vscode.l10n.t("No valid projects found in file.")
        );
        return;
    }

    const optionReplace = <vscode.MessageItem>{ title: vscode.l10n.t("Replace") };
    const optionMerge = <vscode.MessageItem>{ title: vscode.l10n.t("Merge") };
    const optionCancel = <vscode.MessageItem>{ title: vscode.l10n.t("Cancel") };

    const choice = await vscode.window.showInformationMessage(
        vscode.l10n.t("Found {0} projects. How would you like to import?", validProjects.length),
        optionReplace, optionMerge, optionCancel
    );

    if (!choice || choice === optionCancel) {
        return;
    }

    if (choice === optionReplace) {
        projectStorage.setProjects(validProjects);
    } else {
        const existing = projectStorage.getProjects();
        const merged = [...existing];

        for (const imported of validProjects) {
            const existingIndex = merged.findIndex(
                p => p.name.toLowerCase() === imported.name.toLowerCase()
            );
            if (existingIndex >= 0) {
                merged[existingIndex] = imported;
            } else {
                merged.push(imported);
            }
        }

        projectStorage.setProjects(merged);
    }

    await projectStorage.save();
    onUpdate();

    vscode.window.showInformationMessage(
        vscode.l10n.t("Imported {0} projects.", validProjects.length)
    );
}
```

- [ ] **Step 2: Register commands in extension.ts**

In `src/extension.ts`, add imports:

```typescript
import { exportProjects, importProjects } from "./commands/exportImport";
```

Register the commands (near the other command registrations):

```typescript
vscode.commands.registerCommand("projectManager.exportProjects", async () => { await exportProjects(projectStorage); });
vscode.commands.registerCommand("projectManager.importProjects", async () => { await importProjects(projectStorage, () => {
    loadProjectsFile();
    providerManager.storageProvider.refresh();
    providerManager.updateTreeViewStorage();
}); });
```

- [ ] **Step 3: Build**

Run: `npm run compile`
Expected: No compile errors.

- [ ] **Step 4: Commit**

```bash
git add src/commands/exportImport.ts src/extension.ts
git commit -m "feat: add export and import commands for project data"
```

---

### Task 9: Update Quick Pick to Show Group

**Files:**
- Modify: `src/quickpick/projectsPicker.ts`

- [ ] **Step 1: Show group in Quick Pick detail**

In `src/quickpick/projectsPicker.ts`, in the `pickProjects` function, update the mapping block where Quick Pick items are created. Change:

```typescript
folders = (<any[]>folders).map(folder => {
    return {
        label: folder.label,
        description: folder.description,
        profile: folder.profile,
        buttons: showOpenInNewWindowButton ? [ openInNewWindowButton ] : []
    };
});
```

To:

```typescript
folders = (<any[]>folders).map(folder => {
    return {
        label: folder.label,
        description: folder.description,
        detail: folder.group || undefined,
        profile: folder.profile,
        buttons: showOpenInNewWindowButton ? [ openInNewWindowButton ] : []
    };
});
```

Also update `getProjectsByTags` in `storage.ts` to include `group` in its return value. In the `map()` method and `getProjectsByTags`, add `group`:

In `storage.ts` `map()`:
```typescript
public map(): any {
    const newItems = this.projects.filter(item => item.enabled).map(item => {
        return {
            label: item.name,
            description: item.rootPath,
            profile: item.profile,
            group: item.group
        };
    });
    return newItems;
}
```

In `getProjectsByTags`:
```typescript
return {
    label: item.name,
    description: item.rootPath,
    profile: item.profile,
    group: item.group
};
```

In `getProjectsByTag`:
```typescript
return {
    label: item.name,
    description: item.rootPath,
    group: item.group
};
```

- [ ] **Step 2: Build**

Run: `npm run compile`
Expected: No compile errors.

- [ ] **Step 3: Commit**

```bash
git add src/quickpick/projectsPicker.ts src/storage/storage.ts
git commit -m "feat: show project group in Quick Pick detail line"
```

---

### Task 10: Update package.json and Localization

**Files:**
- Modify: `package.json`
- Modify: `package.nls.json`

- [ ] **Step 1: Add new commands to package.json**

In `package.json`, in the `"commands"` array, add:

```json
{
    "command": "projectManager.exportProjects",
    "title": "%projectManager.commands.exportProjects.title%"
},
{
    "command": "projectManager.importProjects",
    "title": "%projectManager.commands.importProjects.title%"
},
{
    "command": "_projectManager.editGroup",
    "title": "%projectManager.commands.editGroup.title%"
},
{
    "command": "_projectManager.viewAsGroups#sideBarFavorites",
    "title": "%projectManager.commands.viewAsGroups#sideBarFavorites.title%",
    "icon": "$(type-hierarchy)",
    "enablement": "projectManager.favoritesViewMode != 'groups'"
}
```

- [ ] **Step 2: Update when clauses for view toggle buttons**

Replace the existing `enablement` for viewAsTags and viewAsList:

For `_projectManager.viewAsTags#sideBarFavorites`:
```json
"enablement": "projectManager.favoritesViewMode == 'list'"
```

For `_projectManager.viewAsList#sideBarFavorites`:
```json
"enablement": "projectManager.favoritesViewMode != 'list'"
```

Update the `view/title` menu `when` clauses:

For viewAsTags button:
```json
"when": "view == projectsExplorerFavorites && projectManager.favoritesViewMode == 'list'"
```

For viewAsList button:
```json
"when": "view == projectsExplorerFavorites && projectManager.favoritesViewMode != 'list'"
```

Add viewAsGroups button to `view/title`:
```json
{
    "command": "_projectManager.viewAsGroups#sideBarFavorites",
    "when": "view == projectsExplorerFavorites && projectManager.favoritesViewMode != 'groups'",
    "group": "navigation@14"
}
```

- [ ] **Step 3: Add editGroup to context menu**

In `view/item/context`, add:

```json
{
    "command": "_projectManager.editGroup",
    "when": "view == projectsExplorerFavorites && viewItem == ProjectNodeKind",
    "group": "favorites"
}
```

- [ ] **Step 4: Hide internal commands from Command Palette**

In the `commandPalette` section, add:

```json
{
    "command": "_projectManager.editGroup",
    "when": "false"
},
{
    "command": "_projectManager.viewAsGroups#sideBarFavorites",
    "when": "false"
}
```

- [ ] **Step 5: Add to sidebar submenu**

In `projectManager.sideBar.favorites.title` submenu, add:

```json
{
    "command": "_projectManager.viewAsGroups#sideBarFavorites",
    "group": "1_projectManager#sideBarFavorites"
}
```

- [ ] **Step 6: Add localization keys to package.nls.json**

Add to `package.nls.json`:

```json
"projectManager.commands.exportProjects.title": "Project Manager: Export Projects",
"projectManager.commands.importProjects.title": "Project Manager: Import Projects",
"projectManager.commands.editGroup.title": "Edit Group",
"projectManager.commands.viewAsGroups#sideBarFavorites.title": "View as Groups",
```

Update the existing `editProjects` title:

```json
"projectManager.commands.editProjects.title": "Project Manager: Export Projects (formerly Edit)",
```

- [ ] **Step 7: Mark projectsLocation as deprecated**

In `package.json`, find the `projectManager.projectsLocation` configuration and add deprecation:

```json
"projectManager.projectsLocation": {
    "type": "string",
    "default": "",
    "description": "%projectManager.configuration.projectsLocation.description%",
    "deprecationMessage": "Projects are now stored in synced global state. Use Export/Import commands instead."
}
```

- [ ] **Step 8: Build and lint**

Run: `npm run build && npm run lint`
Expected: Build succeeds, no lint errors.

- [ ] **Step 9: Commit**

```bash
git add package.json package.nls.json
git commit -m "feat: register export/import/editGroup/viewAsGroups commands and update when clauses"
```

---

### Task 11: Final Validation

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: Clean build with no errors.

- [ ] **Step 2: Run all tests**

Run: `npm run test-compile && npm run test`
Expected: All tests pass.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: No lint errors.

- [ ] **Step 4: Manual validation in Extension Development Host**

Press F5 to launch Extension Development Host. Verify:
1. If existing `projects.json` exists → migration runs, projects appear in sidebar
2. View as Groups toggle appears and works
3. Right-click project → Edit Group → set group path
4. Export Projects command → saves JSON file
5. Import Projects command → loads from JSON file (test both Replace and Merge)
6. Quick Pick shows group in detail line
7. Settings Sync: `projectManager.projects` key is registered for sync

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address issues found during manual validation"
```
