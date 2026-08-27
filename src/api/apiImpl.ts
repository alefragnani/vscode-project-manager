/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ProjectManagerPublicApi, Project as PublicProject } from "../../api/api";
import { CustomProjectLocator } from "../autodetect/abstractLocator";
import { Locators } from "../autodetect/locators";
import { ProjectStorage } from "../storage/storage";

export class ProjectManagerApiImpl implements ProjectManagerPublicApi {

    constructor(private readonly projectStorage: ProjectStorage, private readonly locators: Locators) { }

    public async saveProject(name: string, rootPath: string, tags: string[] = [], profile: string = ""): Promise<void> {
        if (!name.trim() || !rootPath.trim()) {
            throw new Error("Project name and rootPath are required.");
        }
        if (this.projectStorage.exists(name)) {
            throw new Error(`A project named "${name}" already exists.`);
        }

        this.projectStorage.push(name, rootPath, tags, profile);
        this.projectStorage.save();
    }

    public async getFavoriteProjects(): Promise<PublicProject[]> {
        return this.projectStorage.getProjects().map(project => ({
            name: project.name,
            rootPath: project.rootPath,
            tags: [ ...project.tags ],
            profile: project.profile,
            enabled: project.enabled
        }));
    }

    public async getVSCodeProjects(): Promise<PublicProject[]> {
        return this.mapLocatedProjects(this.locators.vscLocator);
    }

    public async getGitProjects(): Promise<PublicProject[]> {
        return this.mapLocatedProjects(this.locators.gitLocator);
    }

    public async getMercurialProjects(): Promise<PublicProject[]> {
        return this.mapLocatedProjects(this.locators.mercurialLocator);
    }

    public async getSVNProjects(): Promise<PublicProject[]> {
        return this.mapLocatedProjects(this.locators.svnLocator);
    }

    public async getAnyProjects(): Promise<PublicProject[]> {
        return this.mapLocatedProjects(this.locators.anyLocator);
    }

    public async getAllProjects(): Promise<PublicProject[]> {
        return [
            ...await this.getFavoriteProjects(),
            ...await this.getVSCodeProjects(),
            ...await this.getGitProjects(),
            ...await this.getMercurialProjects(),
            ...await this.getSVNProjects(),
            ...await this.getAnyProjects()
        ];
    }

    private mapLocatedProjects(locator: CustomProjectLocator): PublicProject[] {
        return locator.getProjectList().map(project => ({
            name: project.name,
            rootPath: project.fullPath,
            tags: [],
            profile: "",
            enabled: true
        }));
    }
}
