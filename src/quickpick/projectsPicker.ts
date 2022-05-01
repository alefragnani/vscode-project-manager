/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import fs = require("fs");
import { commands, Disposable, MessageItem, QuickInputButton, QuickPickItem, QuickPickOptions, ThemeIcon, window, workspace } from "vscode";
import { ThemeIcons } from "vscode-ext-codicons";
import { Locators } from "../../vscode-project-manager-core/src/autodetect/locators";
import { Container } from "../../vscode-project-manager-core/src/container";
import { Project } from "../../vscode-project-manager-core/src/project";
import { ProjectStorage } from "../../vscode-project-manager-core/src/storage";
import { PathUtils } from "../../vscode-project-manager-core/src/utils/path";
import { isRemotePath } from "../../vscode-project-manager-core/src/utils/remote";
import { CommandLocation, ConfirmSwitchOnActiveWindowMode, OpenInCurrentWindowIfEmptyMode } from "../constants";

function getProjects(itemsSorted: any[]): Promise<{}> {

    return new Promise((resolve, reject) => {

        resolve(itemsSorted);

    });
}

function folderNotFound(name: string, projectStorage: ProjectStorage) {

    const optionUpdateProject = <MessageItem> {
        title: "Update Project"
    };
    const optionDeleteProject = <MessageItem> {
        title: "Delete Project"
    };

    window.showErrorMessage("The project has an invalid path. What would you like to do?", optionUpdateProject, optionDeleteProject).then(option => {
        // nothing selected
        if (typeof option === "undefined") {
            return;
        }

        if (option.title === "Update Project") {
            commands.executeCommand("projectManager.editProjects");
        } else { // Update Project
            projectStorage.pop(name);
            projectStorage.save();
            return;
        }
    });
}

class OpenInNewWindowButton implements QuickInputButton {
    constructor(public iconPath: ThemeIcon, public tooltip: string) { }
}

const openInNewWindowButton = new OpenInNewWindowButton(ThemeIcons.link_external, 'Open in New Window');

export interface Picked<T> {
    item: T;
    button: QuickInputButton | undefined
}

export async function pickProjects(projectStorage: ProjectStorage, locators: Locators): Promise<Picked<Project> | undefined> {
    const disposables: Disposable[] = [];

    try {
        return await new Promise<Picked<Project> | undefined>((resolve, reject) => {
            let items = [];
            const filterByTags = Container.context.globalState.get<string[]>("filterByTags", []);
            items = projectStorage.getProjectsByTags(filterByTags);
            items = locators.sortGroupedList(items);

            getProjects(items)
                .then((folders) => {
                    return locators.getLocatorProjects(<any[]> folders, locators.vscLocator);
                })
                .then((folders) => {
                    return locators.getLocatorProjects(<any[]> folders, locators.gitLocator);
                })
                .then((folders) => {
                    return locators.getLocatorProjects(<any[]> folders, locators.mercurialLocator);
                })
                .then((folders) => {
                    return locators.getLocatorProjects(<any[]> folders, locators.svnLocator);
                })
                .then((folders) => {
                    return locators.getLocatorProjects(<any[]> folders, locators.anyLocator);
                })
                .then((folders) => { // sort
                    if ((<any[]> folders).length === 0) {
                        window.showInformationMessage("No projects saved yet!");
                        return resolve(undefined);
                    } else {
                        if (!workspace.getConfiguration("projectManager").get("groupList", false)) {
                            folders = locators.sortProjectList(folders);
                        }
                        commands.executeCommand("setContext", "inProjectManagerList", true);

                        //
                        folders =  (<any[]> folders).map(folder => {
                            return {
                                label: folder.label,
                                description: folder.description,
                                buttons: [openInNewWindowButton]
                            }
                        });
                        const input = window.createQuickPick();
                        input.placeholder = "Loading projects (pick one)...";
                        input.matchOnDescription = workspace.getConfiguration("projectManager").get("filterOnFullPath", false);
                        input.matchOnDetail = false;
                        input.items = <any[]> folders;
                        input.onDidChangeSelection(items => {
                            const item = items[0];
                            if (item) {
                                // resolve(item.uri);
                                resolve(<Picked<Project>>{
                                    item: {
                                        name: item.label,
                                        rootPath: PathUtils.normalizePath(item.description)
                                    }, button: undefined
                                });
                                input.hide();
                                return;
                            }
                        }),
                        input.onDidTriggerItemButton(item => {
                            if (item) {
                                console.log(`item: ${item.button.tooltip}`);
                                resolve(<Picked<Project>>{
                                    item: {
                                        name: item.item.label,
                                        rootPath: PathUtils.normalizePath(item.item.description)
                                    }, button: item.button
                                });
                                input.hide();
                                return;
                            }
                        }),
                        input.onDidHide(() => {
                            // rgs.forEach(rg => rg.kill());
                            resolve(undefined);
                            input.dispose();
                            return
                        })
                        input.show();

                        // window.showQuickPick(<any[]> folders, options)
                        //     .then((selected) => {
                        //         commands.executeCommand("setContext", "inProjectManagerList", false);
                        //         if (!selected) {
                        //             return resolve(undefined);
                        //         }

                        //         if (!isRemotePath(selected.description) && !fs.existsSync(selected.description.toString())) {

                        //             if (selected.label.substr(0, 2) === "$(") {
                        //                 window.showErrorMessage("Path does not exist or is unavailable.");
                        //                 return resolve(undefined);
                        //             }

                        //             folderNotFound(selected.label, projectStorage);
                        //         } else {
                        //             // project path
                        //             return resolve(<Project> {
                        //                 name: selected.label,
                        //                 rootPath: PathUtils.normalizePath(selected.description)
                        //             });
                        //         }
                        //     }, (reason) => {
                        //         commands.executeCommand("setContext", "inProjectManagerList", false);
                        //         return resolve(undefined);          
                        //     });
                    }
                });
        });

    } finally {
        disposables.forEach(d => d.dispose());
    }

}

