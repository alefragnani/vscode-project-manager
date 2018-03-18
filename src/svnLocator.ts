import fs = require("fs");
import path = require("path");
import {CustomProjectLocator} from "./abstractLocator";

export class SvnLocator extends CustomProjectLocator {

    // public getKind(): string {
    //     return "svn";
    // }

    // public getDisplayName(): string {
    //     return "SVN";
    // }

    // public isRepoDir(projectPath: string) {
    //     return fs.existsSync(path.join(projectPath, ".svn", "pristine"));
    // }

    // public decideProjectName(projectPath: string): string {
    //     return path.basename(projectPath);
    // }
}