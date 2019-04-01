import * as vscode from "vscode";
import { Locators } from "./locators";
import { ProjectProvider } from "./ProjectProvider";
import { ProjectStorage } from "./storage";

export class Providers {

  public projectProviderStorage: ProjectProvider;
  public projectProviderVSCode: ProjectProvider;
  public projectProviderGit: ProjectProvider;
  public projectProviderMercurial: ProjectProvider;
  public projectProviderSVN: ProjectProvider;
  public projectProviderAny: ProjectProvider;
  
  private locators: Locators;
  private projectStorage: ProjectStorage;

  constructor(context: vscode.ExtensionContext, locators: Locators, storage: ProjectStorage) {
    this.locators = locators;
    this.projectStorage = storage;

    this.projectProviderStorage = new ProjectProvider(this.projectStorage, context);
    this.projectProviderVSCode = new ProjectProvider(this.locators.vscLocator, context);
    this.projectProviderGit = new ProjectProvider(this.locators.gitLocator, context);
    this.projectProviderMercurial = new ProjectProvider(this.locators.mercurialLocator, context);
    this.projectProviderSVN = new ProjectProvider(this.locators.svnLocator, context);
    this.projectProviderAny = new ProjectProvider(this.locators.anyLocator, context);    

    vscode.window.registerTreeDataProvider("projectsExplorerFavorites", this.projectProviderStorage);
    vscode.window.registerTreeDataProvider("projectsExplorerVSCode", this.projectProviderVSCode);
    vscode.window.registerTreeDataProvider("projectsExplorerGit", this.projectProviderGit);
    vscode.window.registerTreeDataProvider("projectsExplorerMercurial", this.projectProviderMercurial);
    vscode.window.registerTreeDataProvider("projectsExplorerSVN", this.projectProviderSVN);
    vscode.window.registerTreeDataProvider("projectsExplorerAny", this.projectProviderAny);
  }

  public showTreeViewFromAllProviders() {
    this.projectProviderStorage.showTreeView();
    this.projectProviderVSCode.showTreeView();
    this.projectProviderGit.showTreeView();
    this.projectProviderMercurial.showTreeView();
    this.projectProviderSVN.showTreeView();
    this.projectProviderAny.showTreeView();
}

}