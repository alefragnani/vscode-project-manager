/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import fs = require("fs");
import path = require("path");
import os = require("os");
import * as assert from "assert";
import { getGitBranch, getGitWorktreeParents } from "../../utils/git";

suite("getGitBranch", () => {
    test("returns undefined for non-git directory", () => {
        const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "git-test-non-repo-"));
        
        try {
            assert.strictEqual(getGitBranch(testDir), undefined);
        } finally {
            if (fs.existsSync(testDir)) {
                fs.rmSync(testDir, { recursive: true, force: true });
            }
        }
    });

    test("returns branch name for regular git repository", () => {
        const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "git-test-repo-"));
        
        try {
            const gitDir = path.join(testDir, ".git");
            fs.mkdirSync(gitDir);
            
            const headPath = path.join(gitDir, "HEAD");
            fs.writeFileSync(headPath, "ref: refs/heads/main\n");
            
            assert.strictEqual(getGitBranch(testDir), "main");
        } finally {
            if (fs.existsSync(testDir)) {
                fs.rmSync(testDir, { recursive: true, force: true });
            }
        }
    });

    test("returns branch name for different branch", () => {
        const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "git-test-repo-"));
        
        try {
            const gitDir = path.join(testDir, ".git");
            fs.mkdirSync(gitDir);
            
            const headPath = path.join(gitDir, "HEAD");
            fs.writeFileSync(headPath, "ref: refs/heads/feature/awesome-feature\n");
            
            assert.strictEqual(getGitBranch(testDir), "feature/awesome-feature");
        } finally {
            if (fs.existsSync(testDir)) {
                fs.rmSync(testDir, { recursive: true, force: true });
            }
        }
    });

    test("returns undefined for detached HEAD state", () => {
        const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "git-test-repo-"));
        
        try {
            const gitDir = path.join(testDir, ".git");
            fs.mkdirSync(gitDir);
            
            const headPath = path.join(gitDir, "HEAD");
            fs.writeFileSync(headPath, "abc123def456789\n");
            
            assert.strictEqual(getGitBranch(testDir), undefined);
        } finally {
            if (fs.existsSync(testDir)) {
                fs.rmSync(testDir, { recursive: true, force: true });
            }
        }
    });

    test("returns undefined when HEAD file does not exist", () => {
        const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "git-test-repo-"));
        
        try {
            const gitDir = path.join(testDir, ".git");
            fs.mkdirSync(gitDir);
            // Don't create HEAD file
            
            assert.strictEqual(getGitBranch(testDir), undefined);
        } finally {
            if (fs.existsSync(testDir)) {
                fs.rmSync(testDir, { recursive: true, force: true });
            }
        }
    });

    test("handles git worktree with absolute path", () => {
        const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "git-test-worktree-"));
        const actualGitDir = fs.mkdtempSync(path.join(os.tmpdir(), "git-test-actual-"));
        
        try {
            // Create the actual git directory
            const headPath = path.join(actualGitDir, "HEAD");
            fs.writeFileSync(headPath, "ref: refs/heads/develop\n");
            
            // Create worktree .git file pointing to actual git dir
            const gitFile = path.join(testDir, ".git");
            fs.writeFileSync(gitFile, `gitdir: ${actualGitDir}\n`);
            
            assert.strictEqual(getGitBranch(testDir), "develop");
        } finally {
            if (fs.existsSync(testDir)) {
                fs.rmSync(testDir, { recursive: true, force: true });
            }
            if (fs.existsSync(actualGitDir)) {
                fs.rmSync(actualGitDir, { recursive: true, force: true });
            }
        }
    });

    test("handles git worktree with relative path", () => {
        const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "git-test-worktree-rel-"));
        
        try {
            // Create actual git directory as a sibling
            const actualGitDir = path.join(path.dirname(testDir), "actual-git-dir");
            fs.mkdirSync(actualGitDir, { recursive: true });
            
            const headPath = path.join(actualGitDir, "HEAD");
            fs.writeFileSync(headPath, "ref: refs/heads/master\n");
            
            // Create worktree .git file with relative path
            const gitFile = path.join(testDir, ".git");
            const relativePath = path.relative(testDir, actualGitDir);
            fs.writeFileSync(gitFile, `gitdir: ${relativePath}\n`);
            
            assert.strictEqual(getGitBranch(testDir), "master");
        } finally {
            if (fs.existsSync(testDir)) {
                fs.rmSync(testDir, { recursive: true, force: true });
            }
            const actualGitDir = path.join(path.dirname(testDir), "actual-git-dir");
            if (fs.existsSync(actualGitDir)) {
                fs.rmSync(actualGitDir, { recursive: true, force: true });
            }
        }
    });

    test("returns undefined for invalid .git file content", () => {
        const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "git-test-invalid-"));
        
        try {
            const gitFile = path.join(testDir, ".git");
            fs.writeFileSync(gitFile, "not a valid gitdir reference\n");
            
            assert.strictEqual(getGitBranch(testDir), undefined);
        } finally {
            if (fs.existsSync(testDir)) {
                fs.rmSync(testDir, { recursive: true, force: true });
            }
        }
    });

    test("handles HEAD file with trailing whitespace", () => {
        const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "git-test-repo-"));
        
        try {
            const gitDir = path.join(testDir, ".git");
            fs.mkdirSync(gitDir);
            
            const headPath = path.join(gitDir, "HEAD");
            fs.writeFileSync(headPath, "ref: refs/heads/test-branch  \n");
            
            assert.strictEqual(getGitBranch(testDir), "test-branch");
        } finally {
            if (fs.existsSync(testDir)) {
                fs.rmSync(testDir, { recursive: true, force: true });
            }
        }
    });

    test("handles non-existent directory gracefully", () => {
        const nonExistentDir = path.join(os.tmpdir(), "non-existent-dir-" + Date.now());
        assert.strictEqual(getGitBranch(nonExistentDir), undefined);
    });
});

