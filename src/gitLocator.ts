import path = require("path");
import fs = require("fs");
import {AbstractLocator} from "./abstractLocator";

export class GitLocator extends AbstractLocator {

    public getKind(): string {
        return "git";
    }

    public isRepoDir(projectPath: string) {
        return fs.existsSync(path.join(projectPath, ".git", "config"));
    }

    public decideProjectName(projectPath: string): string {
        return path.basename(projectPath);
    }
}