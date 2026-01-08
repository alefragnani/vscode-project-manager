/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as path from "path";
import { RepositoryDetector } from "./repositoryDetector";
import { AutodetectedProjectInfo } from "./autodetectedProjectInfo";


export class VSCodeRepositoryDetector implements RepositoryDetector {
    
    public isRepoDir(projectPath: string) {
        return fs.existsSync(path.join(projectPath, ".vscode"));
    }

    public isRepoFile(projectFile: string): boolean {
        return projectFile.toLowerCase().endsWith(".code-workspace");
    }

    getProjectDetails(projectPath: string): AutodetectedProjectInfo {
        return {
            name: projectPath.toLowerCase().endsWith(".code-workspace") ? path.basename(projectPath, ".code-workspace") : path.basename(projectPath),
            fullPath: projectPath
        }
    }
}
