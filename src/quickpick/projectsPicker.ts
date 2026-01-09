/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import fs = require("fs");
import { commands, Disposable, l10n, MessageItem, QuickInputButton, QuickPickItem, ThemeIcon, window, workspace } from "vscode";
import { ThemeIcons } from "vscode-ext-codicons";
import { CustomProjectLocator } from "../autodetect/abstractLocator";
import { Locators } from "../autodetect/locators";
import { Container } from "../core/container";
import { Project } from "../core/project";
import { ProjectStorage } from "../storage/storage";
import { PathUtils } from "../utils/path";
import { isRemotePath } from "../utils/remote";
import { buildProjectUri } from "../utils/uri";
import { CommandLocation, ConfirmSwitchOnActiveWindowMode, OpenInCurrentWindowIfEmptyMode } from "../core/constants";

function getProjects(itemsSorted: any[]): Promise<any[]> {

    return new Promise((resolve) => {

        resolve(itemsSorted);

    });
}

function folderNotFound(name: string, projectStorage: ProjectStorage) {

    const optionUpdateProject = <MessageItem>{
        title: l10n.t("Update Project")
    };
    const optionDeleteProject = <MessageItem>{
        title: l10n.t("Delete Project")
    };

    window.showErrorMessage(l10n.t("The project has an invalid path. What would you like to do?"), optionUpdateProject, optionDeleteProject).then(option => {
        // nothing selected
        if (typeof option === "undefined") {
            return;
        }

        if (option.title === l10n.t("Update Project")) {
            commands.executeCommand("projectManager.editProjects");
        } else { // Update Project
            projectStorage.pop(name);
            projectStorage.save();
            return;
        }
    });
}

function canPickSelectedProject(item: QuickPickItem, projectStorage: ProjectStorage): boolean {

    if (isRemotePath(item.description)) {
        return true;
    }

    if (fs.existsSync(item.description.toString())) {
        return true;
    }

    if (item.label.substr(0, 2) === "$(") {
        window.showErrorMessage(l10n.t("Path does not exist or is unavailable."));
        return false;
    }

    folderNotFound(item.label, projectStorage);
}

function getProjectsFromLocator(folders: any, locators: Locators, locatorToFilter: CustomProjectLocator, locatorToGetFrom: CustomProjectLocator) {
    if (locatorToFilter && locatorToFilter !== locatorToGetFrom) {
        return folders;
    }

    if (!locators) {
        return folders;
    }

    return locators.getLocatorProjects(<any[]>folders, locatorToGetFrom);
}

class OpenInNewWindowButton implements QuickInputButton {
    constructor(public iconPath: ThemeIcon, public tooltip: string) { }
}

const openInNewWindowButton = new OpenInNewWindowButton(ThemeIcons.link_external, l10n.t('Open in New Window'));

export interface Picked<T> {
    item: T;
    button: QuickInputButton | undefined
}

export async function pickProjects(projectStorage: ProjectStorage, locators: Locators, showOpenInNewWindowButton: boolean,
    locatorToFilter: CustomProjectLocator): Promise<Picked<Project> | undefined> {
    const disposables: Disposable[] = [];

    try {
        return await new Promise<Picked<Project> | undefined>((resolve) => {
            let items = [];
            const filterByTags = Container.context.globalState.get<string[]>("filterByTags", []);
            if (projectStorage) {
                items = projectStorage.getProjectsByTags(filterByTags);
                if (locators) {
                    items = locators?.sortGroupedList(items);
                }
            }

            getProjects(items)
                .then((folders) => {
                    return getProjectsFromLocator(folders, locators, locatorToFilter, locators?.vscLocator);
                })
                .then((folders) => {
                    return getProjectsFromLocator(folders, locators, locatorToFilter, locators?.gitLocator);
                })
                .then((folders) => {
                    return getProjectsFromLocator(folders, locators, locatorToFilter, locators?.mercurialLocator);
                })
                .then((folders) => {
                    return getProjectsFromLocator(folders, locators, locatorToFilter, locators?.svnLocator);
                })
                .then((folders) => {
                    return getProjectsFromLocator(folders, locators, locatorToFilter, locators?.anyLocator);
                })
                .then((folders) => { // sort
                    if ((<any[]>folders).length === 0) {
                        window.showInformationMessage(l10n.t("No projects saved yet!"));
                        return resolve(undefined);
                    } else {
                        if (!workspace.getConfiguration("projectManager").get("groupList", false)) {
                            if (locators) {
                                folders = locators?.sortProjectList(folders);
                            }
                        }
                        commands.executeCommand("setContext", "inProjectManagerList", true);

                        //
                        folders = (<any[]>folders).map(folder => {
                            return {
                                label: folder.label,
                                description: folder.description,
                                profile: folder.profile,
                                buttons: showOpenInNewWindowButton ? [ openInNewWindowButton ] : []
                            };
                        });
                        const input = window.createQuickPick();
                        input.placeholder = l10n.t("Loading projects (pick one)...");
                        input.matchOnDescription = workspace.getConfiguration("projectManager").get("filterOnFullPath", false);
                        input.matchOnDetail = false;
                        input.items = <any[]>folders;
                        input.onDidChangeSelection(items => {
                            const item = <any>items[ 0 ];
                            if (item) {
                                if (!canPickSelectedProject(item, projectStorage)) {
                                    resolve(undefined);
                                    input.hide();
                                    return;
                                }

                                resolve(<Picked<Project>>{
                                    item: {
                                        name: item.label,
                                        rootPath: PathUtils.normalizePath(item.description),
                                        profile: item.profile,
                                    }, button: undefined
                                });
                                input.hide();
                                return;
                            }
                        }),
                        input.onDidTriggerItemButton(item => {
                            if (item) {
                                if (!canPickSelectedProject(item.item, projectStorage)) {
                                    resolve(undefined);
                                    input.hide();
                                    return;
                                }

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
                            commands.executeCommand("setContext", "inProjectManagerList", false);
                            resolve(undefined);
                            input.dispose();
                            return;
                        });
                        input.show();

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
    const oldValue = workspace.getConfiguration("projectManager").inspect("openInCurrenWindowIfEmpty");
    const newValue = workspace.getConfiguration("projectManager").inspect("openInCurrentWindowIfEmpty");

    let config: string | unknown;
    if (oldValue.globalValue) {
        config = newValue.globalValue === undefined ? oldValue.globalValue : newValue.globalValue;
    } else {
        config = workspace.getConfiguration("projectManager").get<string>("openInCurrentWindowIfEmpty");
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

    const optionOpenProject = <MessageItem>{
        title: l10n.t("Open Project")
    };
    const answer = await window.showWarningMessage(l10n.t("Do you want to open the project in the active window?"), { modal: true }, optionOpenProject);
    return answer === optionOpenProject;
}

export async function openPickedProject(picked: Picked<Project>, forceNewWindow: boolean, calledFrom: CommandLocation) {
    if (!picked) { return; }

    if (!picked.button) {
        if (!forceNewWindow && !await canSwitchOnActiveWindow(calledFrom)) {
            return;
        }
    }

    Container.stack.push(picked.item.name);
    Container.context.globalState.update("recent", Container.stack.toString());

    const openInNewWindow = shouldOpenInNewWindow(forceNewWindow || !!picked.button, calledFrom);
    const uri = buildProjectUri(picked.item.rootPath);
    commands.executeCommand("vscode.openFolder", uri, { forceProfile: picked.item.profile, forceNewWindow: openInNewWindow })
        .then(
            () => ({}),  // done
            () => window.showInformationMessage(l10n.t("Could not open the project!")));
}