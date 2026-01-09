/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ExtensionContext } from "vscode";
import { Stack } from "../utils/stack";
import { Project } from "./project";

export class Container {

    static initialize(context: ExtensionContext) {
        this._context = context;
    }

    private static _context: ExtensionContext;
    static get context() {
        return this._context;
    }

    private static _stack: Stack;
    static get stack() {
        if (!this._stack) {
            const recentProjects: string = this._context.globalState.get<string>("recent", "");
            this._stack = new Stack();
            this._stack.fromString(recentProjects);
        }

        return this._stack;
    }

    private static _currentProject: Project;
    public static get currentProject(): Project {
        return this._currentProject;
    }
    public static set currentProject(value: Project) {
        this._currentProject = value;
    }
}
