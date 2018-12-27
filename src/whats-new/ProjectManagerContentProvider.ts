/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

// tslint:disable-next-line:max-line-length
import { ChangeLogItem, ChangeLogKind, ContentProvider, Header, Image, Sponsor } from "../../vscode-whats-new/src/ContentProvider";

export class WhatsNewProjectManagerContentProvider implements ContentProvider {

    public provideHeader(logoUrl: string): Header {
        return <Header> {logo: <Image> {src: logoUrl, height: 50, width: 50}, 
            message: `<b>Project Manager</b> helps you to easily access your <b>projects</b>,
            no matter where they are located. <i>Don't miss that important projects anymore</i>.
            You can define your own <b>Favorite</b> projects, or choose for auto-detect <b>VSCode</b>
            projects, <b>Git</b>, <b>Mercurial</b> and <b>SVN</b> repositories or <b>any</b> folder.`};
    }

    public provideChangeLog(): ChangeLogItem[] {
        const changeLog: ChangeLogItem[] = [];
        changeLog.push({kind: ChangeLogKind.NEW, message: "Adds an all-new Project Manager <b>Side Bar</b>"});
        changeLog.push({kind: ChangeLogKind.NEW, message: "Adds <b>Portable Mode/b> support"});
        changeLog.push({kind: ChangeLogKind.NEW, message: "Adds <b>Add to Workspace</b> command to add any project to current workspace"});
        changeLog.push({kind: ChangeLogKind.NEW, message: "Adds <b>Add to Favorites</b> command to add any auto-detected project as Favorite"});
        changeLog.push({kind: ChangeLogKind.NEW, message: "Adds <b>Refresh Project</b> commands for every kind of auto-detected project"});
        changeLog.push({kind: ChangeLogKind.NEW, message: "Use new <b>Notification UI</b> while refreshing projects"});
        changeLog.push({kind: ChangeLogKind.FIXED, message: `Avoid installation in unsupported VSCode version (<a title=\"Open Issue #198\" 
            href=\"https://github.com/alefragnani/vscode-project-manager/issues/198\">
            Issue #198</a>)</b>`});
        return changeLog;
    }

    public provideSponsors(): Sponsor[] {
        const sponsors: Sponsor[] = [];
        const sponsorCodeStream: Sponsor = <Sponsor> {
            title: "Try Codestream",
            link: "https://codestream.com/?utm_source=vscmarket&utm_medium=banner&utm_campaign=projectmanager",
            image: "https://raw.githubusercontent.com/alefragnani/oss-resources/master/images/sponsors/codestream-hi-res.png",
            width: 35,
            message: "<p>Use Slack inside VS Code and save your technical discussions where they belong - with your codebase.</p>",
            extra: 
                `<a title="Try CodeStream" href="https://codestream.com/?utm_source=vscmarket&utm_medium=banner&utm_campaign=projectmanager">
                 Try CodeStream</a>` 
        };
        sponsors.push(sponsorCodeStream);
        return sponsors
    }
   
}