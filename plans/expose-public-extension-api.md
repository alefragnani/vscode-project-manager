# Plan: Expose Public Extension API (saveProject / getXXXProjects / getAllProjects)

> Note: Once approved, this plan file will be copied into the repository at
> `plans/expose-public-extension-api.md` as the first implementation step (plan mode
> cannot write outside the session folder).

## Problem

Project Manager currently has no public API for other extensions to consume. We need to expose
a documented, versioned API (per `.github/skills/vscode-ext-api`) supporting:

- `saveProject(name, rootPath, tags?, profile?)` — add a new favorite project.
- `getFavoriteProjects()` — list favorites from `ProjectStorage`.
- `getVSCodeProjects()`, `getGitProjects()`, `getMercurialProjects()`, `getSVNProjects()`, `getAnyProjects()`
  — list auto-detected projects per locator kind (from currently cached/located results only,
  no forced filesystem scan).
- `getAllProjects()` — consolidated list: favorites + all auto-detected kinds.

All "get" methods return a public `Project` shape: `{ name, rootPath, tags, profile, enabled }`
(no `paths`, no internal types).

## Design decisions (confirmed with user)

- Cover all 5 existing locators: VSCode, Git, Mercurial, SVN, Any.
- `getXXXProjects` return whatever is already cached/located by the locator — do not trigger
  `locateProjects()` scans (fast, non-blocking, no filesystem side effects from API calls).
- `saveProject` rejects (throws) if a project with the same name already exists in favorites.
- `saveProject` only persists to `projects.json` via `ProjectStorage` — it does NOT refresh the
  sidebar tree view or status bar (caller/UI will pick up changes on next natural refresh/reload).

## Approach

1. **Public API contract module** — new `/api/api.d.ts` (repo root `api/` folder, **not** under `src/`):
   - **Zero dependency on the rest of the project.** This file must contain only ambient
     TypeScript declarations (interfaces/types) — no imports from `src/`, no imports of `vscode`,
     no runtime code/logic/wrappers. It is a pure, standalone contract that consumers (and our
     own implementation) both depend on, but which depends on nothing internal.
   - Use the **MIT License** header (matching the convention used in `vscode-whats-new/src/*.ts`),
     instead of the repo's default GPLv3 header used elsewhere in `src/`:
     ```
     /*---------------------------------------------------------------------------------------------
     *  Copyright (c) Alessandro Fragnani. All rights reserved.
     *  Licensed under the MIT License. See License.md in the project root for license information.
     *--------------------------------------------------------------------------------------------*/
     ```
     (Add a small `api/License.md` with the MIT text if the root `LICENSE.md` is not MIT, so the
     header's reference is accurate — check root `LICENSE.md` license type before finalizing.)
   - Export `ProjectManagerPublicApi` interface (or similarly named) with:
     - `saveProject(name: string, rootPath: string, tags?: string[], profile?: string): Promise<void>`
     - `getFavoriteProjects(): Promise<Project[]>`
     - `getVSCodeProjects(): Promise<Project[]>`
     - `getGitProjects(): Promise<Project[]>`
     - `getMercurialProjects(): Promise<Project[]>`
     - `getSVNProjects(): Promise<Project[]>`
     - `getAnyProjects(): Promise<Project[]>`
     - `getAllProjects(): Promise<Project[]>`
   - Export a public `Project` type: `{ name: string; rootPath: string; tags: string[]; profile: string; enabled: boolean }`
     (a standalone type, not imported from internal `core/project.ts` — no cross-dependency).
   - JSDoc each method: params, return, error behavior (e.g. saveProject throws when name exists),
     and note these are read-only snapshots for the `getXXX` methods.

2. **Public API implementation** — new `src/api/apiImpl.ts`:
   - Class (e.g. `ProjectManagerApiImpl`) constructed with `ProjectStorage` and `Locators`
     (already built in `activate`), implementing the `ProjectManagerPublicApi` interface imported
     from `/api/api.d.ts` (implementation lives in `src/`, depends on the contract — not the
     other way around) and mapping internal types to the public `Project` shape.
   - `saveProject`: validate required `name`/`rootPath`, check `projectStorage.exists(name)`,
     throw a clear localized-safe `Error` if it exists, otherwise use existing
     `ProjectStorage.push` + set tags/profile + `save()`.
     - Note: `ProjectStorage.push` only sets name/rootPath; need to set tags/profile after push
       (e.g. via a small extension to `push` or by looking up and mutating the newly created entry).
   - `getFavoriteProjects`: map internal favorites to public `Project` shape.
   - `getVSCodeProjects` / `getGitProjects` / `getMercurialProjects` / `getSVNProjects` / `getAnyProjects`:
     read each locator's already-located `projectList` (`CustomProjectLocator.projectList`,
     currently private — will need a public getter) and map `AutodetectedProjectInfo` →
     public `Project` (`tags: []`, `profile: ""`, `enabled: true`, `rootPath: fullPath`).
   - `getAllProjects`: concatenate favorites + all 5 auto-detected lists.

3. **CustomProjectLocator** (`src/autodetect/abstractLocator.ts`):
   - Add a public read accessor for located projects (e.g. `getProjectList(): AutodetectedProjectInfo[]`)
     instead of exposing the mutable `projectList` field directly, to avoid consumers mutating
     internal state.

4. **ProjectStorage** (`src/storage/storage.ts`):
   - Confirm/add minimal support needed for `saveProject` to set tags/profile atomically on the
     newly pushed project (small helper, e.g. extend `push` to accept optional tags/profile, or
     add a dedicated method) — keep internal `push` signature change minimal and backward compatible.

5. **Wire up in `src/extension.ts`**:
   - After `locators` and `projectStorage` are constructed in `activate`, instantiate the API impl.
   - Add `return apiImpl;` at the end of `activate` (currently no return value) so
     `vscode.extensions.getExtension(...).exports` resolves to the public API instance.

6. **Tests**:
   - Add a focused test (under `src/test/suite/`) that activates the extension, retrieves the
     API via `vscode.extensions.getExtension(...)`, and exercises:
     - `saveProject` happy path + duplicate-name rejection.
     - `getFavoriteProjects` reflects saved project.
     - `getAllProjects` includes favorites.
     - `getXXXProjects` for at least one auto-detect kind returns `[]` when nothing located
       (no scan triggered).

7. **TypeScript project config**: Verify `/api/api.d.ts` is included in `tsconfig.json`
   compilation (`include`/`files`) and in webpack's module resolution if needed, since it now
   lives outside `src/`. Adjust `include` paths as necessary.

8. **Docs**: Add brief note in `.github/copilot-instructions.md` or a new `api/README.md`
   only if needed for discoverability (skip unless requested).

## Validation

- `npm run lint`
- `npm run build`
- `npm run test-compile`
- Run the new focused API test (`npm run test` or targeted suite if runnable in this environment).

## Open items / notes

- Public `Project` type intentionally excludes `paths` (multi-root "other paths") since the user's
  spec only mentions name, rootPath, tags, profile, enabled.
- `getXXXProjects` reflect only already-located state; if nothing has been scanned yet (e.g. right
  after activation before user opens the Git/SVN/etc. sidebar view), they will return `[]`. This is
  intentional per user's choice (no forced scan).
- Extension id for consumers: `alefragnani.project-manager` (from `package.json` publisher/name).
- `/api/api.d.ts` is a pure ambient-declaration file: no imports, no runtime code, MIT-licensed —
  it must remain independently publishable/shareable (e.g. copy-pasted by a consumer extension)
  without pulling in any of this extension's internals or its GPLv3-headed source.
