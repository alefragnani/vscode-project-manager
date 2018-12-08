import fs = require("fs");
import path = require("path");
import vscode = require("vscode");
import { CustomRepositoryDetector, DirList } from "./abstractLocator";

export class GitRepositoryDetector extends CustomRepositoryDetector {
    private ignoreGitSubmodules: boolean;

    constructor(public paths: string[]) {
        super(paths);

        this.ignoreGitSubmodules = false;
        this.refreshConfig();
    }

    public refreshConfig(): boolean {
        const config = vscode.workspace.getConfiguration("projectManager");
        let refreshedSomething: boolean = false;
        let currentValue = null;

        currentValue = config.get("git.ignoreSubmodules", false);
        if (this.ignoreGitSubmodules !== currentValue) {
            this.ignoreGitSubmodules = currentValue;
            refreshedSomething = true;
        }

        return refreshedSomething;
    }

    public isRepoDir(projectPath: string, dirList: DirList) {
        let isGit: boolean;
        isGit = fs.existsSync(path.join(projectPath, ".git", "config"));
        if (isGit) {
            if (this.ignoreSubmodule(projectPath, dirList)) {
                return false;
            }

            return true;
        }

        isGit = fs.existsSync(path.join(projectPath, ".git"));
        if (isGit) {
            let file: string;
            try {
                file = fs.readFileSync(path.join(projectPath, ".git"), "utf8");
                isGit = file.indexOf("gitdir: ") === 0;
                if (isGit) {
                    if (this.ignoreSubmodule(projectPath, dirList)) {
                        return false;
                    }

                    return true;
                }
            } catch (e) {
                console.log("Error checking git-worktree: " + e);
            }
        }

        return false;
    }

    private ignoreSubmodule(projectPath: string, dirList: DirList): boolean {
        if (this.ignoreGitSubmodules) {
            for (const dir of dirList) {
                if (projectPath.startsWith(dir.fullPath)) {
                    return true;
                }
            }
        }

        return false;
    }
}