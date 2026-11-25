/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { commands } from "vscode";
import { Project } from "../core/project";

const PROJECT_NAME_CONTEXT_KEY = "projectManager.projectName";
const REGISTER_WINDOW_TITLE_VARIABLE_COMMAND = "registerWindowTitleVariable";

export async function registerProjectNameWindowTitleVariable(): Promise<void> {
    const availableCommands = await commands.getCommands();
    if (!availableCommands.includes(REGISTER_WINDOW_TITLE_VARIABLE_COMMAND)) {
        return;
    }

    await commands.executeCommand(
        REGISTER_WINDOW_TITLE_VARIABLE_COMMAND,
        "projectName",
        PROJECT_NAME_CONTEXT_KEY
    );
}

export async function updateProjectNameWindowTitleVariable(project?: Project): Promise<void> {
    await commands.executeCommand("setContext", PROJECT_NAME_CONTEXT_KEY, project?.name);
}
