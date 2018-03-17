import fs = require("fs");
import path = require("path");
import {AbstractLocator} from "./abstractLocator";

export class MercurialLocator extends AbstractLocator {

    public getKind(): string {
        return "hg";
    }

    public getDisplayName(): string {
        return "Mercurial";
    }

    public isRepoDir(projectPath: string) {
        return fs.existsSync(path.join(projectPath, ".hg", "hgrc"));
    }

    public decideProjectName(projectPath: string): string {
        return path.basename(projectPath);
    }
}