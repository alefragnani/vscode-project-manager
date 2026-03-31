/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import fs = require("fs");
import path = require("path");
import * as vscode from "vscode";
import { Project } from "../core/project";
import { PathUtils } from "../utils/path";
import { PROJECTS_FILE } from "../core/constants";

const MIGRATION_COMPLETED_KEY = "projectManager.migrationCompleted";
const STORAGE_KEY = "projectManager.projects";

export function needsMigration(globalState: vscode.Memento): boolean {
    return !globalState.get<boolean>(MIGRATION_COMPLETED_KEY, false);
}

export async function migrateFromFile(
    globalState: vscode.Memento,
    projectsLocation: string
): Promise<{ migrated: boolean; count: number }> {
    const filePath = getProjectFilePath(projectsLocation);

    if (!fs.existsSync(filePath)) {
        await globalState.update(MIGRATION_COMPLETED_KEY, true);
        return { migrated: false, count: 0 };
    }

    try {
        const content = fs.readFileSync(filePath).toString();
        const items: Array<any> = JSON.parse(content);

        let projects: Project[];

        if (items.length > 0 && items[0].label) {
            projects = items.map(item => ({
                name: item.label || "",
                rootPath: item.description || "",
                paths: [],
                tags: [],
                enabled: true,
                profile: "",
                group: ""
            }));
        } else {
            projects = items.map(item => ({
                name: item.name || "",
                rootPath: item.rootPath || "",
                paths: item.paths || [],
                tags: item.tags || [],
                enabled: item.enabled !== undefined ? item.enabled : true,
                profile: item.profile || "",
                group: item.group || ""
            }));
        }

        await globalState.update(STORAGE_KEY, projects);
        await globalState.update(MIGRATION_COMPLETED_KEY, true);

        return { migrated: true, count: projects.length };
    } catch (error) {
        console.error("Migration failed:", error);
        throw error;
    }
}

function getProjectFilePath(projectsLocation: string): string {
    if (projectsLocation !== "") {
        return path.join(PathUtils.expandHomePath(projectsLocation), PROJECTS_FILE);
    }
    return PathUtils.getFilePathFromAppData(PROJECTS_FILE);
}
