import * as vscode from "vscode";

import { CustomProjectLocator, CustomRepositoryDetector } from "./abstractLocator";
import { GitRepositoryDetector } from "./gitLocator";
import { PathUtils } from "./PathUtils";
import { ProjectProvider } from "./ProjectProvider";
import { Providers } from "./providers";
import { ProjectsSorter } from "./sorter";
import { StringStack } from "./stack";

export const VSCODE_ICON = "$(file-code)";
export const GIT_ICON = "$(git-branch)";
export const MERCURIAL_ICON = "$(git-branch)";
export const SVN_ICON = "$(zap)";
export const ANY_ICON = "$(file-directory)";

export class Locators {
  
  public vscLocator: CustomProjectLocator = new CustomProjectLocator("vscode", "VSCode", VSCODE_ICON, new CustomRepositoryDetector([".vscode"]));
  public gitLocator: CustomProjectLocator = new CustomProjectLocator("git", "Git", GIT_ICON, new GitRepositoryDetector([".git"]));
  public mercurialLocator: CustomProjectLocator = new CustomProjectLocator("hg", "Mercurial", MERCURIAL_ICON, new CustomRepositoryDetector([".hg", "hgrc"]));
  public svnLocator: CustomProjectLocator = new CustomProjectLocator("svn", "SVN", SVN_ICON, new CustomRepositoryDetector([".svn", "pristine"]));
  public anyLocator: CustomProjectLocator = new CustomProjectLocator("any", "Any", ANY_ICON, new CustomRepositoryDetector([]));
  
  private providerManager: Providers;
  private aStack: StringStack;

  constructor(stack: StringStack) {
    this.aStack = stack;
  }

  public registerCommands() {
    vscode.commands.registerCommand("projectManager.refreshVSCodeProjects", () => this.refreshProjectsByType("VSCode", this.vscLocator, this.providerManager.projectProviderVSCode, true, true));
    vscode.commands.registerCommand("projectManager.refreshGitProjects", () => this.refreshProjectsByType("Git", this.gitLocator, this.providerManager.projectProviderGit, true, true));
    vscode.commands.registerCommand("projectManager.refreshMercurialProjects", () => this.refreshProjectsByType("Mercurial", this.mercurialLocator, this.providerManager.projectProviderMercurial, true, true));
    vscode.commands.registerCommand("projectManager.refreshSVNProjects", () => this.refreshProjectsByType("SVN", this.svnLocator, this.providerManager.projectProviderSVN, true, true));
    vscode.commands.registerCommand("projectManager.refreshAnyProjects", () => this.refreshProjectsByType("Any", this.anyLocator, this.providerManager.projectProviderAny, true, true));
  }

  public setProviderManager(providerManager: Providers) {
    this.providerManager = providerManager;
  }

  public getLocatorProjects(itemsSorted: any[], locator: CustomProjectLocator): Promise<{}> {

    return new Promise((resolve, reject) => {

      locator.locateProjects()
        .then(this.filterKnownDirectories.bind(this, itemsSorted))
        .then((dirList: any[]) => {
          let newItems = [];
          newItems = dirList.map(item => {
            return {
              label: locator.icon + " " + item.name,
              description: item.fullPath
            };
          });

          newItems = this.sortGroupedList(newItems);
          resolve(itemsSorted.concat(newItems));
        });
    });
  }

  public sortGroupedList(items): any[] {
    if (vscode.workspace.getConfiguration("projectManager").get("groupList", false)) {
      return this.sortProjectList(items);
    } else {
      return items;
    }
  }

  public sortProjectList(items): any[] {
    let itemsToShow = PathUtils.expandHomePaths(items);
    itemsToShow = this.removeRootPath(itemsToShow);
    const checkInvalidPath: boolean = vscode.workspace.getConfiguration("projectManager").get("checkInvalidPathsBeforeListing", true);
    if (checkInvalidPath) {
      itemsToShow = PathUtils.indicateInvalidPaths(itemsToShow);
    }
    const sortList = vscode.workspace.getConfiguration("projectManager").get("sortList", "Name");
    const newItemsSorted = ProjectsSorter.SortItemsByCriteria(itemsToShow, sortList, this.aStack);
    return newItemsSorted;
  }

  public refreshProjectsByType(projectType: string, locator: CustomProjectLocator, projectProvider: ProjectProvider, showMessage?: boolean, forceRefresh?: boolean) {
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Refreshing Projects",
      cancellable: false
    }, async (progress) => {
      progress.report({ increment: 50, message: projectType });
      const result = await locator.refreshProjects(forceRefresh);

      if (result || forceRefresh) {
        progress.report({ increment: 50, message: projectType });
        projectProvider.refresh();
        projectProvider.showTreeView();
      }
    }).then(async () => {
      if (showMessage) {
        await this.delay(1000);
        vscode.window.showInformationMessage(`${projectType} projects have been refreshed!`);
      }
    })
  }

  private removeRootPath(items: any[]): any[] {
    // if (!vscode.workspace.rootPath) {
    const workspace0 = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0] : undefined;
    if (!workspace0 || !vscode.workspace.getConfiguration("projectManager").get("removeCurrentProjectFromList")) {
      return items;
    } else {
      return items.filter(value => value.description.toString().toLowerCase() !== vscode.workspace.rootPath.toLowerCase());
    }
  }

  // Filters out any newDirectories entries that are present in knownDirectories.
  private filterKnownDirectories(knownDirectories: any[], newDirectories: any[]): Promise<any[]> {
    if (knownDirectories) {
      newDirectories = newDirectories.filter(item =>
        !knownDirectories.some(sortedItem =>
          PathUtils.expandHomePath(sortedItem.description).toLowerCase() === PathUtils.expandHomePath(item.fullPath).toLowerCase()));
    }

    return Promise.resolve(newDirectories);
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}
