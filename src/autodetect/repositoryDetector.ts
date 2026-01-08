/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as path from "path";

export interface RepositoryDetector {

    isRepoDir(projectPath: string);
    decideProjectName(projectPath: string): string;
    isRepoFile?(projectFile: string): boolean;

}

export class CustomRepositoryDetector implements RepositoryDetector {

    constructor(public paths: string[]) {
    }

    public isRepoDir(projectPath: string) {
        return fs.existsSync(path.join(projectPath, ...this.paths));
    }

    public decideProjectName(projectPath: string): string {
        return path.basename(projectPath);
    }
}
