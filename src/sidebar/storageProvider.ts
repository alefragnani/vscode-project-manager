/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import path = require("path");
import * as vscode from "vscode";
import { Container } from "../core/container";
import { ProjectStorage } from "../storage/storage";
import { PathUtils } from "../utils/path";
import { isRemotePath } from "../utils/remote";
import { sortProjects } from "../utils/sorter";
import { NO_TAGS_DEFINED } from "./constants";
import { NoTagNode, ProjectNode, TagNode } from "./nodes";

interface ProjectInQuickPick {
    label: string;
    description: string;
    profile: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ProjectInQuickPickList extends Array<ProjectInQuickPick> { }

export class StorageProvider implements vscode.TreeDataProvider<ProjectNode | TagNode> {

    public readonly onDidChangeTreeData: vscode.Event<ProjectNode | TagNode | void>;

    private projectSource: ProjectStorage;
    private internalOnDidChangeTreeData: vscode.EventEmitter<ProjectNode | TagNode | void> = new vscode.EventEmitter<ProjectNode | void>();
    private static readonly TAGS_EXPANSION_STATE_KEY = "projectsExplorerFavorites.tagsExpansionState";

    constructor(projectSource: ProjectStorage) {
        this.projectSource = projectSource;
        this.onDidChangeTreeData = this.internalOnDidChangeTreeData.event;
    }

    private static getTagExpansionState(): Record<string, boolean> {
        return Container.context.globalState.get<Record<string, boolean>>(StorageProvider.TAGS_EXPANSION_STATE_KEY, {});
    }

    public static async resetTagExpansionState(): Promise<void> {
        await Container.context.globalState.update(StorageProvider.TAGS_EXPANSION_STATE_KEY, {});
    }

    public static getTagCollapsibleState(tagId: string, behavior: string): vscode.TreeItemCollapsibleState {
        switch (behavior) {
            case "alwaysExpanded":
                return vscode.TreeItemCollapsibleState.Expanded;
            case "alwaysCollapsed":
                return vscode.TreeItemCollapsibleState.Collapsed;
            case "startExpanded":
            case "startCollapsed": {
                const expansionState = StorageProvider.getTagExpansionState();
                const isExpanded = expansionState[ tagId ];
                if (isExpanded === undefined) {
                    return behavior === "startExpanded" ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed;
                }
                return isExpanded ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed;
            }
            default:
                return vscode.TreeItemCollapsibleState.Expanded;
        }
    }

    public static async setTagExpanded(tagId: string, expanded: boolean): Promise<void> {
        const expansionState = StorageProvider.getTagExpansionState();
        const newExpansionState = { ...expansionState, [ tagId ]: expanded };
        await Container.context.globalState.update(StorageProvider.TAGS_EXPANSION_STATE_KEY, newExpansionState);
    }

    public refresh(): void {
        this.internalOnDidChangeTreeData.fire();
    }

    public getTreeItem(element: ProjectNode | TagNode): vscode.TreeItem {
        return element;
    }

    public getChildren(element?: ProjectNode | TagNode): Thenable<ProjectNode[] | TagNode[]> {

        // loop !!!
        return new Promise(resolve => {

            if (element) {

                const nodes: ProjectNode[] = [];

                let projectsMapped = <ProjectInQuickPickList>this.projectSource.getProjectsByTag(element.label);

                if (projectsMapped.length === 0) {
                    resolve(nodes);
                }

                projectsMapped = sortProjects(projectsMapped);

                for (let index = 0; index < projectsMapped.length; index++) {
                    const prj: ProjectInQuickPick = projectsMapped[ index ];

                    let iconFavorites = "favorites";
                    if (path.extname(prj.description) === ".code-workspace") {
                        iconFavorites = "favorites-workspace";
                    } else if (isRemotePath(prj.description)) {
                        iconFavorites = "favorites-remote";
                    }
                    nodes.push(new ProjectNode(prj.label, vscode.TreeItemCollapsibleState.None,
                        iconFavorites, {
                            name: prj.label,
                            path: PathUtils.expandHomePath(prj.description)
                        }, {
                            command: "_projectManager.open",
                            title: "",
                            arguments: [ PathUtils.expandHomePath(prj.description), prj.label, prj.profile ],
                        }));
                }

                resolve(nodes);

            } else { // ROOT

                // no project saved yet, returns [] `empty`...
                if (this.projectSource.length() === 0) {
                    return resolve([]);
                }

                // choose the view
                const viewAsList = Container.context.globalState.get<boolean>("viewAsList", true);

                // viewAsTags - must have at least one tag otherwise, use `viewAsList`
                if (!viewAsList) {
                    let nodes: TagNode[] = [];

                    const tagsCollapseBehavior = vscode.workspace.getConfiguration("projectManager").get<string>("tags.collapseItems", "startExpanded");
                    const tags = this.projectSource.getAvailableTags().sort();
                    for (const tag of tags) {
                        nodes.push(new TagNode(tag, StorageProvider.getTagCollapsibleState(tag, tagsCollapseBehavior)));
                    }

                    // has any, then OK
                    if (nodes.length > 0) {
                        if (this.projectSource.getProjectsByTag('').length !== 0) {
                            nodes.push(new NoTagNode(NO_TAGS_DEFINED, StorageProvider.getTagCollapsibleState(NO_TAGS_DEFINED, tagsCollapseBehavior)));
                        }

                        // should filter ?
                        const filterByTags = Container.context.globalState.get<string[]>("filterByTags", []);
                        if (filterByTags.length > 0) {
                            nodes = nodes.filter(node => filterByTags.includes(node.label)
                                || (filterByTags.includes(NO_TAGS_DEFINED) && node.label === ""));
                        }

                        resolve(nodes);
                        return;
                    }
                }

                // viewAsList OR no Tags
                // raw list
                const nodes: ProjectNode[] = [];

                let projectsMapped: ProjectInQuickPickList;

                const filterByTags = Container.context.globalState.get<string[]>("filterByTags", []);
                if (filterByTags.length > 0) {
                    projectsMapped = <ProjectInQuickPickList>this.projectSource.getProjectsByTags(filterByTags);
                } else {
                    projectsMapped = <ProjectInQuickPickList>this.projectSource.map();
                }

                projectsMapped = sortProjects(projectsMapped);

                for (let index = 0; index < projectsMapped.length; index++) {
                    const prj: ProjectInQuickPick = projectsMapped[ index ];

                    let iconFavorites = "favorites";
                    if (path.extname(prj.description) === ".code-workspace") {
                        iconFavorites = "favorites-workspace";
                    } else if (isRemotePath(prj.description)) {
                        iconFavorites = "favorites-remote";
                    }
                    nodes.push(new ProjectNode(prj.label, vscode.TreeItemCollapsibleState.None,
                        iconFavorites, {
                            name: prj.label,
                            path: PathUtils.expandHomePath(prj.description)
                        },
                        {
                            command: "_projectManager.open",
                            title: "",
                            arguments: [ PathUtils.expandHomePath(prj.description), prj.label, prj.profile ],
                        }));
                }

                resolve(nodes);
            }
        });
    }

}
