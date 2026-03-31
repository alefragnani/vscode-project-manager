/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import path = require("path");
import * as vscode from "vscode";

import { Locators } from "./autodetect/locators";
import { ProjectStorage } from "./storage/storage";
import { needsMigration, migrateFromFile } from "./storage/migration";
import { PathUtils } from "./utils/path";

import { Providers } from "./sidebar/providers";
import { StorageProvider } from "./sidebar/storageProvider";

import { showStatusBar, updateStatusBar } from "./statusbar/statusBar";
import { getProjectDetails } from "./utils/suggestion";
import { CommandLocation } from "./core/constants";
import { isMacOS, isRemoteUri, isWindows } from "./utils/remote";
import { buildProjectUri } from "./utils/uri";
import { Container } from "./core/container";
import { registerWhatsNew } from "./whats-new/commands";
import { registerSupportProjectManager } from "./commands/supportProjectManager";
import { registerHelpAndFeedbackView } from "./sidebar/helpAndFeedbackView";
import { exportProjects, importProjects } from "./commands/exportImport";
import { registerRevealFileInOS } from "./commands/revealFileInOS";
import { registerOpenSettings } from "./commands/openSettings";
import { pickTags } from "./quickpick/tagsPicker";
import { ViewFavoritesAs } from "./sidebar/constants";
import { registerSortBy, updateSortByContext } from "./commands/sortBy";
import { canSwitchOnActiveWindow, openPickedProject, pickProjects, shouldOpenInNewWindow } from "./quickpick/projectsPicker";
import { CustomProjectLocator } from "./autodetect/abstractLocator";
import { l10n } from "vscode";
import { registerWalkthrough } from "./commands/walkthrough";
import { registerSideBarDecorations } from "./sidebar/decoration";
import { ProjectNode } from "./sidebar/nodes";
import { Project } from "./core/project";

