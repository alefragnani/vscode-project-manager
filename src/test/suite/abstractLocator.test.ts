/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import fs = require("fs");
import path = require("path");
import os = require("os");
import * as assert from "assert";
import { ConfigurationTarget, workspace } from "vscode";
import { CustomProjectLocator } from "../../autodetect/abstractLocator";
import { GitRepositoryDetector } from "../../autodetect/gitRepositoryDetector";

function createGitRepo(...segments: string[]): string {
    const repoPath = path.join(...segments);
    fs.mkdirSync(path.join(repoPath, ".git"), { recursive: true });
    fs.writeFileSync(path.join(repoPath, ".git", "config"), "");
    return repoPath;
}

async function locateWith(baseFolders: string[], maxDepthRecursion: number) {
    const config = workspace.getConfiguration("projectManager");
    await config.update("git.baseFolders", baseFolders, ConfigurationTarget.Global);
    await config.update("git.maxDepthRecursion", maxDepthRecursion, ConfigurationTarget.Global);

    const locator = new CustomProjectLocator("git", "Git", new GitRepositoryDetector([ ".git" ]));
    locator.deleteCacheFile();
    try {
        await locator.refreshProjects(true);
        return locator.projectList.map(project => project.fullPath);
    } finally {
        locator.deleteCacheFile();
    }
}

suite("CustomProjectLocator", () => {
    let testRoot: string;

    setup(() => {
        testRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "abstract-locator-test-")));
    });

    teardown(async () => {
        if (fs.existsSync(testRoot)) {
            fs.rmSync(testRoot, { recursive: true, force: true });
        }

        const config = workspace.getConfiguration("projectManager");
        await config.update("git.baseFolders", undefined, ConfigurationTarget.Global);
        await config.update("git.maxDepthRecursion", undefined, ConfigurationTarget.Global);
    });

    test("does not duplicate projects when a base folder is nested in another", async () => {
        const foo = path.join(testRoot, "foo");
        const foobar = path.join(foo, "bar");
        const outerProject = createGitRepo(foo, "outer-project");
        const nestedProject = createGitRepo(foobar, "nested-project");

        const located = await locateWith([ foo, foobar ], -1);

        assert.deepStrictEqual(located.slice().sort(), [ nestedProject, outerProject ].sort());
    });

    test("keeps projects only reachable through the nested base folder when maxDepthRecursion limits the outer walk", async () => {
        const foo = path.join(testRoot, "foo");
        const foobar = path.join(foo, "bar");
        const outerProject = createGitRepo(foo, "outer-project");
        const nestedProject = createGitRepo(foobar, "nested-project");

        const located = await locateWith([ foo, foobar ], 1);

        assert.deepStrictEqual(located.slice().sort(), [ nestedProject, outerProject ].sort());
    });

    test("does not duplicate projects when the same base folder is listed twice", async () => {
        const foo = path.join(testRoot, "foo");
        const project = createGitRepo(foo, "a-project");

        const located = await locateWith([ foo, foo ], -1);

        assert.deepStrictEqual(located, [ project ]);
    });

    test("drops duplicates already present in the cache file", async () => {
        const foo = path.join(testRoot, "foo");
        const project = createGitRepo(foo, "a-project");

        const config = workspace.getConfiguration("projectManager");
        await config.update("git.baseFolders", [ foo ], ConfigurationTarget.Global);
        await config.update("git.maxDepthRecursion", -1, ConfigurationTarget.Global);

        // A cache file written before duplicates were filtered out.
        const seeder = new CustomProjectLocator("git", "Git", new GitRepositoryDetector([ ".git" ]));
        const cacheFile = seeder[ "getCacheFile" ]();
        const duplicated = [
            { name: "a-project", fullPath: project, icon: "$(git-branch)" },
            { name: "a-project", fullPath: project, icon: "$(git-branch)" }
        ];
        fs.writeFileSync(cacheFile, JSON.stringify(duplicated, null, "\t"), { encoding: "utf8" });

        const locator = new CustomProjectLocator("git", "Git", new GitRepositoryDetector([ ".git" ]));
        try {
            assert.strictEqual(locator.isAlreadyLocated(), true);
            const located = await locator.locateProjects();
            assert.deepStrictEqual(located.map(item => item.fullPath), [ project ]);
        } finally {
            locator.deleteCacheFile();
        }
    });
});
