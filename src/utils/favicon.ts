/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { readFile, stat } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";

const FAVICON_CANDIDATES = [
    "favicon.svg",
    "favicon.ico",
    "favicon.png",
    "public/favicon.svg",
    "public/favicon.ico",
    "public/favicon.png",
    "app/favicon.ico",
    "app/favicon.png",
    "app/icon.svg",
    "app/icon.png",
    "app/icon.ico",
    "src/favicon.ico",
    "src/favicon.svg",
    "src/app/favicon.ico",
    "src/app/icon.svg",
    "src/app/icon.png",
    "assets/icon.svg",
    "assets/icon.png",
    "assets/logo.svg",
    "assets/logo.png",
    ".idea/icon.svg",
] as const;

const ICON_SOURCE_FILES = [
    "index.html",
    "public/index.html",
    "app/routes/__root.tsx",
    "src/routes/__root.tsx",
    "app/root.tsx",
    "src/root.tsx",
    "src/index.html",
] as const;

const HTML_ICON_RE =
    /<link\b(?=[^>]*\brel=["'](?:icon|shortcut icon)["'])(?=[^>]*\bhref=["']([^"'?]+))[^>]*>/i;

const OBJECT_ICON_RE =
    /(?=[^}]*\brel\s*:\s*["'](?:icon|shortcut icon)["'])(?=[^}]*\bhref\s*:\s*["']([^"'?]+))[^}]*/i;

function extractIconHref(source: string): string | null {
    return source.match(HTML_ICON_RE)?.[ 1 ]
        ?? source.match(OBJECT_ICON_RE)?.[ 1 ]
        ?? null;
}

function resolveWithinRoot(workspaceRoot: string, candidate: string): string | null {
    const input = candidate.trim();

    if (!input || isAbsolute(input)) {
        return null;
    }

    const absolutePath = resolve(workspaceRoot, input);
    const relativePath = relative(workspaceRoot, absolutePath).replace(/\\/g, "/");

    if (
        !relativePath ||
        relativePath === "." ||
        relativePath === ".." ||
        relativePath.startsWith("../") ||
        isAbsolute(relativePath)
    ) {
        return null;
    }

    return absolutePath;
}

async function findFile(workspaceRoot: string, candidates: readonly string[]): Promise<string | null> {
    for (const candidate of candidates) {
        const absolutePath = resolveWithinRoot(workspaceRoot, candidate);
        if (!absolutePath) {
            continue;
        }

        try {
            if ((await stat(absolutePath)).isFile()) {
                return absolutePath;
            }
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
                throw error;
            }
        }
    }

    return null;
}

export async function resolveProjectFavicon(cwd: string): Promise<string | null> {
    const workspaceRoot = resolve(cwd.trim());
    const directMatch = await findFile(workspaceRoot, FAVICON_CANDIDATES);

    if (directMatch) {
        return directMatch;
    }

    for (const sourceFile of ICON_SOURCE_FILES) {
        const sourcePath = resolveWithinRoot(workspaceRoot, sourceFile);
        if (!sourcePath) {
            continue;
        }

        let source: string;

        try {
            source = await readFile(sourcePath, "utf8");
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                continue;
            }
            throw error;
        }

        const href = extractIconHref(source);
        if (!href) {
            continue;
        }

        const cleanHref = href.replace(/^\//, "");
        const referencedMatch = await findFile(workspaceRoot, [
            join("public", cleanHref),
            cleanHref,
        ]);

        if (referencedMatch) {
            return referencedMatch;
        }
    }

    return null;
}
