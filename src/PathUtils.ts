/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

"use strict";

import fs = require("fs");
import os = require("os");
import path = require("path");
import { env, ExtensionContext } from "vscode";

export const homeDir = os.homedir();
export const homePathVariable = "$home";

// Contains recommended global storage path if provided by current version of VS Code. 
let extensionStoragePath: string = ""

export class PathUtils {

    /** 
     * Sets storage path if recommended path provided by current version of VS Code.  
    */
    public static setExtensionContext(context: ExtensionContext) {
        // Detect if globalStoragePath is available in ExtensionContext
        // for this version of VS Code.
        if ((<any>context)["globalStoragePath"]) {
            // If so, remember the path for future use  
            extensionStoragePath = (<any>context)["globalStoragePath"];
            // Validate the path exists and create it if not
            const globalRoot = path.resolve(extensionStoragePath, '..');
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
        if (path.indexOf(homeDir) === 0) {
            return path.replace(homeDir, homePathVariable);
        }

        return path;
    }

    /**
     * Expand $home parameter from path to real os home path
     * 
     * @param path The path to expand
     */
    public static expandHomePath(path: string) {
        if (path.indexOf(homePathVariable) === 0) {
            return path.replace(homePathVariable, homeDir);
        }

        return path;
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
     * Normalizes a path (fix \ -> \\)
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
            if (!element.detail && (!fs.existsSync(element.description.toString()))) {
                element.detail = "$(circle-slash) Path does not exist";
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
        if (extensionStoragePath !== "") {
            newFile = path.join(extensionStoragePath, file);
        } else if (process.env.VSCODE_PORTABLE) {
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
        return newFile;
    }
}