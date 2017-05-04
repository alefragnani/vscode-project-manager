"use strict";

import os = require("os");
// import path = require("path");
// import fs = require("fs");

export const homeDir = os.homedir();
export const homePathVariable = "$home";

export class PathUtils {

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
     */
    public static expandHomePath(path: string) {
        if (path.indexOf(homePathVariable) === 0) {
            return path.replace(homePathVariable, homeDir);
        }

        return path;
    }

    public static expandHomePaths(items: any[]) {
        return items.map(item => {
            item.description = this.expandHomePath(item.description);
            return item;
        });
    }

}