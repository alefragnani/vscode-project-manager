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
        changeLog.push({kind: ChangeLogKind.NEW, message: "Adds <b>Portable Mode</b> support"});
        changeLog.push({kind: ChangeLogKind.NEW, message: "Adds <b>Disable Project</b> command to disable/hide Favorite projects"});
        changeLog.push({kind: ChangeLogKind.NEW, message: "Adds <b>Add to Workspace</b> command to add any project to current workspace"});
        changeLog.push({kind: ChangeLogKind.NEW, message: "Adds <b>Add to Favorites</b> command to add any auto-detected project as Favorite"});
        changeLog.push({kind: ChangeLogKind.NEW, message: "Adds <b>Refresh Project</b> commands for every kind of auto-detected project"});
        changeLog.push({kind: ChangeLogKind.NEW, message: "Use new <b>Notification UI</b> while refreshing projects"});
        changeLog.push({kind: ChangeLogKind.FIXED, message: `The projects in the <b>Side Bar</b> should not be sorted case-sensitive (<a title=\"Open Issue #243\" 
            href=\"https://github.com/alefragnani/vscode-project-manager/issues/243\">
            Issue #243</a>)`});
        return changeLog;
    }

    public provideSponsors(): Sponsor[] {
        const sponsors: Sponsor[] = [];
        const sponsorCodeStream: Sponsor = <Sponsor> {
            title: "Try Codestream",
            link: "https://codestream.com/?utm_source=vscmarket&utm_medium=banner&utm_campaign=projectmanager",
            image: "https://alt-images.codestream.com/codestream_logo_projectmanager.png",
            width: 35,
            message: `<p>Discuss, review, and share code with your team in VS Code. Links discussions about 
                code to your code. Integrates w/ Slack, Jira, Trello, and Live Share.</p>`,
            extra: 
                `<a title="Try CodeStream" href="https://codestream.com/?utm_source=vscmarket&utm_medium=banner&utm_campaign=projectmanager">
                 Try it free</a>` 
        };
        sponsors.push(sponsorCodeStream);
        return sponsors
    }
   
}