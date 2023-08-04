/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import fs = require("fs");
import path = require("path");
import * as vscode from "vscode";

import { Locators } from "../vscode-project-manager-core/src/autodetect/locators";
import { ProjectStorage } from "../vscode-project-manager-core/src/storage";
import { PathUtils } from "../vscode-project-manager-core/src/utils/path";

import { Providers } from "../vscode-project-manager-core/src/sidebar/providers";

import { showStatusBar, updateStatusBar } from "./statusBar";
import { getProjectDetails } from "../vscode-project-manager-core/src/suggestion";
import { CommandLocation, PROJECTS_FILE } from "./constants";
import { isMacOS, isWindows } from "../vscode-project-manager-core/src/utils/remote";
import { buildProjectUri } from "../vscode-project-manager-core/src/utils/uri";
import { Container } from "../vscode-project-manager-core/src/container";
import { registerWhatsNew } from "./whats-new/commands";
import { registerSupportProjectManager } from "./commands/supportProjectManager";
import { registerHelpAndFeedbackView } from "./sidebar/helpAndFeedbackView";
import { registerRevealFileInOS } from "./commands/revealFileInOS";
import { registerOpenSettings } from "./commands/openSettings";
import { pickTags } from "../vscode-project-manager-core/src/quickpick/tagsPicker";
import { ViewFavoritesAs } from "../vscode-project-manager-core/src/sidebar/constants";
import { registerSortBy, updateSortByContext } from "../vscode-project-manager-core/src/commands/sortBy";
import { canSwitchOnActiveWindow, openPickedProject, pickProjects, shouldOpenInNewWindow } from "./quickpick/projectsPicker";
import { CustomProjectLocator } from "../vscode-project-manager-core/src/autodetect/abstractLocator";
import { l10n } from "vscode";
import { registerWalkthrough } from "./commands/walkthrough";

