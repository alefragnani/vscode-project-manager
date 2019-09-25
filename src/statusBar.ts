import { StatusBarAlignment, StatusBarItem, window, workspace } from "vscode"; 
import { Locators } from "../vscode-project-manager-core/src/model/locators";
import { Project, ProjectStorage } from "../vscode-project-manager-core/src/model/storage";

let statusItem: StatusBarItem;

export function showStatusBar(projectStorage: ProjectStorage, locators: Locators, projectName?: string) {

  const showStatusConfig = workspace.getConfiguration("projectManager").get("showProjectNameInStatusBar");

  // multi-root - decide do use the "first folder" as the original "rootPath"
  // let currentProjectPath = vscode.workspace.rootPath;
//   const workspace0 = workspace.workspaceFolders ? workspace.workspaceFolders[0] : undefined;
//   const currentProjectPath = workspace0 ? workspace0.uri.fsPath : undefined;
  const workspace0 = workspace.workspaceFile ? workspace.workspaceFile :
                        workspace.workspaceFolders ? workspace.workspaceFolders[0].uri : 
                        undefined;
  const currentProjectPath = workspace0 ? workspace0.fsPath : undefined;

  if (!showStatusConfig || !currentProjectPath) { return; }

  if (!statusItem) {
      statusItem = window.createStatusBarItem(StatusBarAlignment.Left);
  }
  statusItem.text = "$(file-directory) ";
  statusItem.tooltip = currentProjectPath;

  const openInNewWindow: boolean = workspace.getConfiguration("projectManager").get("openInNewWindowWhenClickingInStatusBar", false);
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

//   if (projectStorage.length() === 0) {
//       return;
//   }

  let foundProject: Project = projectStorage.existsWithRootPath(currentProjectPath);
  if (!foundProject) {
      foundProject = locators.vscLocator.existsWithRootPath(currentProjectPath);
  }
  if (!foundProject) {
      foundProject = locators.gitLocator.existsWithRootPath(currentProjectPath);
  }
  if (!foundProject) {
      foundProject = locators.mercurialLocator.existsWithRootPath(currentProjectPath);
  }
  if (!foundProject) {
      foundProject = locators.svnLocator.existsWithRootPath(currentProjectPath);
  }
  if (!foundProject) {
      foundProject = locators.anyLocator.existsWithRootPath(currentProjectPath);
  }
  if (foundProject) {
      statusItem.text += foundProject.name;
      statusItem.show();
  }
}

export function updateStatusBar(oldName: string, oldPath: string, newName: string): void {
  if (statusItem.text === "$(file-directory) " + oldName && statusItem.tooltip === oldPath) {
      statusItem.text = "$(file-directory) " + newName;
  }
}