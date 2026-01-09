/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { codicons } from "vscode-ext-codicons";
import { CustomRepositoryDetector } from "./repositoryDetector";

export class AnyRepositoryDetector extends CustomRepositoryDetector {

    protected getIcon(): string {
        return codicons.file_directory;
    }
}