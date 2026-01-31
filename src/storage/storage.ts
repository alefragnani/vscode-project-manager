/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import fs = require("fs");
import { PathUtils } from "../utils/path";
import { isRemotePath } from "../utils/remote";
import { Uri } from "vscode";
import { createProject, Project } from "../core/project";
import { NO_TAGS_DEFINED } from "../sidebar/constants";

export class ProjectStorage {

    private projects: Project[];
    private filename: string;

    constructor(filename: string) {
        this.filename = filename;
        this.projects = [];
    }

    public push(name: string, rootPath: string): void {
        this.projects.push(createProject(name, rootPath));
        return;
    }

    public pop(name: string): Project {
        for (let index = 0; index < this.projects.length; index++) {
            const element: Project = this.projects[ index ];
            if (element.name.toLowerCase() === name.toLowerCase()) {
                return this.projects.splice(index, 1)[ 0 ];
            }
        }
    }

    public rename(oldName: string, newName: string): void {
        for (const element of this.projects) {
            if (element.name.toLowerCase() === oldName.toLowerCase()) {
                element.name = newName;
                return;
            }
        }
    }

    public editTags(name: string, tags: string[]): void {
        for (const element of this.projects) {
            if (element.name.toLowerCase() === name.toLowerCase()) {
                element.tags = tags;
                return;
            }
        }
    }

    public toggleEnabled(name: string): boolean | undefined {
        for (const element of this.projects) {
            if (element.name.toLowerCase() === name.toLowerCase()) {
                element.enabled = !element.enabled;
                return element.enabled;
            }
        }
    }

    public disabled(): Array<Project> | undefined {
        return this.projects.filter(project => !project.enabled);
    }

    public updateRootPath(name: string, path: string): void {
        for (const element of this.projects) {
            if (element.name.toLowerCase() === name.toLowerCase()) {
                element.rootPath = path;
            }
        }
    }

    public exists(name: string): boolean {
        let found = false;

        for (const element of this.projects) {
            if (element.name.toLocaleLowerCase() === name.toLocaleLowerCase()) {
                found = true;
            }
        }
        return found;
    }

    public existsWithRootPath(rootPath: string, returnExpandedHomePath: boolean = false): Project {
        for (const element of this.projects) {
            const elementPath = PathUtils.expandHomePath(element.rootPath);
            if ((elementPath.toLocaleLowerCase() === rootPath.toLocaleLowerCase()) || (elementPath === rootPath)) {
                if (returnExpandedHomePath) {
                    return {
                        ...element,
                        rootPath: elementPath
                    };
                }
                return element;
            }
        }
    }

    public existsRemoteWithRootPath(uri: Uri): Project {
        for (const element of this.projects) {
            if (!isRemotePath(element.rootPath)) { continue; }

            const uriElement = Uri.parse(element.rootPath);
            if (uriElement.path === uri.path) {
                return element;
            }
        }
    }

    public length(): number {
        return this.projects.length;
    }

    public load(): string {
        let items: Array<any> = [];

        // missing file (new install)
        if (!fs.existsSync(this.filename)) {
            return "";
        }

        try {
            items = JSON.parse(fs.readFileSync(this.filename).toString());
            // OLD v1 format
            if ((items.length > 0) && (items[ 0 ].label)) {
                for (const element of items) {
                    this.projects.push(createProject(element.label, element.description));
                }
                // save updated
                this.save();
            } else { // NEW v2 format
                this.projects = (items as Array<Partial<Project>>).map(item => ({
                    name: "",
                    rootPath: "",
                    paths: [],
                    tags: [],
                    enabled: true,
                    profile: "",
                    ...item
                }));

                this.projects = this.projects.map(project => ({
                    name: project.name,
                    rootPath: project.rootPath,
                    paths: project.paths,
                    tags: project.tags,
                    enabled: project.enabled,
                    profile: project.profile
                }));
            }

            this.updatePaths();
            return "";
        } catch (error) {
            console.log(error);
            return error.toString();
        }
    }

    public save() {
        fs.writeFileSync(this.filename, JSON.stringify(this.projects, null, "\t"));
    }

    public map(): any {
        const newItems = this.projects.filter(item => item.enabled).map(item => {
            return {
                label: item.name,
                description: item.rootPath,
                profile: item.profile
            };
        });
        return newItems;
    }

    private updatePaths(): void {
        for (const project of this.projects) {
            if (!isRemotePath(project.rootPath)) {
                project.rootPath = PathUtils.updateWithPathSeparatorStr(project.rootPath);
            }
        }
    }

    public getAvailableTags(): string[] {
        const tags: string[] = [];
        for (const project of this.projects) {
            tags.push(...project.tags);
        }
        const tagsSet = new Set(tags);
        return [ ...tagsSet ];
    }

    public getProjectsByTag(tag: string): any {
        const newItems = this.projects.filter(item => item.enabled && (item.tags.includes(tag) || (tag === '' && item.tags.length === 0))).map(item => {
            return {
                label: item.name,
                description: item.rootPath
            };
        });
        return newItems;
    }

    public getProjectsByTags(tags: string[]): any {
        const newItems = this.projects.filter(
            item => item.enabled
                && (item.tags.some(t => tags.includes(t))
                    || ((tags.length === 0 || tags.includes(NO_TAGS_DEFINED) && item.tags.length === 0)
                    ))
        ).map(item => {
            return {
                label: item.name,
                description: item.rootPath,
                profile: item.profile
            };
        });
        return newItems;
    }

}
