/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { commands } from "vscode";
import { Container } from "../../vscode-project-manager-core/src/container";
import { WhatsNewManager } from "../../vscode-whats-new/src/Manager";
import { ProjectManagerContentProvider, ProjectManagerSocialMediaProvider, ProjectManagerSponsorProvider } from "./contentProvider";

export function registerWhatsNew() {
    const provider = new ProjectManagerContentProvider();
    const viewer = new WhatsNewManager(Container.context)
        .registerContentProvider("alefragnani", "project-manager", provider)
        .registerSocialMediaProvider(new ProjectManagerSocialMediaProvider())
        .registerSponsorProvider(new ProjectManagerSponsorProvider());
    viewer.showPageInActivation();
    Container.context.subscriptions.push(commands.registerCommand("projectManager.whatsNew", () => viewer.showPage()));
    Container.context.subscriptions.push(commands.registerCommand("_projectManager.whatsNewContextMenu", () => viewer.showPage()));
}
