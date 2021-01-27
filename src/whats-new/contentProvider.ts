/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

// tslint:disable-next-line:max-line-length
import { ChangeLogItem, ChangeLogKind, ContentProvider, Header, Image, Sponsor, IssueKind, SupportChannel, SponsorProvider, SocialMediaProvider } from "../../vscode-whats-new/src/ContentProvider";

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

        changeLog.push({ kind: ChangeLogKind.VERSION, detail: { releaseNumber: "12.0.0", releaseDate: "November 2020" } });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Adds <b>Open Settings</b> command to the Side Bar",
                id: 434,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Concatenates the \"Number of Projects\" on each Panel in the Side Bar",
                id: 267,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Adds <b>Reveal in Finder/Explorer</b> command in the Side Bar's context menu",
                id: 322,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Adds setting to decide if auto-detected projects should ignore projects found inside other projects",
                id: 189,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.INTERNAL,
            detail: {
                message: "Use <b>vscode-ext-help-and-feedback</b> package",
                id: 432,
                kind: IssueKind.Issue
            }
        });

        changeLog.push({ kind: ChangeLogKind.VERSION, detail: { releaseNumber: "11.3.0", releaseDate: "September 2020" } });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Support <b>$home</b> and <b>\"~\" (tilde)</b> symbol on projectLocation setting",
                id: 384,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Support <b>~</b> (tilde) symbol on any path related setting",
                id: 414,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Support <b>glob</b> patterns in <b>ignoredFolders</b> settings",
                id: 278,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Czech - Simplified Chinese",
                id: 412,
                kind: IssueKind.PR,
                kudos: "@Amereyeu"
            }
        });

        changeLog.push({ kind: ChangeLogKind.VERSION, detail: { releaseNumber: "11.2.0", releaseDate: "August 2020" } });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Support string array in Settings UI",
                id: 410,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Use new <b>remote</b> codicon",
                id: 396,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.FIXED,
            detail: {
                message: "Weird icon behaviour when no ThemeIcon is selected",
                id: 392,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.FIXED,
            detail: {
                message: "maxDepthRecursion worried about extra trailing path separator",
                id: 404,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.FIXED,
            detail: {
                message: "Localization - Simplified Chinese",
                id: 403,
                kind: IssueKind.PR,
                kudos: "@loniceras"
            }
        });
        changeLog.push({
            kind: ChangeLogKind.FIXED,
            detail: {
                message: "Typo in What's New",
                id: 390,
                kind: IssueKind.PR,
                kudos: "@geauxtigers"
            }
        });

        changeLog.push({ kind: ChangeLogKind.VERSION, detail: { releaseNumber: "11.1.0", releaseDate: "June 2020" } });
        changeLog.push({
            kind: ChangeLogKind.CHANGED,
            detail: {
                message: "Internal commands can't be customisable",
                id: 388,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.FIXED,
            detail: {
                message: "Status bar not working on remotes",
                id: 379,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.FIXED,
            detail: {
                message: "<b>Command Palette</b> showing ”Path does not exists” for remote projects",
                id: 380,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.FIXED,
            detail: {
                message: "<b>Open Folder</b> command in Welcome view not working on Windows",
                id: 387,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.INTERNAL,
            detail: {
                message: "Migrate from TSLint to ESLint",
                id: 360,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.INTERNAL,
            detail: {
                message: "Use <b>vscode-ext-codicons</b> package",
                id: 386,
                kind: IssueKind.Issue
            }
        });

        changeLog.push({ kind: ChangeLogKind.VERSION, detail: { releaseNumber: "11.0.1", releaseDate: "May 2020" } });
        changeLog.push({
            kind: ChangeLogKind.FIXED,
            detail: {
                message: "Path does not exists for SSH remote project",
                id: 375,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.FIXED,
            detail: {
                message: "<b>Open</b> command in Side Bar's context menu does not work",
                id: 376,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.FIXED,
            detail: {
                message: "Path does not exists for Docker remote project on Windows",
                id: 377,
                kind: IssueKind.Issue
            }
        });

        changeLog.push({ kind: ChangeLogKind.VERSION, detail: { releaseNumber: "11.0.0", releaseDate: "May 2020" } });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "Support open <b>Remote Projects</b>",
                id: 345,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.NEW,
            detail: {
                message: "<b>Side bar</b> welcome message",
                id: 353,
                kind: IssueKind.Issue
            }
        });
        changeLog.push({
            kind: ChangeLogKind.INTERNAL,
            detail: {
                message: "Remove <b>vscode</b> module dependency",
                id: 369,
                kind: IssueKind.Issue
            }
        });

        return changeLog;
    }

    public provideSupportChannels(): SupportChannel[] {
        const supportChannels: SupportChannel[] = [];
        supportChannels.push({
            title: "Become a sponsor on Patreon",
            link: "https://www.patreon.com/alefragnani",
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

export class ProjectManagerSponsorProvider implements SponsorProvider {
    public provideSponsors(): Sponsor[] {
        const sponsors: Sponsor[] = [];
        const sponsorCodeStream: Sponsor = <Sponsor> {
            title: "Learn more about CodeStream",
            link: "https://sponsorlink.codestream.com/?utm_source=vscmarket&utm_campaign=projectmanager&utm_medium=banner",
            image: {
                dark: "https://alt-images.codestream.com/codestream_logo_projectmanager.png",
                light: "https://alt-images.codestream.com/codestream_logo_projectmanager.png"
            },
            width: 35,
            message: `<p>Eliminate context switching and costly distractions. 
                Create and merge PRs and perform code reviews from inside your 
                IDE while using jump-to-definition, your keybindings, and other IDE favorites.</p>`,
            extra: 
                `<a title="Learn more about CodeStream" href="https://sponsorlink.codestream.com/?utm_source=vscmarket&utm_campaign=projectmanager&utm_medium=banner">
                 Learn more</a>` 
        };
        sponsors.push(sponsorCodeStream);
        return sponsors
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