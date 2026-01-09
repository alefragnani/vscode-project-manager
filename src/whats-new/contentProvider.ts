/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ChangeLogItem, ChangeLogKind, ContentProvider, Header, Image, IssueKind, SupportChannel, SocialMediaProvider } from "../../vscode-whats-new/src/ContentProvider";

export class ProjectManagerContentProvider implements ContentProvider {

    public provideHeader(logoUrl: string): Header {
        return <Header> {logo: <Image> {src: logoUrl, height: 50, width: 50}, 
            message: `<b>Project Manager</b> helps you to easily access your <b>projects</b>,
            no matter where they are located. <i>Don't miss those important projects anymore</i>.
            <br><br>You can define your own <b>Projects</b> (also called <b>Favorites</b>), or choose 
            for auto-detect <b>Git</b>, <b>Mercurial</b> or <b>SVN</b> repositories, <b>VSCode</b> 
            folders or <b>any</b> other folder.`};
    }

    public provideChangeLog(): ChangeLogItem[] {
        const changeLog: ChangeLogItem[] = [];

        changeLog.push({ kind: ChangeLogKind.VERSION, detail: { releaseNumber: "13.0.0", releaseDate: "November 2025" } });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Fully Open Source again",
                id: 498,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Highlight the current project in the Side Bar",
                id: 299,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Add localization support to Welcome Views",
                id: 938,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Support Modal Message for malformed <code>package.json</code> message",
                id: 531,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Supports <b>Profile</b> for projects",
                id: 281,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "<b>fr</b> translations",
                id: 735,
                kind: IssueKind.PR,
                kudos: "@damsfx"
            }
        });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "<b>zh-tw</b> and <b>zh-cn</b> translations",
                id: 734,
                kind: IssueKind.PR,
                kudos: "@Chakyiu"
            }
        });
        changeLog.push({
            kind: ChangeLogKind.CHANGED,
            detail: {
                message: "Update documentation of <code>projectsLocation</code> setting",
                id: 764,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.CHANGED,
            detail: {
                message: "<b>ru</b> translations",
                id: 841,
                kind: IssueKind.PR
            }
        });
        changeLog.push({
            kind: ChangeLogKind.CHANGED,
            detail: {
                message: "<b>uk</b> translations",
                id: 842,
                kind: IssueKind.PR
            }
        });
        changeLog.push({
            kind: ChangeLogKind.CHANGED,
            detail: {
                message: "<b>zh-cn</b> translations",
                id: 771,
                kind: IssueKind.PR,
                kudos: "@Mister-Hope"
            }
        });
        changeLog.push({
            kind: ChangeLogKind.FIXED,
            detail: {
                message: "Favorites not shown while filtering by tags",
                id: 557,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.FIXED,
            detail: {
                message: "Respect <code>removeCurrentProjectFromList</code> setting no remotes",
                id: 381,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.FIXED,
            detail: {
                message: "Minor grammar issues",
                id: 795,
                kind: IssueKind.PR,
                kudos: "@dphelan"
            }
        });
        changeLog.push({
            kind: ChangeLogKind.FIXED,
            detail: {
                message: "Enum <code>confirmSwitchOnActiveWindow</code> description",
                id: 797,
                kind: IssueKind.PR,
                kudos: "@salim-b"
            }
        });
        changeLog.push({
            kind: ChangeLogKind.INTERNAL,
            detail: {
                message: "Security Alert: brace-expansion",
                id: 832,
                kind: IssueKind.PR,
                kudos: "dependabot"
            }
        });
        changeLog.push({
            kind: ChangeLogKind.INTERNAL,
            detail: {
                message: "Security Alert: serialize-javascript",
                id: 796,
                kind: IssueKind.PR,
                kudos: "dependabot"
            }
        });
        changeLog.push({
            kind: ChangeLogKind.INTERNAL,
            detail: {
                message: "Security Alert: webpack",
                id: 761,
                kind: IssueKind.PR,
                kudos: "dependabot"
            }
        });
        changeLog.push({
            kind: ChangeLogKind.INTERNAL,
            detail: {
                message: "Security Alert: braces",
                id: 746,
                kind: IssueKind.PR,
                kudos: "dependabot"
            }
        });


        changeLog.push({ kind: ChangeLogKind.VERSION, detail: { releaseNumber: "12.8.0", releaseDate: "March 2024" } });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Published to Open VSX",
                id: 458,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Getting Started/Walkthrough",
                id: 517,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "<b>cs</b> translations",
                id: 720,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.CHANGED,
            detail: {
                message: "Avoid What's New when using Gitpod",
                id: 724,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.CHANGED,
            detail: {
                message: "Avoid What's New when installing lower versions",
                id: 724,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.FIXED,
            detail: {
                message: "Activation fails when <b>baseFolders</b> contains symlinks",
                id: 657,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.FIXED,
            detail: {
                message: "Status Bar missing with project using relative path",
                id: 650,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.FIXED,
            detail: {
                message: "Trying to save project with no folder opened",
                id: 683,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.FIXED,
            detail: {
                message: "Extension activation with invalid json",
                id: 687,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.FIXED,
            detail: {
                message: "What's new broken on web",
                id: 677,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.INTERNAL,
            detail: {
                message: "Localization (l10n) support",
                id: 654,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.INTERNAL,
            detail: {
                message: "Support Implicit Activation Events API",
                id: 659,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.INTERNAL,
            detail: {
                message: "Security Alert: word-wrap",
                id: 695,
                kind: IssueKind.PR,
                kudos: "dependabot"
            }
        });
        changeLog.push({
            kind: ChangeLogKind.INTERNAL,
            detail: {
                message: "Security Alert: webpack",
                id: 680,
                kind: IssueKind.PR,
                kudos: "dependabot"
            }
        });
        changeLog.push({
            kind: ChangeLogKind.INTERNAL,
            detail: {
                message: "Security Alert: terser",
                id: 624,
                kind: IssueKind.PR,
                kudos: "dependabot"
            }
        });

        changeLog.push({ kind: ChangeLogKind.VERSION, detail: { releaseNumber: "12.7.0", releaseDate: "August 2022" } });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Improve <b>List</b> performance",
                id: 628,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Filter project in Activity Bar",
                id: 213,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Accept case changes during project rename",
                id: 622,
                kind: IssueKind.PR,
                kudos: "@gdh1995"
            }
        });
        changeLog.push({
            kind: ChangeLogKind.FIXED,
            detail: {
                message: "Wrong description for <b>File Manager</b> in Linux",
                id: 618,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.FIXED,
            detail: {
                message: "Projects not being auto-detected if cache is false",
                id: 448,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.INTERNAL,
            detail: {
                message: "Improve extension startup",
                id: 625,
                kind: IssueKind.Issue
            }
        });

        changeLog.push({ kind: ChangeLogKind.VERSION, detail: { releaseNumber: "12.6.1", releaseDate: "June 2022" } });
        changeLog.push({
            kind: ChangeLogKind.INTERNAL,
            detail: "Add <b>GitHub Sponsors</b> support"
        });

        changeLog.push({ kind: ChangeLogKind.VERSION, detail: { releaseNumber: "12.6.0", releaseDate: "May 2022" } });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Setting to decide if switching projects on same window should ask for confirmation",
                id: 346,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "<b>Open in New Window</b> button in Project List picker",
                id: 570,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Support Settings Categories API",
                id: 554,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.FIXED,
            detail: {
                message: "Typo in <b>openInCurrenWindowIfEmpty</b> setting",
                id: 587,
                kind: IssueKind.PR,
                kudos: "@apettenati"
            }
        });

        changeLog.push({ kind: ChangeLogKind.VERSION, detail: { releaseNumber: "12.5.0", releaseDate: "January 2022" } });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "New setting to support symlinks on baseFolder setting",
                id: 583,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Support new MacOS File Menu API",
                id: 555,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Support new createStatusBarItem API",
                id: 521,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.CHANGED,
            detail: {
                message: "Remove watchFile interval",
                id: 575,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.INTERNAL,
            detail: "<b>Duckly</b> becomes a Sponsor"
        });

        return changeLog;
    }

    public provideSupportChannels(): SupportChannel[] {
        const supportChannels: SupportChannel[] = [];
        supportChannels.push({
            title: "Become a sponsor on GitHub",
            link: "https://www.github.com/sponsors/alefragnani",
            message: "Become a Sponsor"
        });
        supportChannels.push({
            title: "Donate via PayPal",
            link: "https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=EP57F3B6FXKTU&lc=US&item_name=Alessandro%20Fragnani&item_number=vscode%20extensions&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted",
            message: "Donate via PayPal"
        });
        return supportChannels;
    }
}

export class ProjectManagerSocialMediaProvider implements SocialMediaProvider {
    public provideSocialMedias() {
        return [{
            title: "Follow me on Twitter",
            link: "https://www.twitter.com/alefragnani"
        }];
    }
}