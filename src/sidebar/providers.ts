/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";
import { Locators } from "../autodetect/locators";
import { ProjectStorage } from "../storage/storage";
import { ProjectNode, TagNode } from "./nodes";
import { AutodetectProvider } from "./autodetectProvider";
import { StorageProvider } from "./storageProvider";
import { Container } from "../core/container";
import { l10n } from "vscode";

export class Providers {

    public storageProvider: StorageProvider;
    public vscodeProvider: AutodetectProvider;
    public gitProvider: AutodetectProvider;
    public mercurialProvider: AutodetectProvider;
    public svnProvider: AutodetectProvider;
    public anyProvider: AutodetectProvider;

    private storageTreeView: vscode.TreeView<ProjectNode | TagNode>;
    private vscodeTreeView: vscode.TreeView<ProjectNode>;
    private gitTreeView: vscode.TreeView<ProjectNode>;
    private mercurialTreeView: vscode.TreeView<ProjectNode>;
    private svnTreeView: vscode.TreeView<ProjectNode>;
    private anyTreeView: vscode.TreeView<ProjectNode>;

    private locators: Locators;
    private projectStorage: ProjectStorage;

    constructor(locators: Locators, storage: ProjectStorage) {
        this.locators = locators;
        this.projectStorage = storage;

        this.storageProvider = new StorageProvider(this.projectStorage);
        this.vscodeProvider = new AutodetectProvider(this.locators.vscLocator);
        this.gitProvider = new AutodetectProvider(this.locators.gitLocator);
        this.mercurialProvider = new AutodetectProvider(this.locators.mercurialLocator);
        this.svnProvider = new AutodetectProvider(this.locators.svnLocator);
        this.anyProvider = new AutodetectProvider(this.locators.anyLocator);

        this.storageTreeView = vscode.window.createTreeView("projectsExplorerFavorites", {
            treeDataProvider: this.storageProvider,
            showCollapseAll: true
        });
        this.vscodeTreeView = vscode.window.createTreeView("projectsExplorerVSCode", {
            treeDataProvider: this.vscodeProvider,
            showCollapseAll: false
        });
        this.gitTreeView = vscode.window.createTreeView("projectsExplorerGit", {
            treeDataProvider: this.gitProvider,
            showCollapseAll: false
        });
        this.mercurialTreeView = vscode.window.createTreeView("projectsExplorerMercurial", {
            treeDataProvider: this.mercurialProvider,
            showCollapseAll: false
        });
        this.svnTreeView = vscode.window.createTreeView("projectsExplorerSVN", {
            treeDataProvider: this.svnProvider,
            showCollapseAll: false
        });
        this.anyTreeView = vscode.window.createTreeView("projectsExplorerAny", {
            treeDataProvider: this.anyProvider,
            showCollapseAll: false
        });

        this.registerStorageTreeViewListeners();
    }

    private registerStorageTreeViewListeners() {
        Container.context.subscriptions.push(
            this.storageTreeView.onDidExpandElement(async event => {
                await this.handleStorageTreeViewExpansionChange(event, "expanded");
            }),
            this.storageTreeView.onDidCollapseElement(async event => {
                await this.handleStorageTreeViewExpansionChange(event, "collapsed");
            })
        );
    }

    private async handleStorageTreeViewExpansionChange(event: vscode.TreeViewExpansionEvent<ProjectNode | TagNode>, state: "expanded" | "collapsed") {
        const element = event.element;
        if (element instanceof TagNode) {
            const behavior = vscode.workspace.getConfiguration("projectManager").get<string>("tags.collapseItems", "startExpanded");
            const shouldPersistExpansion = behavior === "startExpanded" || behavior === "startCollapsed";
            if (shouldPersistExpansion) {
                const tagId = (element.label as string) || (element.description as string) || "";
                await StorageProvider.setTagExpanded(tagId, state === "expanded");
            }
        }
    }

    public async showTreeViewFromAllProviders() {
        // this.projectProviderStorage.showTreeView();
        await this.vscodeProvider.showTreeView();
        await this.gitProvider.showTreeView();
        await this.mercurialProvider.showTreeView();
        await this.svnProvider.showTreeView();
        await this.anyProvider.showTreeView();

        this.updateTreeViewDetails();
    }

    public refreshTreeViews() {
        this.storageProvider.refresh();
        this.vscodeProvider.refresh();
        this.gitProvider.refresh();
        this.mercurialProvider.refresh();
        this.svnProvider.refresh();
        this.anyProvider.refresh();
    }

    public refreshStorageTreeView() {
        this.storageProvider.refresh();
        this.updateTreeViewStorage();
    }

    public updateTreeViewStorage() {
        const disabledProjects = this.projectStorage.disabled()?.length;
        const disabledProjectsTitle = disabledProjects ? l10n.t("{0} disabled", disabledProjects) : "";

        const filterByTags = Container.context.globalState.get<string[]>("filterByTags", []);
        const filterByTagsTitle = filterByTags.length > 0 ? l10n.t("filtered by tags") : "";

        const separatorTitle = disabledProjects && filterByTags.length > 0 ? "/ " : " ";

        this.storageTreeView.title = `Favorites (${this.projectStorage.length() - disabledProjects})`;
        this.storageTreeView.description = `${disabledProjectsTitle} ${separatorTitle} ${filterByTagsTitle}`;
    }

    public updateTreeViewDetails() {
        this.updateTreeViewStorage();
        this.vscodeTreeView.title = `VSCode (${this.locators.vscLocator.projectList.length})`;
        this.gitTreeView.title = `Git (${this.locators.gitLocator.projectList.length})`;
        this.mercurialTreeView.title = `Mercurial (${this.locators.mercurialLocator.projectList.length})`;
        this.svnTreeView.title = `SVN (${this.locators.svnLocator.projectList.length})`;
        this.anyTreeView.title = `Any (${this.locators.anyLocator.projectList.length})`;
    }
}
