/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Uri } from "vscode";
import { isRemotePath } from "./remote";

export function buildProjectUri(rootPath: string): Uri {
    return isRemotePath(rootPath) ? Uri.parse(rootPath) : Uri.file(rootPath);
}
