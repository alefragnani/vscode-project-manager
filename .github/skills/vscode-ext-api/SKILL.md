---
name: vscode-ext-api
description: 'Guidelines for designing, exposing, evolving, or consuming a public API from a VS Code extension. Use when adding extension exports, api property declarations, extension activation contracts, or API compatibility tests.'
---

# VS Code Extension API

This skill helps you expose a stable, documented API from a VS Code extension for other extensions to consume.

## When to use this skill

Use this skill when you need to:
- Add or update a public API exposed through `Extension.exports`
- Activate and consume another extension's API with `vscode.extensions.getExtension()`
- Design API contracts, lifecycle behavior, compatibility, or consumer tests

## Procedure

1. Define the consumer workflow first. Identify the caller, required inputs, successful result, errors, and whether the operation is read-only or changes state.
2. Keep the public contract minimal. Export a named interface or type with explicit parameter and return types; do not expose internal containers, provider implementations, mutable collections, or VS Code objects that the consumer does not need.
3. Define the public API contract as a standalone declaration file at `/api/api.d.ts`, at the repository root, outside `src/`. This file must contain only ambient interfaces/types (the public `*Api` interface plus any domain types it references) with zero imports and zero dependency on the rest of the project — no imports from `src/`, no imports of `vscode`, no runtime code or wrapper logic. Because it has no dependency on the extension's own code or license, it must use an MIT license header instead of the project's own license header, so any consumer can freely import or copy the contract regardless of the host extension's license. Implement the contract in a separate module (e.g. `src/api/`), importing the interface from `/api/api.d.ts` and depending on it — never the reverse. Export only the public entry point from the extension activation path, and do not make consumers import from the extension's internal source paths.
4. In `activate`, construct the implementation after its dependencies are ready and return the public API object. Preserve the existing activation result when one exists; consumers obtain the API through the extension's `exports` value.
5. Consumer code must retrieve the provider with `vscode.extensions.getExtension<PublicApi>(extensionId)`, await `extension.activate()`, and use the resolved API. Handle a missing extension, activation failure, and unsupported API version with an actionable localized message when shown to users.
6. Design for evolution. Add optional capabilities instead of changing existing method semantics. For unavoidable breaking changes, publish a new major API version and retain compatibility adapters only when their lifecycle is clear.
7. Add focused tests that activate the extension and exercise the API as a separate consumer would. Cover the happy path, unavailable provider, API version or capability mismatch, and disposal or deactivation behavior when relevant.

## Contract Criteria

- Use stable, extension-qualified identifiers such as `publisher.extensionId`.
- Prefer async methods that return `Promise<T>` for work that can involve the workspace, filesystem, or extension-host state.
- Return typed domain values rather than presentation strings or UI elements.
- Document nullability, ownership, cancellation behavior, error behavior, and the lifetime of returned values.
- Avoid consumers reaching into globals, singleton containers, commands intended for UI, or undocumented implementation details.
- Treat every exported object and type as a compatibility commitment.
- Localize only messages displayed to users; API method names, identifiers, and machine-readable error codes remain stable programmatic contracts.
- Keep `/api/api.d.ts` free of any dependency on the rest of the project (no imports, no runtime code) and MIT-licensed, so the contract itself remains portable and importable independent of the host extension's own license.

## Completion Check

1. Verify the manifest's `api` declaration matches the exported capability and version.
2. Verify activation returns the documented public API and that a consumer can retrieve it after awaiting `activate()`.
3. Verify `/api/api.d.ts` has no imports and no dependency on `src/` or `vscode`, and carries an MIT license header regardless of the host extension's own license.
4. Run the focused API test, then `npm run lint` and `npm run build`.
5. Review the public types for accidental internal dependencies or breaking changes.

## References

- [VS Code Extension API reference](https://code.visualstudio.com/api/references/vscode-api#extensions)