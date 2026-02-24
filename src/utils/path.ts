/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

"use strict";

import fs = require("fs");
import os = require("os");
import path = require("path");
import { env, ExtensionContext, workspace } from "vscode";
import { codicons } from "vscode-ext-codicons";
import { AutodetectedProjectList } from "../autodetect/abstractLocator";
import { isRemotePath } from "./remote";
import { glob } from "glob";

export const homeDir = os.homedir();
export const HOME_PATH_VARIABLE = "$home";
export const HOME_PATH_TILDE = "~";

// Contains recommended global storage path if provided by current version of VS Code. 
let extensionStoragePath = "";

export class PathUtils {
    /** 
     * Sets storage path if recommended path provided by current version of VS Code.  
     */
    public static setExtensionContext(context: ExtensionContext) {
        // Detect if globalStoragePath is available in ExtensionContext
        // for this version of VS Code.
        if ((<any>context)[ "globalStoragePath" ]) {
            // If so, remember the path for future use  
            extensionStoragePath = (<any>context)[ "globalStoragePath" ];
            // Validate the path exists and create it if not
            const globalRoot = path.resolve(extensionStoragePath, "..");
            if (!fs.existsSync(globalRoot)) {
                fs.mkdirSync(globalRoot);
            }
            if (!fs.existsSync(extensionStoragePath)) {
                fs.mkdirSync(extensionStoragePath);
            }
        }
    }

    /**
     * Indicates if a path is a UNC path
     * 
     * @param path The path to check
     */
    public static pathIsUNC(path: string) {
        return path.indexOf("\\\\") === 0;
    }

    /**
     * If the project path is in the user's home directory then store the home directory as a
     * parameter. This will help in situations when the user works with the same projects on
     * different machines, under different user names.
     */
    public static compactHomePath(path: string) {
        if (path.startsWith(homeDir)) {
            return path.replace(homeDir, HOME_PATH_VARIABLE);
        }

        return path;
    }

    /**
     * Expand $home parameter from path to real os home path
     * 
     * @param path The path to expand
     */
    public static expandHomePath(inputPath: string) {
        if (inputPath.startsWith(HOME_PATH_VARIABLE)) {
            const relativePath = inputPath.substring(HOME_PATH_VARIABLE.length);
            return path.normalize(path.join(homeDir, relativePath));
        }

        if (inputPath.startsWith(HOME_PATH_TILDE)) {
            const relativePath = inputPath.substring(HOME_PATH_TILDE.length);
            return path.normalize(path.join(homeDir, relativePath));
        }

        return inputPath;
    }

    /**
     * Expand $home parameter from path to real os home path
     * 
     * @param items The array of items <QuickPickItem> to expand
     */
    public static expandHomePaths(items: any[]) {
        return items.map(item => {
            item.description = this.expandHomePath(item.description);
            return item;
        });
    }

    /**
     * Update paths to use the proper path separator, based on the Host OS
     * 
     * @param items The array of items <string> to update
     */
    public static updateWithPathSeparator(items: string[]): string[] {
        const newItems: string[] = [];
        for (const apath of items) {
            newItems.push(this.updateWithPathSeparatorStr(apath));
        }
        return newItems;
    }

