/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import fs = require("fs");
import * as vscode from "vscode";
import { normalizeGroupPath, Project } from "../core/project";
import { ProjectStorage } from "../storage/storage";

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function exportProjects(projectStorage: ProjectStorage): Promise<void> {
    const projects = projectStorage.getProjects();

    const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file("projects.json"),
        filters: { "JSON": ["json"] }
    });

    if (!uri) {
        return;
    }

    const content = JSON.stringify(projects, null, "\t");
    fs.writeFileSync(uri.fsPath, content);
    vscode.window.showInformationMessage(
        vscode.l10n.t("Projects exported successfully.")
    );
}

export async function importProjects(
    projectStorage: ProjectStorage,
    onUpdate: () => void
): Promise<void> {
    const uris = await vscode.window.showOpenDialog({
        canSelectMany: false,
        filters: { "JSON": ["json"] }
    });

    if (!uris || uris.length === 0) {
        return;
    }

    let items: unknown;
    try {
        const content = fs.readFileSync(uris[0].fsPath).toString();
        items = JSON.parse(content);
    } catch {
        vscode.window.showErrorMessage(
            vscode.l10n.t("Invalid project file format.")
        );
        return;
    }

    if (!Array.isArray(items)) {
        vscode.window.showErrorMessage(
            vscode.l10n.t("Invalid project file format.")
        );
        return;
    }

    const first = items[0];
    const useLegacyShape =
        items.length > 0 &&
        isRecord(first) &&
        typeof first.label === "string" &&
        first.label.length > 0;

    let projects: Project[];
    if (useLegacyShape) {
        projects = items.map((item): Project => {
            const row = isRecord(item) ? item : {};
            const label = typeof row.label === "string" ? row.label : "";
            const description = typeof row.description === "string" ? row.description : "";
            return {
                name: label,
                rootPath: description,
                paths: [],
                tags: [],
                enabled: true,
                profile: "",
                group: ""
            };
        });
    } else {
        projects = items.map((item): Project => {
            const row = isRecord(item) ? item : {};
            const name = typeof row.name === "string" ? row.name : "";
            const rootPath = typeof row.rootPath === "string" ? row.rootPath : "";
            const paths = Array.isArray(row.paths) ? row.paths.filter((p): p is string => typeof p === "string") : [];
            const tags = Array.isArray(row.tags) ? row.tags.filter((t): t is string => typeof t === "string") : [];
            const enabled = typeof row.enabled === "boolean" ? row.enabled : true;
            const profile = typeof row.profile === "string" ? row.profile : "";
            const groupRaw = typeof row.group === "string" ? row.group : "";
            return {
                name,
                rootPath,
                paths,
                tags,
                enabled,
                profile,
                group: normalizeGroupPath(groupRaw)
            };
        });
    }

    const validProjects = projects.filter(p => p.name && p.rootPath);
    if (validProjects.length === 0) {
        vscode.window.showErrorMessage(
            vscode.l10n.t("No valid projects found in file.")
        );
        return;
    }

    const optionReplace = <vscode.MessageItem>{ title: vscode.l10n.t("Replace") };
    const optionMerge = <vscode.MessageItem>{ title: vscode.l10n.t("Merge") };
    const optionCancel = <vscode.MessageItem>{ title: vscode.l10n.t("Cancel") };

    const choice = await vscode.window.showInformationMessage(
        vscode.l10n.t("Found {0} projects. How would you like to import?", validProjects.length),
        optionReplace, optionMerge, optionCancel
    );

    if (!choice || choice === optionCancel) {
        return;
    }

    if (choice === optionReplace) {
        projectStorage.setProjects(validProjects);
    } else {
        const existing = projectStorage.getProjects();
        const merged = [...existing];

        for (const imported of validProjects) {
            const existingIndex = merged.findIndex(
                p => p.name.toLowerCase() === imported.name.toLowerCase()
            );
            if (existingIndex >= 0) {
                merged[existingIndex] = imported;
            } else {
                merged.push(imported);
            }
        }

        projectStorage.setProjects(merged);
    }

    await projectStorage.save();
    onUpdate();

    vscode.window.showInformationMessage(
        vscode.l10n.t("Imported {0} projects.", validProjects.length)
    );
}
