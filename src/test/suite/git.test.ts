/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import fs = require("fs");
import path = require("path");
import os = require("os");
import * as assert from "assert";
import { getGitBranch } from "../../utils/git";

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
