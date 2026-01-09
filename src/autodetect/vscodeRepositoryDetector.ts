/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as path from "path";
import { RepositoryDetector } from "./repositoryDetector";
import { AutodetectedProjectInfo } from "./autodetectedProjectInfo";
import { codicons } from "vscode-ext-codicons";


export class VSCodeRepositoryDetector implements RepositoryDetector {
    
    public isRepoDir(projectPath: string): boolean {
        return fs.existsSync(path.join(projectPath, ".vscode"));
    }

    public isRepoFile(projectFile: string): boolean {
        return projectFile.toLowerCase().endsWith(".code-workspace");
    }

    public getSupportedFileExtensions(): string[] {
        return [".code-workspace"];
    }

    getProjectInfo(projectPath: string): AutodetectedProjectInfo {
        const isWorkspace = projectPath.toLowerCase().endsWith(".code-workspace");
        return {
            name: isWorkspace ? path.basename(projectPath, ".code-workspace") : path.basename(projectPath),
            fullPath: projectPath,
            icon: isWorkspace ? codicons.root_folder : codicons.file_code
        };
    }
}
