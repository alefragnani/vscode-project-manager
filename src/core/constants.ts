/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

export const PROJECTS_FILE = "projects.json";

export enum CommandLocation { CommandPalette, SideBar, StatusBar }

export enum OpenInCurrentWindowIfEmptyMode {
    always = "always",
    onlyUsingCommandPalette = "onlyUsingCommandPalette",
    onlyUsingSideBar = "onlyUsingSideBar",
    never = "never"
}

export enum ConfirmSwitchOnActiveWindowMode {
    never = "never",
    onlyUsingCommandPalette = "onlyUsingCommandPalette",
    onlyUsingSideBar = "onlyUsingSideBar",
    always = "always"
}