export function shouldOpenInNewWindow(openInNewWindow: boolean, calledFrom: CommandLocation): boolean {
    if (!openInNewWindow) {
        return false;
    }

    if (workspace.workspaceFolders || window.activeTextEditor) {
        return openInNewWindow;
    }

    // Check for setting name before and after typo was corrected
    const oldValue =  workspace.getConfiguration("projectManager").inspect("openInCurrenWindowIfEmpty");
    const newValue =  workspace.getConfiguration("projectManager").inspect("openInCurrentWindowIfEmpty");

    let config: string | unknown;
    if (oldValue.globalValue) {
        config = newValue.globalValue === undefined ? oldValue.globalValue : newValue.globalValue;
    } else {
        config = workspace.getConfiguration("projectManager").get<string>("openInCurrentWindowIfEmpty")
    }
    
    if (config === OpenInCurrentWindowIfEmptyMode.always) {
        return false;
    }
    if (config === OpenInCurrentWindowIfEmptyMode.never) {
        return openInNewWindow;
    }

    switch (config) {
        case OpenInCurrentWindowIfEmptyMode.always:
            return false;
        case OpenInCurrentWindowIfEmptyMode.never:
            return openInNewWindow;
        case OpenInCurrentWindowIfEmptyMode.onlyUsingCommandPalette:
            return calledFrom !== CommandLocation.CommandPalette;
        case OpenInCurrentWindowIfEmptyMode.onlyUsingSideBar:
            return calledFrom !== CommandLocation.SideBar;
    }
}

function shouldConfirmSwitchOnActiveWindow(calledFrom: CommandLocation): boolean {
    if (!workspace.workspaceFolders || !window.activeTextEditor) {
        return false;
    }

    const config = workspace.getConfiguration("projectManager").get<string>("confirmSwitchOnActiveWindow", ConfirmSwitchOnActiveWindowMode.never);
    
    switch (config) {
        case ConfirmSwitchOnActiveWindowMode.never:
            return false;
        case ConfirmSwitchOnActiveWindowMode.onlyUsingCommandPalette:
            return calledFrom === CommandLocation.CommandPalette;
        case ConfirmSwitchOnActiveWindowMode.onlyUsingSideBar:
            return calledFrom === CommandLocation.SideBar;
        case ConfirmSwitchOnActiveWindowMode.always:
            return true;
    }
}

export async function canSwitchOnActiveWindow(calledFrom: CommandLocation): Promise<boolean> {
    const showConfirmation = shouldConfirmSwitchOnActiveWindow(calledFrom);
    if (!showConfirmation) {
        return true;
    }

    const optionOpenProject = <MessageItem> {
        title: "Open Project"
    };
    const answer = await window.showWarningMessage("Do you want to open the project in the active window?", {modal: true}, optionOpenProject);
    return answer === optionOpenProject;
}