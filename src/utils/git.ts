/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Alessandro Fragnani. All rights reserved.
 *  Licensed under the GPLv3 License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import fs = require("fs");
import path = require("path");

/**
 * Gets the current git branch for a given project path.
 * @param projectPath The path to the project directory
 * @returns The branch name, or undefined if not a git repo or in detached HEAD state
 */
export function getGitBranch(projectPath: string): string | undefined {
    try {
        const gitPath = path.join(projectPath, ".git");

        if (!fs.existsSync(gitPath)) {
            return undefined;
        }

        let gitDir = gitPath;
        const gitStat = fs.statSync(gitPath);

        // Handle git worktrees where .git is a file pointing to the actual git directory
        if (gitStat.isFile()) {
            const gitFileContent = fs.readFileSync(gitPath, "utf8").trim();
            if (gitFileContent.startsWith("gitdir: ")) {
                gitDir = gitFileContent.substring(8);
                // Handle relative paths
                if (!path.isAbsolute(gitDir)) {
                    gitDir = path.join(projectPath, gitDir);
                }
            } else {
                return undefined;
            }
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
