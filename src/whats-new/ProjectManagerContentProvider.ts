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
            <br><br>You can define your own <b>Projects</b> (also called <b>Favorites</b>), or choose 
            for auto-detect <b>Git</b>, <b>Mercurial</b> or <b>SVN</b> repositories, <b>VSCode</b> 
            folders or <b>any</b> other folder.`};
    }

    public provideChangeLog(): ChangeLogItem[] {
        const changeLog: ChangeLogItem[] = [];
        changeLog.push({kind: ChangeLogKind.NEW, message: "Adds an all-new Project Manager <b>Side Bar</b>"});
        changeLog.push({kind: ChangeLogKind.NEW, message: "Adds <b>Remote Development</b> support"});
        changeLog.push({kind: ChangeLogKind.NEW, message: "Adds support to save <b>Workspaces</b> as projects"});
        changeLog.push({kind: ChangeLogKind.NEW, message: "Adds <b>Portable Mode</b> support"});
        changeLog.push({kind: ChangeLogKind.NEW, message: "Adds <b>Save</b> button in <b>Side Bar</b>"});
        changeLog.push({kind: ChangeLogKind.NEW, message: `Adds <b>Disable Project</b>, <b>Add to Workspace</b>, 
        <b>Add to Favorites</b> and <b>Refresh Project</b> commands`});
        changeLog.push({kind: ChangeLogKind.NEW, message: "Adds <b>Open in New Window</b> hover command in <b>Side Bar</b>"});
        changeLog.push({kind: ChangeLogKind.NEW, message: `Adds <b>Localization</b> support - <b>Russian</b>, <b>Portuguese (Brazil)</b> and <b>Simplified Chinese</b>`});    
        changeLog.push({kind: ChangeLogKind.NEW, message: `Adds support to <b>GlobalStoragePath</b> (Thanks to 
            @Chuxel - <a title=\"Open PR #250\" 
            href=\"https://github.com/alefragnani/vscode-project-manager/pull/250\">
            PR #250</a>)`});    
        changeLog.push({kind: ChangeLogKind.NEW, message: "Faster startup (Side Bar)"});
        changeLog.push({kind: ChangeLogKind.FIXED, message: `The projects in the <b>Side Bar</b> should not be sorted case-sensitive (<a title=\"Open Issue #243\" 
            href=\"https://github.com/alefragnani/vscode-project-manager/issues/243\">
            Issue #243</a>)`});
        return changeLog;
    }

    public provideSponsors(): Sponsor[] {
        const sponsors: Sponsor[] = [];
        const sponsorCodeStream: Sponsor = <Sponsor> {
            title: "Try Codestream",
            link: "https://sponsorlink.codestream.com/?utm_source=vscmarket&utm_campaign=projectmanager&utm_medium=banner",
            image: "https://alt-images.codestream.com/codestream_logo_projectmanager.png",
            width: 35,
            message: `<p>Discussing code is now as easy as highlighting a block and typing a comment right 
                      from your IDE. Take the pain out of code reviews and improve code quality.</p>`,
            extra: 
                `<a title="Try CodeStream" href="https://sponsorlink.codestream.com/?utm_source=vscmarket&utm_campaign=projectmanager&utm_medium=banner">
                 Try it free</a>` 
        };
        sponsors.push(sponsorCodeStream);
        return sponsors
    }
   
}