    /**
     * Update a path to use the proper path separator, based on the Host OS
     * 
     * @param item The path <string> to update
     */
    public static updateWithPathSeparatorStr(item: string): string {
        if (path.sep === "\\") {
            return item.replace(/\//g, "\\");
        } else {
            return item.replace(/\\/g, "/");
        }
    }

    /**
     * Normalizes a path (fix \ -> \\\\)
     * 
     * @param path The path <string> to be normalized
     */
    public static normalizePath(path: string): string {
        let normalizedPath: string = path;

        if (!PathUtils.pathIsUNC(normalizedPath)) {
            const replaceable = normalizedPath.split("\\");
            normalizedPath = replaceable.join("\\\\");
        }

        return normalizedPath;
    }

    /**
     * Indicates if a path is invalid, which means "does not exists"
     * "
     * @param items The items <QuickPickItems> to check for invalid paths
     */
    public static indicateInvalidPaths(items: any[]): any[] {
        for (const element of items) {
            if (!element.detail && (!isRemotePath(element.description)) && (!fs.existsSync(element.description.toString()))) {
                element.detail = codicons.circle_slash + " Path does not exist";
            }
        }

        return items;
    }

    public static getChannelPath(): string {
        return process.env.VSCODE_PORTABLE ? "user-data" : env.appName.replace("Visual Studio ", "");
    }

    public static getFilePathFromAppData(file: string): string {
        let appdata: string;
        const channelPath: string = this.getChannelPath();
        let newFile: string;
        // Original logic to find path. We will only use this path
        // if a file already exists in this location or we are on
        // an old version of VS Code.
        if (process.env.VSCODE_PORTABLE) {
            appdata = process.env.VSCODE_PORTABLE;
            newFile = path.join(appdata, channelPath, "User", file);
        } else {
            appdata = process.env.APPDATA || (process.platform === "darwin" ? process.env.HOME + "/Library/Application Support" : "/var/local");
            newFile = path.join(appdata, channelPath, "User", file);
            // in linux, it may not work with /var/local, then try to use /home/myuser/.config
            if ((process.platform === "linux") && (!fs.existsSync(newFile))) {
                newFile = path.join(homeDir, ".config/", channelPath, "User", file);
            }
        }
        // If we are on a new version of VS Code, use the specified
        // global extension storage path unless a file exists in 
        // the old location.
        if (extensionStoragePath !== "") {
            if (!fs.existsSync(newFile)) {
                newFile = path.join(extensionStoragePath, file);
            }
        }
        return newFile;
    }

    public static handleSymlinks(items: string[]): string[] {
        if (!workspace.getConfiguration("projectManager").get<boolean>("supportSymlinksOnBaseFolders", false)) {
            return items;
        }

        const newItems: string[] = [];
        for (const item of items) {
            if (!fs.existsSync(item)) {
                continue;
            }

            if (fs.lstatSync(item).isSymbolicLink()) {
                newItems.push(fs.realpathSync(item));
            } else {
                newItems.push(item);
            }
        }
        return newItems;
    }

    public static hasGlobPattern(value: string): boolean {
        return /[*?[\]{}()!]/.test(value);
    }

    public static async expandWithGlobPatterns(projectsDirList: string[]): Promise<string[]> {
        const resolved: string[] = [];

        for (const pattern of projectsDirList || []) {
            const expanded = PathUtils.expandHomePath(pattern);

            if (PathUtils.hasGlobPattern(expanded)) {
                try {
                    const matches = await glob(expanded, { nodir: false, dot: false });
                    for (const match of matches) {
                        try {
                            const stat = fs.statSync(match);
                            if (stat.isDirectory()) {
                                resolved.push(match);
                            }
                        } catch {
                            // ignore invalid entries
                        }
                    }
                } catch {
                    // ignore glob errors for this pattern
                }
            } else if (fs.existsSync(expanded)) {
                resolved.push(expanded);
            }
        }
        return resolved;
    }
}

interface ProjectDetail {
    name: string,
    parent?: string,
    path: string,
    icon: string;
}

export function addParentFolderToDuplicates(projects: AutodetectedProjectList): ProjectDetail[] {

    if (!workspace.getConfiguration("projectManager").get<boolean>("showParentFolderInfoOnDuplicates", false)) {
        return projects.map(project => <ProjectDetail>{
            name: project.name,
            path: project.fullPath,
            icon: project.icon
        });
    }

    const names = projects.map(project => project.name);
    const set = new Set(names);
    const hasDuplicates = set.size !== projects.length;

    if (!hasDuplicates) {
        return projects.map(project => <ProjectDetail>{
            name: project.name,
            path: project.fullPath,
            icon: project.icon
        });
    }

    // 
    const projectsWithParentInfo = projects.map(project => <ProjectDetail>{
        name: project.name,
        path: project.fullPath,
        icon: project.icon
    });

    // duplicates
    const findDuplicates = arr => arr.filter((item, index) => arr.indexOf(item) !== index);
    const dups = new Set(findDuplicates(names));

    for (const dup of dups) {
        const dupsToUpdate = projects.filter((item, index) => projects[ index ].name === dup);
        const dupsUpdated = getDiffParentFolder(dupsToUpdate.map(item => item.fullPath));

        // update
        for (const iterator of dupsUpdated) {
            for (let index = 0; index < projectsWithParentInfo.length; index++) {
                const aProject = projectsWithParentInfo[ index ];
                if (aProject.path === iterator.ref) {
                    projectsWithParentInfo[ index ].parent = iterator.parentFolder !== "" ? iterator.parentFolder : iterator.path;
                    break; // exit projects loop
                }
            }
        }
    }

    return projectsWithParentInfo;
}

interface ParentFolderInfo {
    ref: string,
    path: string,
    parentFolder: string;
}

function getDiffParentFolder(paths: string[]): ParentFolderInfo[] {

    const basename = path.basename(paths[ 0 ]);
    paths = paths.map(p => path.dirname(p));
    const returns = paths.map(p => <ParentFolderInfo>{
        ref: p,
        path: p,
        parentFolder: ""
    });
    const splitLength = returns[ 0 ].ref.split(path.sep).length;

    for (let indexSplitPathSep = 0; indexSplitPathSep < splitLength - 1; indexSplitPathSep++) {

        const pathRef = returns[ 0 ].path;

        const currentPiece = pathRef.substr(0, pathRef.indexOf(path.sep));
        returns[ 0 ].path = pathRef.substr(pathRef.indexOf(path.sep) + 1);

        for (let index = 1; index < returns.length; index++) {
            const element = returns[ index ].path;

            const currentPieceFromCurrentElement = element.substr(0, element.indexOf(path.sep));
            if (currentPieceFromCurrentElement === currentPiece) {
                returns[ index ].path = element.substr(element.indexOf(path.sep) + 1);
            } else {
                returns[ index ].parentFolder = element.substr(element.indexOf(path.sep) + 1);
            }
        }
    }

    returns.forEach(element => {
        element.ref = path.join(element.ref, basename);
    });
    return returns;
}
