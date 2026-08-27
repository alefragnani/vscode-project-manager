/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

export interface Project {
    name: string;
    rootPath: string;
    tags: string[];
    profile: string;
    enabled: boolean;
}

export interface ProjectManagerPublicApi {
    /**
     * Saves a favorite project.
     * @throws Error when name or rootPath is empty, or when a favorite with the name already exists.
     */
    saveProject(name: string, rootPath: string, tags?: string[], profile?: string): Promise<void>;

    /** Returns a read-only snapshot of favorite projects. */
    getFavoriteProjects(): Promise<Project[]>;

    /** Returns a read-only snapshot of cached VS Code projects. No scan is started. */
    getVSCodeProjects(): Promise<Project[]>;

    /** Returns a read-only snapshot of cached Git projects. No scan is started. */
    getGitProjects(): Promise<Project[]>;

    /** Returns a read-only snapshot of cached Mercurial projects. No scan is started. */
    getMercurialProjects(): Promise<Project[]>;

    /** Returns a read-only snapshot of cached SVN projects. No scan is started. */
    getSVNProjects(): Promise<Project[]>;

    /** Returns a read-only snapshot of cached projects found by the Any locator. No scan is started. */
    getAnyProjects(): Promise<Project[]>;

    /** Returns a read-only snapshot of favorites followed by all cached auto-detected projects. */
    getAllProjects(): Promise<Project[]>;
}