let locators: Locators

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

    Container.initialize(context);

    // Sets storage path if recommended path provided by current version of VS Code.  
    PathUtils.setExtensionContext(context);

    // load the projects
    locators = new Locators();
    const projectStorage: ProjectStorage = new ProjectStorage(getProjectFilePath());

    const providerManager: Providers = new Providers(locators, projectStorage);
    locators.setProviderManager(providerManager);

    registerRevealFileInOS();
    registerOpenSettings();
    registerSupportProjectManager();
    registerHelpAndFeedbackView(context);
    registerSortBy();
    await registerWalkthrough();

    registerWhatsNew();

    context.subscriptions.push(vscode.commands.registerCommand("_projectManager.openFolderWelcome", () => {
        const openFolderCommand = isWindows || isMacOS ? "workbench.action.files.openFolder" : "workbench.action.files.openFileFolder"
        vscode.commands.executeCommand(openFolderCommand)
    }));
    context.subscriptions.push(vscode.commands.registerCommand("projectManager.hideGitWelcome", () => {
        context.globalState.update("hideGitWelcome", true);
        providerManager.showTreeViewFromAllProviders();
        vscode.commands.executeCommand("setContext", "projectManager.hiddenGitWelcome", true);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("projectManager.showGitWelcome", () => {
        context.globalState.update("hideGitWelcome", false);
        providerManager.showTreeViewFromAllProviders();
        vscode.commands.executeCommand("setContext", "projectManager.hiddenGitWelcome", false);
    }));
    const hideGitWelcome = context.globalState.get<boolean>("hideGitWelcome", false);
    vscode.commands.executeCommand("setContext", "projectManager.hiddenGitWelcome", hideGitWelcome);

    vscode.commands.registerCommand("_projectManager.open", async (node: string | any) => {
        const uri = typeof node === "string" 
                    ? buildProjectUri(node)
                    : buildProjectUri(node.command.arguments[0]);
        if (!await canSwitchOnActiveWindow(CommandLocation.SideBar)) {
            return;
        }
        vscode.commands.executeCommand("vscode.openFolder", uri, false)
            .then(
            value => ({}),  // done
            value => vscode.window.showInformationMessage(l10n.t("Could not open the project!")));
    });
    vscode.commands.registerCommand("_projectManager.openInNewWindow", node => {
        const uri = buildProjectUri(node.command.arguments[0]);
        const openInNewWindow = shouldOpenInNewWindow(true, CommandLocation.SideBar);
        vscode.commands.executeCommand("vscode.openFolder", uri, openInNewWindow)
            .then(
            value => ({}),  // done
            value => vscode.window.showInformationMessage(l10n.t("Could not open the project!")));
    });

    // register commands (here, because it needs to be used right below if an invalid JSON is present)
    vscode.commands.registerCommand("projectManager.saveProject", () => saveProject());
    vscode.commands.registerCommand("projectManager.refreshProjects", () => refreshProjects(true, true));
    locators.registerCommands();
    vscode.commands.registerCommand("projectManager.editProjects", () => editProjects());
    vscode.commands.registerCommand("projectManager.listProjects", () => listProjects(false));
    vscode.commands.registerCommand("projectManager.listProjectsNewWindow", () => listProjects(true));
    
    vscode.commands.registerCommand("projectManager.listFavoriteProjects#sideBarFavorites", () => listStorageProjects());
    vscode.commands.registerCommand("projectManager.listGitProjects#sideBarGit", () => listAutoDetectedProjects(locators.gitLocator));
    vscode.commands.registerCommand("projectManager.listVSCodeProjects#sideBarVSCode", () => listAutoDetectedProjects(locators.vscLocator));
    vscode.commands.registerCommand("projectManager.listSVNProjects#sideBarSVN", () => listAutoDetectedProjects(locators.svnLocator));
    vscode.commands.registerCommand("projectManager.listMercurialProjects#sideBarMercurial", () => listAutoDetectedProjects(locators.mercurialLocator));
    vscode.commands.registerCommand("projectManager.listAnyProjects#sideBarAny", () => listAutoDetectedProjects(locators.anyLocator));

    // new commands (ActivityBar)
    vscode.commands.registerCommand("projectManager.addToWorkspace#sideBar", (node) => addProjectToWorkspace(node));
    vscode.commands.registerCommand("projectManager.addToWorkspace", () => addProjectToWorkspace(undefined));
    vscode.commands.registerCommand("_projectManager.deleteProject", (node) => deleteProject(node));
    vscode.commands.registerCommand("_projectManager.renameProject", (node) => renameProject(node));
    vscode.commands.registerCommand("_projectManager.editTags", (node) => editTags(node));
    vscode.commands.registerCommand("projectManager.addToFavorites", (node) => saveProject(node));
    vscode.commands.registerCommand("_projectManager.toggleProjectEnabled", (node) => toggleProjectEnabled(node));

    const viewAsList = Container.context.globalState.get<boolean>("viewAsList", true);
    vscode.commands.executeCommand("setContext", "projectManager.viewAsList", viewAsList);
    vscode.commands.registerCommand("_projectManager.viewAsTags#sideBarFavorites", () => toggleViewAsFavoriteProjects(ViewFavoritesAs.VIEW_AS_TAGS));
    vscode.commands.registerCommand("_projectManager.viewAsList#sideBarFavorites", () => toggleViewAsFavoriteProjects(ViewFavoritesAs.VIEW_AS_LIST));
    vscode.commands.registerCommand("projectManager.filterProjectsByTag", () => filterProjectsByTag());
    vscode.commands.registerCommand("projectManager.filterProjectsByTag#sideBar", () => filterProjectsByTag());

    function toggleViewAsFavoriteProjects(view: ViewFavoritesAs) {
        if (view === ViewFavoritesAs.VIEW_AS_LIST) {
            vscode.commands.executeCommand("setContext", "projectManager.viewAsList", true);
        } else {
            vscode.commands.executeCommand("setContext", "projectManager.viewAsList", false);
        }
        Container.context.globalState.update("viewAsList", view === ViewFavoritesAs.VIEW_AS_LIST);
        providerManager.refreshTreeViews();
    }

    async function filterProjectsByTag() {
        const filterByTags = Container.context.globalState.get<string[]>("filterByTags", []);

        const tags = await pickTags(projectStorage, filterByTags, {
            useDefaultTags: false,
            useNoTagsDefined: true,
            showWarningWhenHasNoTagsToPick: true
        });

        if (!tags) {
            return;
        }

        Container.context.globalState.update("filterByTags", tags);
        providerManager.refreshStorageTreeView();
    }

    loadProjectsFile();

    // // new place to register TreeView
    await providerManager.showTreeViewFromAllProviders();

    fs.watchFile(getProjectFilePath(), (prev, next) => {
        loadProjectsFile();
        providerManager.storageProvider.refresh();
        providerManager.updateTreeViewStorage();
    });

    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(cfg => {
        if (cfg.affectsConfiguration("projectManager.git") || cfg.affectsConfiguration("projectManager.hg") ||
            cfg.affectsConfiguration("projectManager.vscode") || cfg.affectsConfiguration("projectManager.svn") || 
            cfg.affectsConfiguration("projectManager.any") || 
            cfg.affectsConfiguration("projectManager.ignoreProjectsWithinProjects") || 
            cfg.affectsConfiguration("projectManager.supportSymlinksOnBaseFolders")) {
            refreshProjects();
        }

        if (cfg.affectsConfiguration("workbench.iconTheme")) {
            providerManager.refreshTreeViews()
        }

        if (cfg.affectsConfiguration("projectManager.sortList")) {
            updateSortByContext();
            providerManager.storageProvider.refresh();
            providerManager.updateTreeViewStorage();
        }

        if (cfg.affectsConfiguration("projectManager.showParentFolderInfoOnDuplicates")) {
            providerManager.refreshTreeViews();
        }
    }));

    showStatusBar(projectStorage, locators);
    
    function refreshProjects(showMessage?: boolean, forceRefresh?: boolean) {

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: l10n.t("Refreshing Projects"),
            cancellable: false
        }, async (progress) => {
            progress.report({ message: "VSCode" });
            const rvscode = await locators.vscLocator.refreshProjects(forceRefresh);
        
            progress.report({ message: "Git" });
            const rgit = await locators.gitLocator.refreshProjects(forceRefresh);
        
            progress.report({ message: "Mercurial" });
            const rmercurial = await locators.mercurialLocator.refreshProjects(forceRefresh);
        
            progress.report({ message: "SVN" });
            const rsvn = await locators.svnLocator.refreshProjects(forceRefresh);

            progress.report({ message: "Any" });
            const rany = await locators.anyLocator.refreshProjects(forceRefresh);

            if (rvscode || rgit || rmercurial || rsvn || rany || forceRefresh) {
                progress.report({ message: "Activity Bar"});
                if (rvscode || forceRefresh) {
                    providerManager.vscodeProvider.refresh();
                }
                if (rgit || forceRefresh) {
                    providerManager.gitProvider.refresh();
                }
                if (rmercurial || forceRefresh) {
                    providerManager.mercurialProvider.refresh();
                }
                if (rsvn || forceRefresh) {
                    providerManager.svnProvider.refresh();
                }
                if (rany || forceRefresh) {
                    providerManager.anyProvider.refresh();
                }
                providerManager.showTreeViewFromAllProviders();
            }

            if (showMessage) {
                vscode.window.showInformationMessage(l10n.t("The projects have been refreshed!"));
            }
        })
    }

    function editProjects() {
        if (fs.existsSync(getProjectFilePath())) {
            vscode.workspace.openTextDocument(getProjectFilePath()).then(doc => {
                vscode.window.showTextDocument(doc);
            });
        } else {
            const optionEditProject = <vscode.MessageItem> {
                title: "Yes, edit manually"
            };
            vscode.window.showErrorMessage(l10n.t("No projects saved yet! You should open a folder and use Save Project instead. Do you really want to edit manually? "), optionEditProject).then(option => {
                // nothing selected
                if (typeof option === "undefined") {
                    return;
                }

                if (option.title === l10n.t("Yes, edit manually")) {
                    projectStorage.push("Project Name", "Root Path");
                    projectStorage.save();
                    providerManager.updateTreeViewStorage();
                    vscode.commands.executeCommand("projectManager.editProjects");
                } else {
                    return;
                }
            });
        }
    }

    async function saveProject(node?: any) {
        let wpath: string;
        let rootPath: string;

        if (node) {
            wpath = node.label; 
            rootPath = node.command.arguments[0];
        } else {
            const projectDetails = await getProjectDetails();
            if (!projectDetails) {
                return;
            }
            rootPath = projectDetails.path;
            wpath = projectDetails.name;
        }

        // ask the PROJECT NAME (suggest the )
        const ibo = <vscode.InputBoxOptions> {
            prompt: l10n.t("Project Name"),
            placeHolder: l10n.t("Type a name for your project"),
            value: wpath
        };

        vscode.window.showInputBox(ibo).then(projectName => {
            if (typeof projectName === "undefined") {
                return;
            }

            // 'empty'
            if (projectName === "") {
                vscode.window.showWarningMessage(l10n.t("You must define a name for the project."));
                return;
            }
   
            if (!projectStorage.exists(projectName)) {
                Container.stack.push(projectName);
                context.globalState.update("recent", Container.stack.toString());
                projectStorage.push(projectName, rootPath);
                projectStorage.save();
                providerManager.updateTreeViewStorage();
                vscode.window.showInformationMessage(l10n.t("Project saved!"));
                if (!node) {
                    showStatusBar(projectStorage, locators, projectName);
                }
            } else {
                const optionUpdate = <vscode.MessageItem> {
                    title: l10n.t("Update")
                };
                const optionCancel = <vscode.MessageItem> {
                    title: l10n.t("Cancel")
                };

                vscode.window.showInformationMessage(l10n.t("Project already exists!"), optionUpdate, optionCancel).then(option => {
                    // nothing selected
                    if (typeof option === "undefined") {
                        return;
                    }

                    if (option.title === l10n.t("Update")) {
                        Container.stack.push(projectName);
                        context.globalState.update("recent", Container.stack.toString());
                        projectStorage.updateRootPath(projectName, rootPath);
                        projectStorage.save();
                        providerManager.updateTreeViewStorage();
                        vscode.window.showInformationMessage(l10n.t("Project saved!"));
                        if (!node) {
                            showStatusBar(projectStorage, locators, projectName);
                        }
                        return;
                    } else {
                        return;
                    }
                });
            }
        });
    }

    async function listProjects(forceNewWindow: boolean) {
        const pick = await pickProjects(projectStorage, locators, !forceNewWindow, undefined); 
        openPickedProject(pick, forceNewWindow, CommandLocation.CommandPalette);
    }

    async function listAutoDetectedProjects(locator: CustomProjectLocator) {
        const pick = await pickProjects(undefined, locators, true, locator); 
        openPickedProject(pick, false, CommandLocation.SideBar);
    }

    async function listStorageProjects() {
        const pick = await pickProjects(projectStorage, undefined, true, undefined); 
        openPickedProject(pick, false, CommandLocation.SideBar);
    }

    function loadProjectsFile() {
        const errorLoading: string = projectStorage.load();
        // how to handle now, since the extension starts 'at load'?
        if (errorLoading !== "") {
            const optionOpenFile = <vscode.MessageItem> {
                title: l10n.t("Open File")
            };
            vscode.window.showErrorMessage(l10n.t("Error loading projects.json file. Message: {0}", errorLoading), optionOpenFile).then(option => {
                // nothing selected
                if (typeof option === "undefined") {
                    return;
                }

                if (option.title === l10n.t("Open File")) {
                    vscode.commands.executeCommand("projectManager.editProjects");
                } else {
                    return;
                }
            });
            return null;
        }
    }

    function getProjectFilePath() {
        let projectFile: string;
        const projectsLocation: string = vscode.workspace.getConfiguration("projectManager").get<string>("projectsLocation");
        if (projectsLocation !== "") {
            projectFile = path.join(PathUtils.expandHomePath(projectsLocation), PROJECTS_FILE);
        } else {
            projectFile = PathUtils.getFilePathFromAppData(PROJECTS_FILE);
        }
        return projectFile;
    }

    function addProjectPathToWorkspace(projectPath: string) {
        if (path.extname(projectPath) === ".code-workspace") {
            vscode.window.showWarningMessage(l10n.t("You can't add a Workspace to another Workspace."));
            return;
        }
        vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? 
            vscode.workspace.workspaceFolders.length : 0, null, { uri: vscode.Uri.file(projectPath)});
    }

    async function addProjectToWorkspace(node: any) {
        if (node) {
            addProjectPathToWorkspace(node.command.arguments[0]);
            return;
        }

        const pick = await pickProjects(projectStorage, locators, false, undefined); 
        if (pick) {
            addProjectPathToWorkspace(pick.item.rootPath);
        }
    }

    function deleteProject(node: any) {
        Container.stack.pop(node.command.arguments[1]);
        projectStorage.pop(node.command.arguments[1]);
        projectStorage.save();
        providerManager.updateTreeViewStorage();
        vscode.window.showInformationMessage(l10n.t("Project successfully deleted!"));
    }

    function renameProject(node: any) {
        const oldName: string = node.command.arguments[1];
        // Display a message box to the user
        // ask the NEW PROJECT NAME ()
        const ibo = <vscode.InputBoxOptions> {
            prompt: l10n.t("New Project Name"),
            placeHolder: l10n.t("Type a new name for the project"),
            value: oldName
        };

        vscode.window.showInputBox(ibo).then(newName => {
            if (typeof newName === "undefined" || newName === oldName) {
                return;
            }

            // 'empty'
            if (newName === "") {
                vscode.window.showWarningMessage(l10n.t("You must define a new name for the project."));
                return;
            }

            if (!projectStorage.exists(newName) || newName.toLowerCase() === oldName.toLowerCase()) {
                Container.stack.rename(oldName, newName)
                projectStorage.rename(oldName, newName);
                projectStorage.save();
                vscode.window.showInformationMessage(l10n.t("Project renamed!"));
                updateStatusBar(oldName, node.command.arguments[0], newName);
            } else {
                vscode.window.showErrorMessage(l10n.t("Project already exists!"));
            }
        });
    }

    async function editTags(node: any) {

        const project = projectStorage.existsWithRootPath(node.command.arguments[0]);
        if (!project) {
            return;
        }

        const picked = await pickTags(projectStorage, project.tags, {
            useDefaultTags: true,
            useNoTagsDefined: false
        });

        if (picked) {
            projectStorage.editTags(project.name, picked);
            projectStorage.save();
            vscode.window.showInformationMessage(l10n.t("Project updated!"));
        }
    }

    function toggleProjectEnabled(node: any, askForUndo = true) {
        const projectName: string = node.command.arguments[1];
        const enabled: boolean = projectStorage.toggleEnabled(projectName);
        
        if (enabled === undefined) {
            return;
        }

        projectStorage.save();
        providerManager.updateTreeViewStorage();

        if (!askForUndo) {
            return;
        }

        if (enabled) {
            vscode.window.showInformationMessage(l10n.t("Project \"{0}\" enabled.", projectName), "Undo").then(undo => {
                if (undo) {
                    toggleProjectEnabled(node, false);
                }
            });
        } else {
            vscode.window.showInformationMessage(l10n.t("Project \"{0}\" disabled.", projectName), "Undo").then(undo => {
                if (undo) {
                    toggleProjectEnabled(node, false);
                }
            });
        }
            
    }
}

export function deactivate() {
    // if (vscode.workspace.getConfiguration("projectManager").get("cacheProjectsBetweenSessions", true)) { 
    //     return; 
    // }

    locators.dispose();
}