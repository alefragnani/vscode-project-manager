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
import { GroupNode, NoTagNode, ProjectNode, TagNode } from "./nodes";

interface ProjectInQuickPick {
    label: string;
    description: string;
    profile: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ProjectInQuickPickList extends Array<ProjectInQuickPick> { }

export class StorageProvider implements vscode.TreeDataProvider<ProjectNode | TagNode | GroupNode> {

    public readonly onDidChangeTreeData: vscode.Event<ProjectNode | TagNode | GroupNode | void>;

    private projectSource: ProjectStorage;
    private internalOnDidChangeTreeData: vscode.EventEmitter<ProjectNode | TagNode | GroupNode | void> = new vscode.EventEmitter<ProjectNode | GroupNode | void>();
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

    public getTreeItem(element: ProjectNode | TagNode | GroupNode): vscode.TreeItem {
        return element;
    }

    public getChildren(element?: ProjectNode | TagNode | GroupNode): Thenable<(ProjectNode | TagNode | GroupNode)[]> {

        return new Promise(resolve => {

            if (element) {

                if (element instanceof GroupNode) {
                    resolve(this.getGroupChildren(element));
                    return;
                }

                if (element instanceof ProjectNode) {
                    resolve([]);
                    return;
                }

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

                if (this.projectSource.length() === 0) {
                    return resolve([]);
                }

                const viewMode = Container.context.globalState.get<string>("favoritesViewMode",
                    Container.context.globalState.get<boolean>("viewAsList", true) ? "list" : "tags");

                // viewAsGroups
                if (viewMode === "groups") {
                    resolve(this.getGroupRootChildren());
                    return;
                }

                // viewAsTags
                if (viewMode === "tags") {
                    let nodes: TagNode[] = [];

                    const tagsCollapseBehavior = vscode.workspace.getConfiguration("projectManager").get<string>("tags.collapseItems", "startExpanded");
                    const tags = this.projectSource.getAvailableTags().sort();
                    for (const tag of tags) {
                        nodes.push(new TagNode(tag, StorageProvider.getTagCollapsibleState(tag, tagsCollapseBehavior)));
                    }

                    if (nodes.length > 0) {
                        if (this.projectSource.getProjectsByTag('').length !== 0) {
                            nodes.push(new NoTagNode(NO_TAGS_DEFINED, StorageProvider.getTagCollapsibleState(NO_TAGS_DEFINED, tagsCollapseBehavior)));
                        }

                        const filterByTags = Container.context.globalState.get<string[]>("filterByTags", []);
                        if (filterByTags.length > 0) {
                            nodes = nodes.filter(node => filterByTags.includes(node.label)
                                || (filterByTags.includes(NO_TAGS_DEFINED) && node.label === ""));
                        }

                        resolve(nodes);
                        return;
                    }
                }

                // viewAsList OR no Tags (fallback)
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

    private getGroupRootChildren(): (ProjectNode | GroupNode)[] {
        const projects = this.getFilteredEnabledProjects();
        return this.buildGroupLevel(projects, "");
    }

    private getGroupChildren(groupNode: GroupNode): (ProjectNode | GroupNode)[] {
        const projects = this.getFilteredEnabledProjects();
        return this.buildGroupLevel(projects, groupNode.groupPath);
    }

    private getFilteredEnabledProjects(): Array<{ name: string; rootPath: string; profile: string; group: string; tags: string[] }> {
        const allProjects = this.projectSource.getProjects().filter(p => p.enabled);
        const filterByTags = Container.context.globalState.get<string[]>("filterByTags", []);
        if (filterByTags.length === 0) {
            return allProjects;
        }
        return allProjects.filter(p =>
            p.tags.some(t => filterByTags.includes(t)) ||
            (filterByTags.includes(NO_TAGS_DEFINED) && p.tags.length === 0)
        );
    }

    private buildGroupLevel(
        projects: Array<{ name: string; rootPath: string; profile: string; group: string; tags: string[] }>,
        parentPath: string
    ): (ProjectNode | GroupNode)[] {
        const projectNodes: ProjectNode[] = [];
        const childGroupNames = new Set<string>();

        for (const project of projects) {
            const group: string = project.group || "";
            const isChild = parentPath === ""
                ? group === ""
                : group === parentPath;
            const isDescendant = parentPath === ""
                ? group !== ""
                : group.startsWith(parentPath + "/");

            if (isChild) {
                projectNodes.push(this.createProjectNode(project));
            } else if (isDescendant) {
                const remainder = parentPath === ""
                    ? group
                    : group.substring(parentPath.length + 1);
                childGroupNames.add(remainder.split("/")[0]);
            }
        }

        const groupNodes: GroupNode[] = [...childGroupNames].sort().map(name => {
            const fullPath = parentPath === "" ? name : `${parentPath}/${name}`;
            return new GroupNode(name, fullPath, vscode.TreeItemCollapsibleState.Expanded);
        });

        return [...groupNodes, ...projectNodes];
    }

    private createProjectNode(project: { name: string; rootPath: string; profile: string }): ProjectNode {
        const prjPath = PathUtils.expandHomePath(project.rootPath);
        let iconFavorites = "favorites";
        if (path.extname(prjPath) === ".code-workspace") {
            iconFavorites = "favorites-workspace";
        } else if (isRemotePath(prjPath)) {
            iconFavorites = "favorites-remote";
        }
        return new ProjectNode(project.name, vscode.TreeItemCollapsibleState.None,
            iconFavorites, {
                name: project.name,
                path: prjPath
            }, {
                command: "_projectManager.open",
                title: "",
                arguments: [ prjPath, project.name, project.profile ],
            });
    }

}
