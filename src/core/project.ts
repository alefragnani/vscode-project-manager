/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

export interface Project {
    name: string;     // the name that the user defines for the project
    rootPath: string; // the root path of this project
    paths: string[];  // the 'other paths' when you have multifolder project
    tags: string[];   // the tags associated to the project
    enabled: boolean; // the project should be displayed in the project list
    profile: string;  // the profile to assign to the project
}

export function createProject(name: string, rootPath: string): Project {

    const newProject: Project = {
        name,
        rootPath,
        paths: [],
        tags: [],
        enabled: true,
        profile: ""
    };
    return newProject;
}
