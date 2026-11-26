/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Alessandro Fragnani. All rights reserved.
 *  Licensed under the GPLv3 License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import fs = require("fs");
import path = require("path");

/**
 * Gets the git directory for a given project path.
 * @param projectPath The path to the project directory
 * @returns The git directory, or undefined if not a git repo
 */
function getGitDir(projectPath: string): string | undefined {
    const gitPath = path.join(projectPath, ".git");

    if (!fs.existsSync(gitPath)) {
        return undefined;
    }

    // Handle git worktrees where .git is a file pointing to the actual git directory
    if (fs.statSync(gitPath).isFile()) {
        const gitFileContent = fs.readFileSync(gitPath, "utf8").trim();
        if (!gitFileContent.startsWith("gitdir: ")) {
            return undefined;
        }

        // Handle relative paths
        return path.resolve(projectPath, gitFileContent.substring(8));
    }

    return gitPath;
}

/**
 * Gets the current git branch for a given project path.
 * @param projectPath The path to the project directory
 * @returns The branch name, or undefined if not a git repo or in detached HEAD state
 */
export function getGitBranch(projectPath: string): string | undefined {
    try {
        const gitDir = getGitDir(projectPath);
        if (!gitDir) {
            return undefined;
        }

        const headPath = path.join(gitDir, "HEAD");
        if (!fs.existsSync(headPath)) {
            return undefined;
        }

        const headContent = fs.readFileSync(headPath, "utf8").trim();

        // Check if HEAD points to a branch (ref: refs/heads/branch-name)
        if (headContent.startsWith("ref: refs/heads/")) {
            return headContent.substring(16);
        }

        // Detached HEAD state (contains commit hash) - return undefined
        return undefined;
    } catch (e) {
    // Silently fail for any errors
        return undefined;
    }
}

interface GitCommonDirInfo {
    commonDir: string;
    isLinkedWorktree: boolean;
}

/**
 * Gets the git directory shared by a repository and all of its linked worktrees.
 * @param projectPath The path to the project directory
 * @returns The common git directory, or undefined if not a git repo
 */
function getGitCommonDir(projectPath: string): GitCommonDirInfo | undefined {
    try {
        const gitDir = getGitDir(projectPath);
        if (!gitDir) {
            return undefined;
        }

        // Linked worktrees have a `commondir` file, pointing to the git directory of the repository
        const commonDirFile = path.join(gitDir, "commondir");
        if (!fs.existsSync(commonDirFile)) {
            return { commonDir: gitDir, isLinkedWorktree: false };
        }

        const commonDir = fs.readFileSync(commonDirFile, "utf8").trim();
        return { commonDir: path.resolve(gitDir, commonDir), isLinkedWorktree: true };
    } catch (e) {
        return undefined;
    }
}

function toComparablePath(pathToCompare: string): string {
    let comparablePath: string;
    try {
        // the git files use real paths, while projects may be found via symlinks
        comparablePath = fs.realpathSync(pathToCompare);
    } catch (e) {
        comparablePath = path.resolve(pathToCompare);
    }
    return comparablePath.toLowerCase();
}

/**
 * Finds the repository each linked git worktree belongs to.
 * @param projectPaths The paths to the project directories
 * @returns The path of each linked worktree mapped to the path of its repository,
 * only when both are in `projectPaths`
 */
export function getGitWorktreeParents(projectPaths: string[]): Map<string, string> {
    const repositories = new Map<string, string>();
    const linkedWorktrees = new Map<string, string>();

    for (const projectPath of projectPaths) {
        const commonDirInfo = getGitCommonDir(projectPath);
        if (!commonDirInfo) {
            continue;
        }

        const commonDir = toComparablePath(commonDirInfo.commonDir);
        if (commonDirInfo.isLinkedWorktree) {
            linkedWorktrees.set(projectPath, commonDir);
        } else if (!repositories.has(commonDir)) {
            repositories.set(commonDir, projectPath);
        }
    }

    const worktreeParents = new Map<string, string>();
    for (const [ worktreePath, commonDir ] of linkedWorktrees) {
        const repositoryPath = repositories.get(commonDir);
        if (repositoryPath) {
            worktreeParents.set(worktreePath, repositoryPath);
        }
    }
    return worktreeParents;
}
