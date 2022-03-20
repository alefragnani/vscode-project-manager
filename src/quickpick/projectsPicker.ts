/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import fs = require("fs");
import { commands, QuickPickOptions, window, workspace } from "vscode";
import { Locators } from "../../vscode-project-manager-core/src/autodetect/locators";
import { Container } from "../../vscode-project-manager-core/src/container";
import { Project } from "../../vscode-project-manager-core/src/project";
import { ProjectStorage } from "../../vscode-project-manager-core/src/storage";
import { PathUtils } from "../../vscode-project-manager-core/src/utils/path";
import { isRemotePath } from "../../vscode-project-manager-core/src/utils/remote";

function getProjects(itemsSorted: any[]): Promise<{}> {

    return new Promise((resolve, reject) => {

        resolve(itemsSorted);

    });
}

export async function pickProjects(projectStorage: ProjectStorage, locators: Locators, folderNotFound: (name: string, path: string) => void): Promise<Project | undefined> {
    let items = [];
    const filterByTags = Container.context.globalState.get<string[]>("filterByTags", []);
    items = projectStorage.getProjectsByTags(filterByTags);
    items = locators.sortGroupedList(items);

    return new Promise<Project | undefined>((resolve, reject) => {

        const options = <QuickPickOptions> {
            matchOnDescription: workspace.getConfiguration("projectManager").get("filterOnFullPath", false),
            matchOnDetail: false,
            placeHolder: "Loading Projects (pick one...)"
        };

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
                    window.showQuickPick(<any[]> folders, options)
                        .then((selected) => {
                            commands.executeCommand("setContext", "inProjectManagerList", false);
                            if (!selected) {
                                return resolve(undefined);
                            }

                            if (!isRemotePath(selected.description) && !fs.existsSync(selected.description.toString())) {

                                if (selected.label.substr(0, 2) === "$(") {
                                    window.showErrorMessage("Path does not exist or is unavailable.");
                                    return resolve(undefined);
                                }

                                if (folderNotFound) {
                                    folderNotFound(selected.label, selected.description);
                                }
                            } else {
                                // project path
                                return resolve(<Project> {
                                    name: selected.label,
                                    rootPath: PathUtils.normalizePath(selected.description)
                                });
                            }
                        }, (reason) => {
                            commands.executeCommand("setContext", "inProjectManagerList", false);
                            return resolve(undefined);          
                        });
                }
            });
    });
}