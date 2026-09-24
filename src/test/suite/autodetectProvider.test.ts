/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import fs = require("fs");
import path = require("path");
import os = require("os");
import * as assert from "assert";
import * as vscode from "vscode";
import { CustomProjectLocator } from "../../autodetect/abstractLocator";
import { AutodetectedProjectInfo } from "../../autodetect/autodetectedProjectInfo";
import { Container } from "../../core/container";
import { AutodetectProvider } from "../../sidebar/autodetectProvider";
import { ProjectNode } from "../../sidebar/nodes";
import { MockMemento } from "./mocks/MockMemento";

suite("AutodetectProvider Git Worktrees Tests", () => {

    let testDir: string;
    let api: string;
    let apiHotfix: string;
    let apiFeature: string;
    let web: string;

    // Same structure as `git init`
    function createRepository(repositoryPath: string): string {
        fs.mkdirSync(path.join(repositoryPath, ".git"), { recursive: true });
        fs.writeFileSync(path.join(repositoryPath, ".git", "HEAD"), "ref: refs/heads/main\n");
        return repositoryPath;
    }

    // Same structure as `git worktree add`
    function createWorktree(repositoryPath: string, worktreePath: string): string {
        const worktreeGitDir = path.join(repositoryPath, ".git", "worktrees", path.basename(worktreePath));
        fs.mkdirSync(worktreeGitDir, { recursive: true });
        fs.writeFileSync(path.join(worktreeGitDir, "HEAD"), `ref: refs/heads/${path.basename(worktreePath)}\n`);
        fs.writeFileSync(path.join(worktreeGitDir, "commondir"), "../..\n");
        fs.mkdirSync(worktreePath, { recursive: true });
        fs.writeFileSync(path.join(worktreePath, ".git"), `gitdir: ${worktreeGitDir}\n`);
        return worktreePath;
    }

    function createProvider(kind: string, projectPaths: string[]): AutodetectProvider {
        const locator = {
            kind,
            getProjectList: (): AutodetectedProjectInfo[] => projectPaths.map(projectPath => ({
                name: path.basename(projectPath),
                fullPath: projectPath,
                icon: "$(git-branch)"
            }))
        };
        return new AutodetectProvider(locator as unknown as CustomProjectLocator);
    }

    async function setGroupWorktrees(value: string | undefined) {
        await vscode.workspace.getConfiguration("projectManager").update("git.groupWorktrees", value, vscode.ConfigurationTarget.Global);
    }

    function labels(nodes: ProjectNode[]): string[] {
        return nodes.map(node => node.label);
    }

    suiteSetup(() => {
        // the project icons are loaded from the extension folder
        Container.initialize({
            globalState: new MockMemento(),
            extensionUri: vscode.Uri.file(__dirname)
        } as unknown as vscode.ExtensionContext);

        testDir = fs.mkdtempSync(path.join(os.tmpdir(), "autodetect-provider-worktrees-"));
        api = createRepository(path.join(testDir, "api"));
        apiHotfix = createWorktree(api, path.join(testDir, "hotfix"));
        apiFeature = createWorktree(api, path.join(api, ".worktrees", "feature"));
        web = createRepository(path.join(testDir, "web"));
    });

    suiteTeardown(async () => {
        await setGroupWorktrees(undefined);
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    });

    test("displays worktrees under their repository, which starts expanded by default", async () => {
        await setGroupWorktrees(undefined);
        const provider = createProvider("git", [ web, apiHotfix, api, apiFeature ]);

        const roots = await provider.getChildren();
        assert.deepStrictEqual(labels(roots), [ "api", "web" ]);
        assert.strictEqual(roots[ 0 ].collapsibleState, vscode.TreeItemCollapsibleState.Expanded);
        assert.strictEqual(roots[ 1 ].collapsibleState, vscode.TreeItemCollapsibleState.None);

        const worktrees = await provider.getChildren(roots[ 0 ]);
        assert.deepStrictEqual(labels(worktrees), [ "feature", "hotfix" ]);
        assert.deepStrictEqual(await provider.getChildren(roots[ 1 ]), []);
    });

    test("worktrees can be opened like any other project", async () => {
        await setGroupWorktrees(undefined);
        const provider = createProvider("git", [ api, apiHotfix ]);

        const roots = await provider.getChildren();
        const worktrees = await provider.getChildren(roots[ 0 ]);

        assert.strictEqual(worktrees.length, 1);
        assert.strictEqual(worktrees[ 0 ].collapsibleState, vscode.TreeItemCollapsibleState.None);
        assert.strictEqual(worktrees[ 0 ].contextValue, "ProjectNodeKind");
        assert.strictEqual(worktrees[ 0 ].command.command, "_projectManager.open");
        assert.deepStrictEqual(worktrees[ 0 ].command.arguments, [ apiHotfix, "hotfix" ]);
        assert.deepStrictEqual(roots[ 0 ].command.arguments, [ api, "api" ]);
    });

    test("starts repositories collapsed when using collapsed", async () => {
        await setGroupWorktrees("collapsed");
        const provider = createProvider("git", [ api, apiFeature, apiHotfix, web ]);

        const roots = await provider.getChildren();
        assert.deepStrictEqual(labels(roots), [ "api", "web" ]);
        assert.strictEqual(roots[ 0 ].collapsibleState, vscode.TreeItemCollapsibleState.Collapsed);
        assert.deepStrictEqual(labels(await provider.getChildren(roots[ 0 ])), [ "feature", "hotfix" ]);
    });

    test("repositories keep their id on refresh, but not when the setting changes", async () => {
        await setGroupWorktrees(undefined);
        const provider = createProvider("git", [ api, apiHotfix, web ]);

        const [ expandedApi, expandedWeb ] = await provider.getChildren();
        const [ refreshedApi ] = await provider.getChildren();
        assert.ok(expandedApi.id);
        assert.strictEqual(refreshedApi.id, expandedApi.id);
        assert.strictEqual(expandedWeb.id, undefined);

        await setGroupWorktrees("collapsed");
        const [ collapsedApi ] = await provider.getChildren();
        assert.ok(collapsedApi.id);
        assert.notStrictEqual(collapsedApi.id, expandedApi.id);
    });

    test("displays the worktrees once when a repository is listed twice", async () => {
        await setGroupWorktrees(undefined);
        const provider = createProvider("git", [ api, api, apiHotfix ]);

        const roots = await provider.getChildren();
        assert.deepStrictEqual(labels(roots), [ "api", "api" ]);
        assert.strictEqual(roots[ 0 ].collapsibleState, vscode.TreeItemCollapsibleState.Expanded);
        assert.strictEqual(roots[ 1 ].collapsibleState, vscode.TreeItemCollapsibleState.None);
        assert.strictEqual(roots[ 1 ].id, undefined);
        assert.deepStrictEqual(labels(await provider.getChildren(roots[ 0 ])), [ "hotfix" ]);
    });

    test("displays worktrees as regular projects when using never", async () => {
        await setGroupWorktrees("never");
        const provider = createProvider("git", [ api, apiFeature, apiHotfix, web ]);

        const roots = await provider.getChildren();
        assert.deepStrictEqual(labels(roots), [ "api", "feature", "hotfix", "web" ]);
        assert.ok(roots.every(node => node.collapsibleState === vscode.TreeItemCollapsibleState.None));
    });

    test("keeps worktrees at the root when their repository was not detected", async () => {
        await setGroupWorktrees(undefined);
        const provider = createProvider("git", [ apiHotfix, web ]);

        const roots = await provider.getChildren();
        assert.deepStrictEqual(labels(roots), [ "hotfix", "web" ]);
        assert.ok(roots.every(node => node.collapsibleState === vscode.TreeItemCollapsibleState.None));
    });

    test("does not group worktrees in views other than Git", async () => {
        await setGroupWorktrees(undefined);
        const provider = createProvider("any", [ api, apiFeature, apiHotfix, web ]);

        const roots = await provider.getChildren();
        assert.deepStrictEqual(labels(roots), [ "api", "feature", "hotfix", "web" ]);
        assert.ok(roots.every(node => node.collapsibleState === vscode.TreeItemCollapsibleState.None));
    });
});
