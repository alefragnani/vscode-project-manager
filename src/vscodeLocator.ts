import fs = require("fs");
import path = require("path");
import {AbstractLocator} from "./abstractLocator";

export class VisualStudioCodeLocator extends AbstractLocator {

    public getKind(): string {
        return "vscode";
    }

    public getDisplayName(): string {
        return "VSCode";
    }

    public isRepoDir(projectPath: string) {
        return fs.existsSync(path.join(projectPath, ".vscode"));
    }

    public decideProjectName(projectPath: string): string {
        return path.basename(projectPath);
    }    
}