/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import fs = require("fs");
import path = require("path");
import { CustomRepositoryDetector } from "./repositoryDetector";
import { codicons } from "vscode-ext-codicons";

export class GitRepositoryDetector extends CustomRepositoryDetector {
    
    protected getIcon(): string {
        return codicons.git_branch;
    }

    public isRepoDir(projectPath: string): boolean {
        let isGit: boolean;
        isGit = fs.existsSync(path.join(projectPath, ".git", "config"));
        if (isGit) {
            return true;
        }

        isGit = fs.existsSync(path.join(projectPath, ".git"));
        if (isGit) {
            let file: string;
            try {
                file = fs.readFileSync(path.join(projectPath, ".git"), "utf8");
                isGit = file.indexOf("gitdir: ") === 0;
                if (isGit) {
                    return true;
                }
            } catch (e) {
                console.log("Error checking git-worktree: " + e);
            }
        }
        
        return false;
    }

}