let locators: Locators;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

    Container.initialize(context);

    // Sets storage path if recommended path provided by current version of VS Code.  
    PathUtils.setExtensionContext(context);

    // load the projects
    locators = new Locators();

    context.globalState.setKeysForSync(["projectManager.projects"]);

    if (needsMigration(context.globalState)) {
        try {
            const projectsLocation = vscode.workspace.getConfiguration("projectManager").get<string>("projectsLocation", "");
            const result = await migrateFromFile(context.globalState, projectsLocation);
            if (result.migrated) {
                vscode.window.showInformationMessage(
                    l10n.t("Projects migrated from projects.json to synced storage. ({0} projects)", result.count)
                );
            }
        } catch {
            vscode.window.showErrorMessage(
                l10n.t("Failed to migrate projects.json. You can use Import Projects to load them manually.")
            );
        }
    }

    const projectStorage: ProjectStorage = new ProjectStorage(context.globalState);

    const providerManager: Providers = new Providers(locators, projectStorage);
    locators.setProviderManager(providerManager);

    registerRevealFileInOS();
    registerOpenSettings();
    registerSupportProjectManager();
    registerHelpAndFeedbackView(context);
    registerSortBy();
    registerSideBarDecorations();
    await registerWalkthrough();

    registerWhatsNew();

    context.subscriptions.push(vscode.commands.registerCommand("_projectManager.openFolderWelcome", () => {
        const openFolderCommand = isWindows || isMacOS ? "workbench.action.files.openFolder" : "workbench.action.files.openFileFolder";
        vscode.commands.executeCommand(openFolderCommand);
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

    vscode.commands.registerCommand("_projectManager.open", async (projectPath: string, projectName: string, profile: string) => {
        const uri = buildProjectUri(projectPath);
        if (!await canSwitchOnActiveWindow(CommandLocation.SideBar)) {
            return;
        }
        vscode.commands.executeCommand("vscode.openFolder", uri, { forceProfile: profile , forceNewWindow: false } )
            .then(
                () => ({}),  // done
                () => vscode.window.showInformationMessage(l10n.t("Could not open the project!")));
    });
    vscode.commands.registerCommand("_projectManager.openInNewWindow", (node) => {
        const uri = buildProjectUri(node.command.arguments[0]);
        const openInNewWindow = shouldOpenInNewWindow(true, CommandLocation.SideBar);
        vscode.commands.executeCommand("vscode.openFolder", uri, { forceProfile: node.command.arguments[2] , forceNewWindow: openInNewWindow } )
            .then(
                () => ({}),  // done
                () => vscode.window.showInformationMessage(l10n.t("Could not open the project!")));
    });

    // register commands (here, because it needs to be used right below if an invalid JSON is present)
    vscode.commands.registerCommand("projectManager.saveProject", () => saveProject());
    vscode.commands.registerCommand("projectManager.refreshProjects", () => refreshProjects(true, true));
    locators.registerCommands();
    vscode.commands.registerCommand("projectManager.editProjects", () => editProjects());
    vscode.commands.registerCommand("projectManager.exportProjects", async () => { await exportProjects(projectStorage); });
    vscode.commands.registerCommand("projectManager.importProjects", async () => { await importProjects(projectStorage, () => {
        loadProjectsFile();
        providerManager.storageProvider.refresh();
        providerManager.updateTreeViewStorage();
    }); });
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
    vscode.commands.registerCommand("_projectManager.editGroup", async (node: ProjectNode) => {
        const project = projectStorage.existsWithRootPath(node.command.arguments[0]);
        if (!project) {
            return;
        }

        const currentGroup = project.group || "";
        const ibo = <vscode.InputBoxOptions>{
            prompt: l10n.t("Group Path (e.g. Work/Frontend)"),
            placeHolder: l10n.t("Type a group path, or leave empty for root level"),
            value: currentGroup
        };

        const newGroup = await vscode.window.showInputBox(ibo);
        if (newGroup === undefined) {
            return;
        }

        projectStorage.editGroup(project.name, newGroup);
        await projectStorage.save();
        providerManager.refreshStorageTreeView();
        vscode.window.showInformationMessage(l10n.t("Project group updated!"));
    });
    vscode.commands.registerCommand("_projectManager.refreshFavorites", () => {
        loadProjectsFile();
        providerManager.refreshStorageTreeView();
    });
    vscode.commands.registerCommand("projectManager.addToFavorites", (node) => saveProject(node));
    vscode.commands.registerCommand("_projectManager.toggleProjectEnabled", (node) => toggleProjectEnabled(node));

    function getViewMode(): string {
        const stored = Container.context.globalState.get<string>("favoritesViewMode", undefined);
        if (stored !== undefined) {
            return stored;
        }
        const legacyViewAsList = Container.context.globalState.get<boolean>("viewAsList", true);
        const mode = legacyViewAsList ? "list" : "tags";
        Container.context.globalState.update("favoritesViewMode", mode);
        Container.context.globalState.update("viewAsList", undefined);
        return mode;
    }

    function setViewModeContext(mode: string) {
        vscode.commands.executeCommand("setContext", "projectManager.favoritesViewMode", mode);
        vscode.commands.executeCommand("setContext", "projectManager.viewAsList", mode === "list");
    }

    async function setViewMode(mode: string) {
        await Container.context.globalState.update("favoritesViewMode", mode);
        setViewModeContext(mode);
        providerManager.refreshTreeViews();
    }

    function toggleViewAsFavoriteProjects(view: ViewFavoritesAs) {
        switch (view) {
            case ViewFavoritesAs.VIEW_AS_LIST:
                setViewMode("list");
                break;
            case ViewFavoritesAs.VIEW_AS_TAGS:
                setViewMode("tags");
                break;
            case ViewFavoritesAs.VIEW_AS_GROUPS:
                setViewMode("groups");
                break;
        }
    }

    const viewMode = getViewMode();
    setViewModeContext(viewMode);
    vscode.commands.registerCommand("_projectManager.viewAsTags#sideBarFavorites", () => toggleViewAsFavoriteProjects(ViewFavoritesAs.VIEW_AS_TAGS));
    vscode.commands.registerCommand("_projectManager.viewAsList#sideBarFavorites", () => toggleViewAsFavoriteProjects(ViewFavoritesAs.VIEW_AS_LIST));
    vscode.commands.registerCommand("_projectManager.viewAsGroups#sideBarFavorites", () => toggleViewAsFavoriteProjects(ViewFavoritesAs.VIEW_AS_GROUPS));
    vscode.commands.registerCommand("projectManager.filterProjectsByTag", () => filterProjectsByTag());
    vscode.commands.registerCommand("projectManager.filterProjectsByTag#sideBar", () => filterProjectsByTag());

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

    // TODO: Extract the detection of the current project from `showStatusBar`, and optimize how it works.
    // Evaluate if it is really necessary to get the `Project` instance, or if just the root path is enough.
    // Up until then, the call to `showStatusBar` (and the assignment to `Container.currentProject`)
    // intentionally happens *before* `providerManager.showTreeViewFromAllProviders()`, and changing this order may
    // introduce issues.
    const currentProject = showStatusBar(projectStorage, locators);
    Container.currentProject = currentProject;

    // // new place to register TreeView
    await providerManager.showTreeViewFromAllProviders();

    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(async cfg => {
        if (cfg.affectsConfiguration("projectManager.git") || cfg.affectsConfiguration("projectManager.hg") ||
            cfg.affectsConfiguration("projectManager.vscode") || cfg.affectsConfiguration("projectManager.svn") || 
            cfg.affectsConfiguration("projectManager.any") || 
            cfg.affectsConfiguration("projectManager.ignoreProjectsWithinProjects") || 
            cfg.affectsConfiguration("projectManager.supportSymlinksOnBaseFolders")) {
            refreshProjects();
        }

        if (cfg.affectsConfiguration("workbench.iconTheme")) {
            providerManager.refreshTreeViews();
        }

        if (cfg.affectsConfiguration("projectManager.sortList")) {
            updateSortByContext();
            providerManager.storageProvider.refresh();
            providerManager.updateTreeViewStorage();
        }

        if (cfg.affectsConfiguration("projectManager.showParentFolderInfoOnDuplicates")) {
            providerManager.refreshTreeViews();
        }

        if (cfg.affectsConfiguration("projectManager.tags.collapseItems")) {
            await StorageProvider.resetTagExpansionState();
            providerManager.refreshStorageTreeView();
        }
    }));

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
        });
    }

    function editProjects() {
        vscode.commands.executeCommand("projectManager.exportProjects");
    }

    async function saveProject(node?: ProjectNode) {
        let wpath: string;
        let rootPath: string;

        if (node) {
            wpath = node.label as string; 
            rootPath = node.command.arguments[0];
        } else {
            const projectDetails = await getProjectDetails();
            if (!projectDetails) {
                return;
            }
            rootPath = projectDetails.path;
            wpath = projectDetails.name;
        }

        let selectedTags: string[] | undefined;

        const saveProjectInternal = async (projectName: string, tags?: string[]): Promise<boolean> => {
            if (projectName === "") {
                vscode.window.showWarningMessage(l10n.t("You must define a name for the project."));
                return false;
            }

            const tagsToSave = (tags && tags.length > 0) ? tags : undefined;

            if (!projectStorage.exists(projectName)) {
                Container.stack.push(projectName);
                context.globalState.update("recent", Container.stack.toString());
                projectStorage.push(projectName, rootPath);
                if (tagsToSave) {
                    projectStorage.editTags(projectName, tagsToSave);
                }
                await projectStorage.save();
                providerManager.updateTreeViewStorage();
                vscode.window.showInformationMessage(l10n.t("Project saved!"));
                if (!node) {
                    showStatusBar(projectStorage, locators, projectName);
                    updateCurrentProject();
                }
                return true;
            } else {
                const optionUpdate = <vscode.MessageItem> {
                    title: l10n.t("Update")
                };
                const optionCancel = <vscode.MessageItem> {
                    title: l10n.t("Cancel")
                };

                const option = await vscode.window.showInformationMessage(l10n.t("Project already exists!"), optionUpdate, optionCancel);

                // nothing selected or canceled
                if (typeof option === "undefined" || option.title === l10n.t("Cancel")) {
                    return false;
                }

                if (option.title === l10n.t("Update")) {
                    Container.stack.push(projectName);
                    context.globalState.update("recent", Container.stack.toString());
                    projectStorage.updateRootPath(projectName, rootPath);
                    if (tagsToSave) {
                        projectStorage.editTags(projectName, tagsToSave);
                    }
                    await projectStorage.save();
                    providerManager.updateTreeViewStorage();
                    vscode.window.showInformationMessage(l10n.t("Project saved!"));
                    if (!node) {
                        showStatusBar(projectStorage, locators, projectName);
                    }
                    return true;
                }

                return false;
            }
        };

        const input = vscode.window.createInputBox();
        input.title = l10n.t("Save Project");
        input.prompt = l10n.t("Project Name");
        input.placeholder = l10n.t("Type a name for your project");
        input.value = wpath;

        const tagsButton: vscode.QuickInputButton = {
            iconPath: new vscode.ThemeIcon("tag"),
            tooltip: l10n.t("Select tags")
        };

        input.buttons = [ tagsButton ];

        input.onDidAccept(async () => {
            const saved = await saveProjectInternal(input.value, selectedTags);
            if (saved) {
                input.hide();
                input.dispose();
            }
        });

        input.onDidTriggerButton(async (button) => {
            if (button !== tagsButton) {
                return;
            }

            if (input.value === "") {
                vscode.window.showWarningMessage(l10n.t("You must define a name for the project."));
                return;
            }

            let preselectedTags: string[] = selectedTags ?? [];
            const existingProject = projectStorage.existsWithRootPath(rootPath);
            if (existingProject && existingProject.name.toLowerCase() === input.value.toLowerCase() && (!selectedTags || selectedTags.length === 0)) {
                preselectedTags = existingProject.tags;
            }

            const picked = await pickTags(projectStorage, preselectedTags, {
                useDefaultTags: true,
                useNoTagsDefined: false,
                allowAddingNewTags: true
            });

            if (!picked) {
                return;
            }

            selectedTags = picked;

            if (selectedTags.length > 0) {
                input.prompt = l10n.t("Selected tags: {0}", selectedTags.join(", "));
            } else {
                input.prompt = l10n.t("Project Name");
            }

            const saved = await saveProjectInternal(input.value, selectedTags);
            if (saved) {
                input.hide();
                input.dispose();
            }
        });

        input.onDidHide(() => {
            input.dispose();
        });

        input.show();
    }

    function updateCurrentProject() {
        const workspace0 = vscode.workspace.workspaceFile ? vscode.workspace.workspaceFile :
            vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[ 0 ].uri :
                undefined;
        const currentProjectPath = workspace0 ? workspace0.fsPath : undefined;

        let foundProject: Project;
        if (workspace0 && isRemoteUri(workspace0)) {
            foundProject = projectStorage.existsRemoteWithRootPath(workspace0);
        } else {
            foundProject = projectStorage.existsWithRootPath(currentProjectPath, true);
        }
        Container.currentProject = foundProject;
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
        if (errorLoading !== "") {
            vscode.window.showErrorMessage(
                l10n.t("Error loading projects: {0}", errorLoading)
            );
        }
    }

    function addProjectPathToWorkspace(projectPath: string) {
        if (path.extname(projectPath) === ".code-workspace") {
            vscode.window.showWarningMessage(l10n.t("You can't add a Workspace to another Workspace."));
            return;
        }
        vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? 
            vscode.workspace.workspaceFolders.length : 0, null, { uri: vscode.Uri.file(projectPath)});
    }

    async function addProjectToWorkspace(node: ProjectNode) {
        if (node) {
            addProjectPathToWorkspace(node.command.arguments[0]);
            return;
        }

        const pick = await pickProjects(projectStorage, locators, false, undefined); 
        if (pick) {
            addProjectPathToWorkspace(pick.item.rootPath);
        }
    }

    async function deleteProject(node: ProjectNode) {
        Container.stack.pop(node.command.arguments[1]);
        projectStorage.pop(node.command.arguments[1]);
        await projectStorage.save();
        providerManager.updateTreeViewStorage();
        vscode.window.showInformationMessage(l10n.t("Project successfully deleted!"));
    }

    async function renameProject(node: ProjectNode) {
        const oldName: string = node.command.arguments[1];
        const ibo = <vscode.InputBoxOptions> {
            prompt: l10n.t("New Project Name"),
            placeHolder: l10n.t("Type a new name for the project"),
            value: oldName
        };

        const newName = await vscode.window.showInputBox(ibo);
        if (typeof newName === "undefined" || newName === oldName) {
            return;
        }

        if (newName === "") {
            vscode.window.showWarningMessage(l10n.t("You must define a new name for the project."));
            return;
        }

        if (!projectStorage.exists(newName) || newName.toLowerCase() === oldName.toLowerCase()) {
            Container.stack.rename(oldName, newName);
            projectStorage.rename(oldName, newName);
            await projectStorage.save();
            vscode.window.showInformationMessage(l10n.t("Project renamed!"));
            updateStatusBar(oldName, node.command.arguments[0], newName);
        } else {
            vscode.window.showErrorMessage(l10n.t("Project already exists!"));
        }
    }

    async function editTags(node: ProjectNode) {

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
            await projectStorage.save();
            vscode.window.showInformationMessage(l10n.t("Project updated!"));
        }
    }

    async function toggleProjectEnabled(node: ProjectNode, askForUndo = true) {
        const projectName: string = node.command.arguments[1];
        const enabled: boolean = projectStorage.toggleEnabled(projectName);
        
        if (enabled === undefined) {
            return;
        }

        await projectStorage.save();
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

    locators.dispose();
}