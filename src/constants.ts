export const PROJECTS_FILE = "projects.json";

export enum CommandLocation { CommandPalette, SideBar, StatusBar }

export enum OpenInCurrentWindowIfEmptyMode {
    always = "always",
    onlyUsingCommandPalette = "onlyUsingCommandPalette",
    onlyUsingSideBar = "onlyUsingSideBar",
    never = "never"
}