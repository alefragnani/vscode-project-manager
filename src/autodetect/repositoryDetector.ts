/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as path from "path";
import { AutodetectedProjectInfo } from "./autodetectedProjectInfo";

export interface RepositoryDetector {

    isRepoDir(projectPath: string);
    getProjectDetails(projectPath: string): AutodetectedProjectInfo;
    isRepoFile?(projectFile: string): boolean;

}

export class CustomRepositoryDetector implements RepositoryDetector {

    constructor(public paths: string[]) {
    }

    public isRepoDir(projectPath: string) {
        return fs.existsSync(path.join(projectPath, ...this.paths));
    }

    public getProjectDetails(projectPath: string): AutodetectedProjectInfo {
        return {
            name: path.basename(projectPath),
            fullPath: projectPath
        };
    }
}