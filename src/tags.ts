import { workspace } from "vscode";

let tagList: string[] = [];

export function availableTags(): string[] {
    tagList = workspace.getConfiguration("projectManager").get<string[]>("tags");
    
    return tagList;
}

export function tagExists(tag: string): boolean {
    return tagList.map(t => t.toLocaleLowerCase()).includes(tag.toLocaleLowerCase());
}

export function addTags(...tags: string[]): void {
    tags.forEach(tag => {
        if (!tagExists(tag)) {
            tagList.push(tag);
        }});
}