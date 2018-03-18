import fs = require("fs");
import path = require("path");
import {CustomProjectLocator} from "./abstractLocator";

export class MercurialLocator extends CustomProjectLocator {

    // public getKind(): string {
    //     return "hg";
    // }

    // public getDisplayName(): string {
    //     return "Mercurial";
    // }

    // public isRepoDir(projectPath: string) {
    //     return fs.existsSync(path.join(projectPath, ".hg", "hgrc"));
    // }

    // public decideProjectName(projectPath: string): string {
    //     return path.basename(projectPath);
    // }
}