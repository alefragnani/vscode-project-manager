/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as assert from "assert";
import { CancellationTokenSource, Disposable, FileDecoration, FileDecorationProvider, Uri, window } from "vscode";
import { Container } from "../../core/container";
import { createProject } from "../../core/project";
import { registerSideBarDecorations } from "../../sidebar/decoration";

// Intercepts the registration so the tests run against the provider the extension
// actually registers, instead of a copy of it that could drift from the real one.
function captureRegisteredProvider(): FileDecorationProvider {

    const windowApi = window as unknown as {
        registerFileDecorationProvider: (provider: FileDecorationProvider) => Disposable
    };
    const originalRegister = windowApi.registerFileDecorationProvider;

    let captured: FileDecorationProvider;
    windowApi.registerFileDecorationProvider = (provider: FileDecorationProvider) => {
        captured = provider;
        return { dispose: () => undefined } as Disposable;
    };

    try {
        registerSideBarDecorations();
    } finally {
        windowApi.registerFileDecorationProvider = originalRegister;
    }

    return captured;
}

suite("SideBar Decoration Tests", () => {

    const projectPath = "/home/user/projects/my-project";

    let provider: FileDecorationProvider;
    let tokenSource: CancellationTokenSource;

    setup(() => {
        provider = captureRegisteredProvider();
        tokenSource = new CancellationTokenSource();
    });

    teardown(() => {
        tokenSource.dispose();
        Container.currentProject = undefined;
    });

    test("should not decorate uris from other schemes", () => {
        Container.currentProject = createProject("my-project", projectPath);

        const decoration = provider.provideFileDecoration(Uri.file(projectPath), tokenSource.token);

        assert.equal(decoration, undefined);
    });

    test("should decorate the current project", () => {
        Container.currentProject = createProject("my-project", projectPath);

        const decoration = provider.provideFileDecoration(
            Uri.parse(`projectManager-view:${projectPath}`), tokenSource.token) as FileDecoration;

        assert.equal(decoration.badge, "✔");
    });

    test("should not decorate a project which is not the current one", () => {
        Container.currentProject = createProject("my-project", projectPath);

        const decoration = provider.provideFileDecoration(
            Uri.parse("projectManager-view:/home/user/projects/another-project"), tokenSource.token);

        assert.equal(decoration, undefined);
    });

    test("should not throw when there is no current project", () => {
        Container.currentProject = undefined;

        assert.doesNotThrow(() => provider.provideFileDecoration(
            Uri.parse(`projectManager-view:${projectPath}`), tokenSource.token));
    });

    test("should not decorate when there is no current project", () => {
        Container.currentProject = undefined;

        const decoration = provider.provideFileDecoration(
            Uri.parse(`projectManager-view:${projectPath}`), tokenSource.token);

        assert.equal(decoration, undefined);
    });
});