suite("getGitWorktreeParents", () => {
    let testDir: string;

    setup(() => {
        testDir = fs.mkdtempSync(path.join(os.tmpdir(), "git-test-worktrees-"));
    });

    teardown(() => {
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    });

    // Same structure as `git init`
    function createRepository(repositoryPath: string): string {
        fs.mkdirSync(path.join(repositoryPath, ".git"), { recursive: true });
        fs.writeFileSync(path.join(repositoryPath, ".git", "HEAD"), "ref: refs/heads/main\n");
        return repositoryPath;
    }

    // Same structure as `git worktree add`
    function createWorktree(commonDir: string, worktreePath: string, useRelativePaths = false): string {
        const worktreeName = path.basename(worktreePath);
        const worktreeGitDir = path.join(commonDir, "worktrees", worktreeName);
        fs.mkdirSync(worktreeGitDir, { recursive: true });
        fs.writeFileSync(path.join(worktreeGitDir, "HEAD"), `ref: refs/heads/${worktreeName}\n`);
        fs.writeFileSync(path.join(worktreeGitDir, "commondir"), "../..\n");
        fs.writeFileSync(path.join(worktreeGitDir, "gitdir"), path.join(worktreePath, ".git") + "\n");

        fs.mkdirSync(worktreePath, { recursive: true });
        const gitDir = useRelativePaths ? path.relative(worktreePath, worktreeGitDir) : worktreeGitDir;
        fs.writeFileSync(path.join(worktreePath, ".git"), `gitdir: ${gitDir}\n`);
        return worktreePath;
    }

    test("maps a worktree to its repository", () => {
        const repository = createRepository(path.join(testDir, "api"));
        const worktree = createWorktree(path.join(repository, ".git"), path.join(testDir, "api-feature"));

        const parents = getGitWorktreeParents([ repository, worktree ]);

        assert.strictEqual(parents.size, 1);
        assert.strictEqual(parents.get(worktree), repository);
    });

    test("maps worktrees located inside the repository", () => {
        const repository = createRepository(path.join(testDir, "api"));
        const worktree = createWorktree(path.join(repository, ".git"), path.join(repository, ".worktrees", "fix-login"));

        const parents = getGitWorktreeParents([ repository, worktree ]);

        assert.strictEqual(parents.get(worktree), repository);
    });

    test("maps worktrees using relative paths", () => {
        const repository = createRepository(path.join(testDir, "api"));
        const worktree = createWorktree(path.join(repository, ".git"), path.join(testDir, "api-feature"), true);

        const parents = getGitWorktreeParents([ repository, worktree ]);

        assert.strictEqual(parents.get(worktree), repository);
    });

    test("maps each worktree to its own repository", () => {
        const api = createRepository(path.join(testDir, "api"));
        const web = createRepository(path.join(testDir, "web"));
        const apiFeature = createWorktree(path.join(api, ".git"), path.join(testDir, "feature-a"));
        const apiHotfix = createWorktree(path.join(api, ".git"), path.join(testDir, "hotfix"));
        const webFeature = createWorktree(path.join(web, ".git"), path.join(testDir, "feature-b"));

        const parents = getGitWorktreeParents([ apiFeature, api, webFeature, web, apiHotfix ]);

        assert.strictEqual(parents.size, 3);
        assert.strictEqual(parents.get(apiFeature), api);
        assert.strictEqual(parents.get(apiHotfix), api);
        assert.strictEqual(parents.get(webFeature), web);
    });

    test("maps worktrees of a bare repository to the folder pointing to it", () => {
        // `git clone --bare <url> tools/.bare` + `echo "gitdir: ./.bare" > tools/.git`
        const repository = path.join(testDir, "tools");
        const bareDir = path.join(repository, ".bare");
        fs.mkdirSync(bareDir, { recursive: true });
        fs.writeFileSync(path.join(bareDir, "HEAD"), "ref: refs/heads/main\n");
        fs.writeFileSync(path.join(repository, ".git"), "gitdir: ./.bare\n");
        const worktree = createWorktree(bareDir, path.join(repository, "main"));

        const parents = getGitWorktreeParents([ repository, worktree ]);

        assert.strictEqual(parents.get(worktree), repository);
    });

    test("does not map worktrees when the repository is not a project", () => {
        const repository = createRepository(path.join(testDir, "api"));
        const worktree = createWorktree(path.join(repository, ".git"), path.join(testDir, "api-feature"));

        const parents = getGitWorktreeParents([ worktree ]);

        assert.strictEqual(parents.size, 0);
    });

    test("does not map submodules", () => {
        const repository = createRepository(path.join(testDir, "app"));
        const submoduleGitDir = path.join(repository, ".git", "modules", "lib");
        fs.mkdirSync(submoduleGitDir, { recursive: true });
        fs.writeFileSync(path.join(submoduleGitDir, "HEAD"), "ref: refs/heads/main\n");
        const submodule = path.join(repository, "lib");
        fs.mkdirSync(submodule);
        fs.writeFileSync(path.join(submodule, ".git"), "gitdir: ../.git/modules/lib\n");

        const parents = getGitWorktreeParents([ repository, submodule ]);

        assert.strictEqual(parents.size, 0);
    });

    test("does not map worktrees whose git directory no longer exists", () => {
        const repository = createRepository(path.join(testDir, "api"));
        const worktree = path.join(testDir, "api-feature");
        fs.mkdirSync(worktree);
        fs.writeFileSync(path.join(worktree, ".git"), `gitdir: ${path.join(repository, ".git", "worktrees", "api-feature")}\n`);

        const parents = getGitWorktreeParents([ repository, worktree ]);

        assert.strictEqual(parents.size, 0);
    });

    test("maps repositories found through symbolic links", () => {
        const repository = createRepository(path.join(testDir, "real", "api"));
        const worktree = createWorktree(path.join(repository, ".git"), path.join(testDir, "api-feature"));
        fs.symlinkSync(path.join(testDir, "real"), path.join(testDir, "link"), "junction");
        const repositoryThroughLink = path.join(testDir, "link", "api");

        const parents = getGitWorktreeParents([ repositoryThroughLink, worktree ]);

        assert.strictEqual(parents.get(worktree), repositoryThroughLink);
    });

    test("ignores projects that are not git repositories", () => {
        const folder = path.join(testDir, "folder");
        fs.mkdirSync(folder);
        const nonExistentDir = path.join(testDir, "non-existent-dir");

        const parents = getGitWorktreeParents([ folder, nonExistentDir ]);

        assert.strictEqual(parents.size, 0);
    });
});
