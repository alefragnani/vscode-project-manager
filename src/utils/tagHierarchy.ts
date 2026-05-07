/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

export const TAG_SEPARATOR = "::";

export interface TagHierarchyNode {
    name: string;
    fullPath: string;
    children: Map<string, TagHierarchyNode>;
}

export function parseTagHierarchy(tags: string[]): Map<string, TagHierarchyNode> {
    const root = new Map<string, TagHierarchyNode>();

    for (const tag of tags) {
        const parts = tag.split(TAG_SEPARATOR);
        let currentLevel = root;
        let currentPath = "";

        for (const part of parts) {
            currentPath = currentPath ? `${currentPath}${TAG_SEPARATOR}${part}` : part;

            if (!currentLevel.has(part)) {
                currentLevel.set(part, {
                    name: part,
                    fullPath: currentPath,
                    children: new Map()
                });
            }

            currentLevel = currentLevel.get(part)!.children;
        }
    }

    return root;
}

export function getParentTag(tag: string): string | undefined {
    const lastSeparatorIndex = tag.lastIndexOf(TAG_SEPARATOR);
    if (lastSeparatorIndex === -1) {
        return undefined;
    }
    return tag.substring(0, lastSeparatorIndex);
}

export function getTagParts(tag: string): string[] {
    return tag.split(TAG_SEPARATOR);
}

export function getLeafTagName(tag: string): string {
    const parts = tag.split(TAG_SEPARATOR);
    return parts[parts.length - 1];
}

export function isChildTag(parentTag: string, childTag: string): boolean {
    if (parentTag === childTag) {
        return false;
    }
    return childTag.startsWith(parentTag + TAG_SEPARATOR);
}

export function tagMatchesFilter(tag: string, filterTag: string): boolean {
    return tag === filterTag || isChildTag(filterTag, tag);
}


