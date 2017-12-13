"use strict";

import os = require("os");
import path = require("path");
// import fs = require("fs");

export const homeDir = os.homedir();
export const homePathVariable = "$home";

export class PathUtils {

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

}