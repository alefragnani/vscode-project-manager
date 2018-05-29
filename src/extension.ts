// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import fs = require("fs");
import path = require("path");
import * as vscode from "vscode";
import stack = require("./stack");

import { GitLocator } from "./gitLocator";
import { homeDir, PathUtils } from "./PathUtils";
import { ProjectProvider } from "./ProjectProvider";
import { ProjectsSorter } from "./sorter";
import { Project, ProjectStorage } from "./storage";
import { SvnLocator } from "./svnLocator";
import { VisualStudioCodeLocator } from "./vscodeLocator";

const PROJECTS_FILE = "projects.json";

const enum ProjectsSource {
    Projects,
    VSCode,
    Git,
    Svn
}

export interface ProjectsSourceSet extends Array<ProjectsSource> { };

const vscLocator: VisualStudioCodeLocator = new VisualStudioCodeLocator();
const gitLocator: GitLocator = new GitLocator();
const svnLocator: SvnLocator = new SvnLocator();
const locators = [vscLocator, gitLocator, svnLocator];

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    const recentProjects: string = context.globalState.get<string>("recent", "");
    const aStack: stack.StringStack = new stack.StringStack();
    aStack.fromString(recentProjects);

    // load the projects
    const projectStorage: ProjectStorage = new ProjectStorage(getProjectFilePath());

    // tree-view optional
    // let canShowTreeView: boolean = vscode.workspace.getConfiguration("projectManager").get("treeview.visible", false);
    // vscode.commands.executeCommand("setContext", "projectManager.canShowTreeView", canShowTreeView);

    vscode.commands.registerCommand("projectManager.open", (node: string | any) => {
        let uri: vscode.Uri;
        if (typeof node === "string") {
            uri = vscode.Uri.file(node);
        } else {
            uri = vscode.Uri.file(node.command.arguments[0]);
        }
        vscode.commands.executeCommand("vscode.openFolder", uri, false)
            .then(
            value => ({}),  // done
            value => vscode.window.showInformationMessage("Could not open the project!"));
    });
    vscode.commands.registerCommand("projectManager.openInNewWindow", node => {
        const uri: vscode.Uri = vscode.Uri.file(node.command.arguments[0]);
        vscode.commands.executeCommand("vscode.openFolder", uri, true)
            .then(
            value => ({}),  // done
            value => vscode.window.showInformationMessage("Could not open the project!"));
    });

    // register commands (here, because it needs to be used right below if an invalid JSON is present)
    vscode.commands.registerCommand("projectManager.saveProject", () => saveProject());
    vscode.commands.registerCommand("projectManager.refreshProjects", () => refreshProjects(true, true));
    vscode.commands.registerCommand("projectManager.editProjects", () => editProjects());
    vscode.commands.registerCommand("projectManager.listProjects", () => listProjects(false, [ProjectsSource.Projects, ProjectsSource.VSCode, ProjectsSource.Git, ProjectsSource.Svn]));
    vscode.commands.registerCommand("projectManager.listProjectsNewWindow", () => listProjects(true, [ProjectsSource.Projects, ProjectsSource.VSCode, ProjectsSource.Git, ProjectsSource.Svn]));
    loadProjectsFile();

    // tree-view
    let providers: any[] = [];
    const projectProvider1 = new ProjectProvider(projectStorage, context);
    const projectProvider2 = new ProjectProvider(vscLocator, context);
    const projectProvider3 = new ProjectProvider(gitLocator, context);
    const projectProvider4 = new ProjectProvider(svnLocator, context);
    providers.push(projectProvider1);
    providers.push(projectProvider2);
    providers.push(projectProvider3);
    providers.push(projectProvider4);

    vscode.window.registerTreeDataProvider("projectsExplorerFavorites", projectProvider1);
    vscode.window.registerTreeDataProvider("projectsExplorervscode", projectProvider2);
    vscode.window.registerTreeDataProvider("projectsExplorergit", projectProvider3);
    vscode.window.registerTreeDataProvider("projectsExplorersvn", projectProvider4);
    for (let index = 0; index < providers.length; index++) {
        const element = providers[index];
        element.showTreeView();
    }

    fs.watchFile(getProjectFilePath(), {interval: 100}, (prev, next) => {
        loadProjectsFile();
        projectProvider1.refresh();
        projectProvider2.refresh();
        projectProvider3.refresh();
        projectProvider4.refresh();
    });

    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(cfg => {
        if (cfg.affectsConfiguration("projectManager.git") || cfg.affectsConfiguration("projectManager.vscode") ||
            cfg.affectsConfiguration("projectManager.svn") || cfg.affectsConfiguration("projectManager.cacheProjectsBetweenSessions")) {
            refreshProjects();
        }
        refreshTreeViewOnChangeConfiguration();
    }));

    let statusItem: vscode.StatusBarItem;
    showStatusBar();

    // function commands
    function showStatusBar(projectName?: string) {
        const showStatusConfig = vscode.workspace.getConfiguration("projectManager").get("showProjectNameInStatusBar");
        // multi-root - decide do use the "first folder" as the original "rootPath"
        // let currentProjectPath = vscode.workspace.rootPath;
        const workspace0 = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0] : undefined;
        const currentProjectPath = workspace0 ? workspace0.uri.fsPath : undefined;

        if (!showStatusConfig || !currentProjectPath) { return; }

        if (!statusItem) {
            statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        }
        statusItem.text = "$(file-directory) ";
        statusItem.tooltip = currentProjectPath;

        const openInNewWindow: boolean = vscode.workspace.getConfiguration("projectManager").get("openInNewWindowWhenClickingInStatusBar", false);
        if (openInNewWindow) {
            statusItem.command = "projectManager.listProjectsNewWindow";
        } else {
            statusItem.command = "projectManager.listProjects";
        }

        // if we have a projectName, we don't need to search.
        if (projectName) {
            statusItem.text += projectName;
            statusItem.show();
            return;
        }

        if (projectStorage.length() === 0) {
            return;
        }

        // let foundProject: Project = projectStorage.existsWithRootPath(PathUtils.compactHomePath(currentProjectPath));
        let foundProject: Project = projectStorage.existsWithRootPath(currentProjectPath);
        if (!foundProject) {
            foundProject = vscLocator.existsWithRootPath(currentProjectPath);
        }
        if (!foundProject) {
            foundProject = gitLocator.existsWithRootPath(currentProjectPath);
        }
        if (!foundProject) {
            foundProject = svnLocator.existsWithRootPath(currentProjectPath);
        }
        if (foundProject) {
            statusItem.text += foundProject.name;
            statusItem.show();
        }
    }

    function refreshTreeViewOnChangeConfiguration() {
        const config: boolean = vscode.workspace.getConfiguration("projectManager").get("treeview.visible", false);
        // if (canShowTreeView !== config) {
        //     canShowTreeView = config;
        //     vscode.commands.executeCommand("setContext", "projectManager.canShowTreeView", canShowTreeView);
        // }
        for (let index = 0; index < providers.length; index++) {
            const element = providers[index];
            element.showTreeView();
        }
    }

    function refreshProjects(showMessage?: boolean, forceProviderRefresh?: boolean) {
        let refreshedSomething: boolean = false;
        for (const locator of locators) {
            refreshedSomething = refreshedSomething || locator.refreshProjects();
        }

        if (refreshedSomething || forceProviderRefresh) {
            projectProvider1.refresh();
            projectProvider2.refresh();
            projectProvider3.refresh();
            projectProvider4.refresh();
        }

        if (showMessage) {
            vscode.window.showInformationMessage("The projects have been refreshed!");
        }
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
            vscode.window.showErrorMessage("No projects saved yet! You should open a folder and use Save Project instead. Do you really want to edit manually? ", optionEditProject).then(option => {
                // nothing selected
                if (typeof option === "undefined") {
                    return;
                }

                if (option.title === "Yes, edit manually") {
                    projectStorage.push("Project Name", "Root Path", "");
                    projectStorage.save();
                    vscode.commands.executeCommand("projectManager.editProjects");
                } else {
                    return;
                }
            });
        }
    }

    function saveProject() {
        // Display a message box to the user
        // let wpath = vscode.workspace.rootPath;
        const workspace0 = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0] : undefined;
        let wpath = workspace0 ? workspace0.uri.fsPath : undefined;
        if (process.platform === "win32") {
            wpath = wpath.substr(wpath.lastIndexOf("\\") + 1);
        } else {
            wpath = wpath.substr(wpath.lastIndexOf("/") + 1);
        }

        // ask the PROJECT NAME (suggest the )
        const ibo = <vscode.InputBoxOptions> {
            prompt: "Project Name",
            placeHolder: "Type a name for your project",
            value: wpath
        };

        vscode.window.showInputBox(ibo).then(projectName => {
            if (typeof projectName === "undefined") {
                return;
            }

            // 'empty'
            if (projectName === "") {
                vscode.window.showWarningMessage("You must define a name for the project.");
                return;
            }

            // let rootPath = PathUtils.compactHomePath(vscode.workspace.rootPath);
            const workspace0 = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0] : undefined;
            const rootPath = workspace0 ? PathUtils.compactHomePath(workspace0.uri.fsPath) : undefined;
    
            if (!projectStorage.exists(projectName)) {
                aStack.push(projectName);
                context.globalState.update("recent", aStack.toString());
                projectStorage.push(projectName, rootPath, "");
                projectStorage.save();
                vscode.window.showInformationMessage("Project saved!");
                showStatusBar(projectName);
            } else {
                const optionUpdate = <vscode.MessageItem> {
                    title: "Update"
                };
                const optionCancel = <vscode.MessageItem> {
                    title: "Cancel"
                };

                vscode.window.showInformationMessage("Project already exists!", optionUpdate, optionCancel).then(option => {
                    // nothing selected
                    if (typeof option === "undefined") {
                        return;
                    }

                    if (option.title === "Update") {
                        aStack.push(projectName);
                        context.globalState.update("recent", aStack.toString());
                        projectStorage.updateRootPath(projectName, rootPath);
                        projectStorage.save();
                        vscode.window.showInformationMessage("Project saved!");
                        showStatusBar(projectName);
                        return;
                    } else {
                        return;
                    }
                });
            }
        });
    }

    function sortProjectList(items): any[] {
        let itemsToShow = PathUtils.expandHomePaths(items);
        itemsToShow = removeRootPath(itemsToShow);
        const checkInvalidPath: boolean = vscode.workspace.getConfiguration("projectManager").get("checkInvalidPathsBeforeListing", true);
        if (checkInvalidPath) {
            itemsToShow = indicateInvalidPaths(itemsToShow);
        }
        const sortList = vscode.workspace.getConfiguration("projectManager").get("sortList", "Name");
        const newItemsSorted = ProjectsSorter.SortItemsByCriteria(itemsToShow, sortList, aStack);
        return newItemsSorted;
    }

    function sortGroupedList(items): any[] {
        if (vscode.workspace.getConfiguration("projectManager").get("groupList", false)) {
            return sortProjectList(items);
        } else {
            return items;
        }
    }

    function getProjects(itemsSorted: any[], sources: ProjectsSourceSet): Promise<{}> {

        return new Promise((resolve, reject) => {

            if (sources.indexOf(ProjectsSource.Projects) === -1) {
                resolve([]);
            } else {
                resolve(itemsSorted);
            }

        });
    }

    // Filters out any newDirectories entries that are present in knownDirectories.
    function filterKnownDirectories(knownDirectories: any[], newDirectories: any[]): Promise<any[]> {
        if (knownDirectories) {
            newDirectories = newDirectories.filter(item =>
                !knownDirectories.some(sortedItem =>
                    PathUtils.expandHomePath(sortedItem.description).toLowerCase() === PathUtils.expandHomePath(item.fullPath).toLowerCase()));
        }

        return Promise.resolve(newDirectories);
    }

    function getVSCodeProjects(itemsSorted: any[]): Promise<{}> {

        return new Promise((resolve, reject) => {

            vscLocator.locateProjects()
                .then(filterKnownDirectories.bind(this, itemsSorted))
                .then((dirList: any[]) => {
                    let newItems = [];
                    newItems = dirList.map(item => {
                        return {
                            description: item.fullPath,
                            label: "$(file-code) " + item.name
                        };
                    });

                    newItems = sortGroupedList(newItems);
                    resolve(itemsSorted.concat(newItems));
                });
        });
    }

    function getGitProjects(itemsSorted: any[]): Promise<{}> {

        return new Promise((resolve, reject) => {

            gitLocator.locateProjects()
                .then(filterKnownDirectories.bind(this, itemsSorted))
                .then((dirList: any[]) => {
                    let newItems = [];
                    newItems = dirList.map(item => {
                        return {
                            label: "$(git-branch) " + item.name,
                            description: item.fullPath
                        };
                    });

                    newItems = sortGroupedList(newItems);
                    resolve(itemsSorted.concat(newItems));
                });
        });
    }

    function getSvnProjects(itemsSorted: any[]): Promise<{}> {

        return new Promise((resolve, reject) => {

            svnLocator.locateProjects()
                .then(filterKnownDirectories.bind(this, itemsSorted))
                .then((dirList: any[]) => {
                    let newItems = [];
                    newItems = dirList.map(item => {
                        return {
                            label: "$(zap) " + item.name,
                            description: item.fullPath
                        };
                    });

                    newItems = sortGroupedList(newItems);
                    resolve(itemsSorted.concat(newItems));
                });
        });
    }

    function listProjects(forceNewWindow: boolean, sources: ProjectsSourceSet) {
        let items = [];
        items = projectStorage.map();
        items = sortGroupedList(items);

        function onRejectListProjects(reason) {
            vscode.commands.executeCommand("setContext", "inProjectManagerList", false);
            vscode.window.showInformationMessage("Error loading projects: ${reason}");
        }

        // promisses
        function onResolve(selected) {
            vscode.commands.executeCommand("setContext", "inProjectManagerList", false);
            if (!selected) {
                return;
            }

            if (!fs.existsSync(selected.description.toString())) {

                if (selected.label.substr(0, 2) === "$(") {
                    vscode.window.showErrorMessage("Path does not exist or is unavailable.");
                    return;
                }

                const optionUpdateProject = <vscode.MessageItem> {
                    title: "Update Project"
                };
                const optionDeleteProject = <vscode.MessageItem> {
                    title: "Delete Project"
                };

                vscode.window.showErrorMessage("The project has an invalid path. What would you like to do?", optionUpdateProject, optionDeleteProject).then(option => {
                    // nothing selected
                    if (typeof option === "undefined") {
                        return;
                    }

                    if (option.title === "Update Project") {
                        vscode.commands.executeCommand("projectManager.editProjects");
                    } else { // Update Project
                        projectStorage.pop(selected.label);
                        projectStorage.save();
                        return;
                    }
                });
            } else {
                // project path
                let projectPath = selected.description;
                projectPath = normalizePath(projectPath);

                // update MRU
                aStack.push(selected.label);
                context.globalState.update("recent", aStack.toString());

                const uri: vscode.Uri = vscode.Uri.file(projectPath);
                vscode.commands.executeCommand("vscode.openFolder", uri, forceNewWindow)
                    .then(
                    value => ({}),  // done
                    value => vscode.window.showInformationMessage("Could not open the project!"));
            }
        }

        const options = <vscode.QuickPickOptions> {
            matchOnDescription: vscode.workspace.getConfiguration("projectManager").get("filterOnFullPath", false),
            matchOnDetail: false,
            placeHolder: "Loading Projects (pick one to open)"
        };

        getProjects(items, sources)
            .then((folders) => {

                // not in SET
                if (sources.indexOf(ProjectsSource.VSCode) === -1) {
                    return folders;
                }

                return getVSCodeProjects(<any[]> folders);
            })
            .then((folders) => {
                if (sources.indexOf(ProjectsSource.Git) === -1) {
                    return folders;
                }

                return getGitProjects(<any[]> folders);
            })
            .then((folders) => {
                if (sources.indexOf(ProjectsSource.Svn) === -1) {
                    return folders;
                }

                return getSvnProjects(<any[]> folders);
            })
            .then((folders) => { // sort
                if ((<any[]> folders).length === 0) {
                    vscode.window.showInformationMessage("No projects saved yet!");
                    return;
                } else {
                    if (!vscode.workspace.getConfiguration("projectManager").get("groupList", false)) {
                        folders = sortProjectList(folders);
                    }
                    vscode.commands.executeCommand("setContext", "inProjectManagerList", true);
                    vscode.window.showQuickPick(<any[]> folders, options)
                        .then(onResolve, onRejectListProjects);
                }
            });
    }

    function removeRootPath(items: any[]): any[] {
        // if (!vscode.workspace.rootPath) {
        const workspace0 = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0] : undefined;
        if (!workspace0 || !vscode.workspace.getConfiguration("projectManager").get("removeCurrentProjectFromList")) {
            return items;
        } else {
            return items.filter(value => value.description.toString().toLowerCase() !== vscode.workspace.rootPath.toLowerCase());
        }
    }

    function indicateInvalidPaths(items: any[]): any[] {
        for (const element of items) {
            if (!element.detail && (!fs.existsSync(element.description.toString()))) {
                element.detail = "$(circle-slash) Path does not exist";
            }
        }

        return items;
    }

    function normalizePath(path: string): string {
        let normalizedPath: string = path;

        if (!PathUtils.pathIsUNC(normalizedPath)) {
            const replaceable = normalizedPath.split("\\");
            normalizedPath = replaceable.join("\\\\");
        }

        return normalizedPath;
    }

    function getChannelPath(): string {
        if (vscode.env.appName.indexOf("Insiders") > 0) {
            return "Code - Insiders";
        } else {
            return "Code";
        }
    }

    function loadProjectsFile() {
        const errorLoading: string = projectStorage.load();
        // how to handle now, since the extension starts 'at load'?
        if (errorLoading !== "") {
            const optionOpenFile = <vscode.MessageItem> {
                title: "Open File"
            };
            vscode.window.showErrorMessage("Error loading projects.json file. Message: " + errorLoading, optionOpenFile).then(option => {
                // nothing selected
                if (typeof option === "undefined") {
                    return;
                }

                if (option.title === "Open File") {
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
            projectFile = path.join(projectsLocation, PROJECTS_FILE);
        } else {
            const appdata = process.env.APPDATA || (process.platform === "darwin" ? process.env.HOME + "/Library/Application Support" : "/var/local");
            const channelPath: string = getChannelPath();
            projectFile = path.join(appdata, channelPath, "User", PROJECTS_FILE);
            // in linux, it may not work with /var/local, then try to use /home/myuser/.config
            if ((process.platform === "linux") && (!fs.existsSync(projectFile))) {
                projectFile = path.join(homeDir, ".config/", channelPath, "User", PROJECTS_FILE);
            }
        }
        return projectFile;
    }
}
