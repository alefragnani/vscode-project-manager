<p align="center">
  <br />
  <a title="Learn more about Project Manager" href="http://github.com/alefragnani/vscode-project-manager"><img src="https://raw.githubusercontent.com/alefragnani/vscode-project-manager/master/images/vscode-project-manager-logo-readme.png" alt="Project Manager Logo" width="70%" /></a>
</p>

# What's new in Project Manager 11.3

* Adds an all-new **Side Bar**
* Support **Remote Development** support
* Support open **Remote Projects** from local installation
* Adds support to save **Workspaces** as Projects
* Adds `Add Project to Workspace` command to **Command Palette**
* Adds **Portable Mode** support
* Adds `Disable Project`, `Add to Workspace`, `Add to Favorites` and `Refresh Project` commands in **Side Bar**
* Adds `Open in New Window` hover command in **Side Bar**
* Adds **Localization** support

# Support

**Project Manager** is an extension created for **Visual Studio Code**. If you find it useful, please consider supporting it.

<table align="center" width="60%" border="0">
  <tr>
    <td>
      <a title="Paypal" href="https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=EP57F3B6FXKTU&lc=US&item_name=Alessandro%20Fragnani&item_number=vscode%20extensions&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted"><img src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif"/></a>
    </td>
    <td>
      <a title="Paypal" href="https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=EP57F3B6FXKTU&lc=BR&item_name=Alessandro%20Fragnani&item_number=vscode%20extensions&currency_code=BRL&bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted"><img src="https://www.paypalobjects.com/pt_BR/i/btn/btn_donate_SM.gif"/></a>
    </td>
    <td>
      <a title="Patreon" href="https://www.patreon.com/alefragnani"><img src="https://raw.githubusercontent.com/alefragnani/oss-resources/master/images/button-become-a-patron-rounded-small.png"/></a>
    </td>
  </tr>
</table>

## Sponsors

<a title="Try CodeStream" href="https://sponsorlink.codestream.com/?utm_source=vscmarket&utm_campaign=projectmanager&utm_medium=banner"><img src="https://alt-images.codestream.com/codestream_logo_projectmanager.png" width="35%"/></a></br>
Discussing code is now as easy as highlighting a block and typing a comment right from your IDE. Take the pain out of code reviews and improve code quality.<br> <a title="Try CodeStream" href="https://sponsorlink.codestream.com/?utm_source=vscmarket&utm_campaign=projectmanager&utm_medium=banner">Try it free</a>

<br>

# Project Manager

It helps you to easily access your **projects**, no matter where they are located. _Don't miss those important projects anymore_. 

You can define your own **Projects** (also called **Favorites**), or choose for auto-detect **Git**, **Mercurial** or **SVN** repositories, **VSCode** folders, or **any** other folder.

Here are some of the features that **Project Manager** provides:

* Save any folder as a **Project**
* Save any workspace as a **Project**
* Auto-detect **Git**, **Mercurial** or **SVN** repositiories
* Open projects in the same or new window
* Identify _deleted/renamed_ projects
* A **Status Bar** which identifies the current project
* A dedicated **Side Bar**

# Features

## Available Commands

* `Project Manager: Save Project` Save the current folder/workspace as a new project
* `Project Manager: Edit Project` Edit your projects manually (`projects.json`)
* `Project Manager: List Projects to Open` List all saved/detected projects and pick one
* `Project Manager: List Projects to Open in New Window` List all saved/detected projects and pick one to be opened in New Window
* `Project Manager: Refresh Projects` Refresh the cached projects

## Manage your projects

### Save Project

You can save the current folder/workspace as a **Project** at any time. You just need to type its name. 

![Save](images/project-manager-save.png)

> It suggests a name to you _automatically_ :)
 
### Edit Projects

For easier customization of your project list, you can edit the `projects.json` file, directly inside **Code**. Just execute `Project Manager: Edit Projects` and the `projects.json` file is opened. Simple as this:

```json
[
    {
        "name": "Pascal MI",
        "rootPath": "c:\\PascalProjects\\pascal-menu-insight",
        "paths": [],
        "group": "",
        "enabled": true
    },
    {
        "name": "Bookmarks",
        "rootPath": "$home\\Documents\\GitHub\\vscode-bookmarks",
        "paths": [],
        "group": "",
        "enabled": true
    },
    {
        "name": "Numbered Bookmarks",
        "rootPath": "~\\Documents\\GitHub\\vscode-numbered-bookmarks",
        "paths": [],
        "group": "",
        "enabled": false
    }
]
```

For now, only `name`, `rootPath`, and `enabled` fields are used.

> You can use `~` or `$home` while defining any path. It will be replaced by your HOME folder.

> Projects that are *not* `enabled` will be hidden from project listings until re-enabled.

> Be sure that the JSON file is well-formed. Otherwise, **Project Manager** will not be able to open it, and an error message like this should appear. In this case, you should use the `Open File` button to fix it.

![Corrupted](images/project-manager-edit-corrupted-projectsJson.png)

## Access 

### List Projects to Open

Shows your projects and select one to open.

### List Projects to Open in New Window

Just like **List Projects** but always opening in **New Window**.

## Keyboard Focused Users

If you are a keyboard focused user and uses _Vim like_ keyboard navigation, you can navigate thru the project list with your own keybindings. 

Just use the `when` clause `"inProjectManagerList"`, like:

```json
    {
        "key": "ctrl+j",
        "command": "workbench.action.quickOpenSelectNext",
        "when": "inProjectManagerList"
    }
```

## Available Settings

You can choose how your projects are sorted

* `Saved`: The order that you saved the projects
* `Name`: The name that you typed for the project
* `Path`: The full path of the project
* `Recent`: The recently used projects

```json
    "projectManager.sortList": "Name"
```

![List](images/project-manager-list-sort-by-name.png)

* Choose if the project list must be grouped by its _kind_ (**Favorites**, **Git**, **Mercurial**, **SVN** and **VS Code**).

```json
    "projectManager.groupList": true
```

* Should the current project be removed from the list? (`false` by default)

```json
    "projectManager.removeCurrentProjectFromList": true
```

* Should identify _invalid paths_ on project list? (`true` by default)

```json 
    "projectManager.checkInvalidPathsBeforeListing": false
```

* Filter Projects Through Full Path (`false` by default)

```json 
    "projectManager.filterOnFullPath": true
```

* Custom projects file (`projects.json`) location

If you intend to _share_ projects between  **Stable** and **Insider** installations, or if you store your settings in different locations (cloud services), you can indicate an _alternative_ location for the `projects.json` file.

```json
    "projectManager.projectsLocation": "C\\Users\\myUser\\AppData\\Roaming\\Code\\User"
```

> You can use `~` or `$home` while defining the path. It will be replaced by your HOME folder.

* Automatic Detection of Projects (**Git** ![git](images/ico_git_branch.png), **Mercurial** ![git](images/ico_git_branch.png), **SVN** ![svn](images/ico_svn.png) and **VSCode** ![vscode](images/ico_file_code.png))

```json
    "projectManager.git.baseFolders": [
        "c:\\Projects\\code",
        "d:\\MoreProjects\\code-testing",
        "$home\\personal-coding"
    ]
```
> Define the folders which contains the projects

```json
    "projectManager.git.ignoredFolders": [
        "node_modules", 
        "out", 
        "typings", 
        "test"
        "fork*"
    ],
```
> Define which folders should be ignored (inside the BaseFolders).

> It supports `glob` patterns

```json
    "projectManager.git.maxDepthRecursion": 4
```
> Define how deeps it should search for projects

* Cache automatically detected projects (`true` by default)

```json 
    "projectManager.cacheProjectsBetweenSessions": false
```

* Display the Project Name in Status Bar (`true` by default)

```json 
    "projectManager.showProjectNameInStatusBar": true
```

* Open projects in _New Window_ when clicking in status bar (`false` by default)

```json 
    "projectManager.openInNewWindowWhenClickingInStatusBar": true
```

* Indicates if the `New Window` command should open the project in current window, when empty (`always` by default)

  * `always`: Whenever you call the Open in New Window command, it will open in the current window, if empty"
  * `onlyUsingCommandPalette`: Only open in the current window if you use the Command Palette"
  * `onlyUsingSideBar`: Only open in the current window if you use the Side Bar"
  * `never`: Works as today. The Open in New Window command will always open in New Window

```json 
    "projectManager.openInCurrenWindowIfEmpty": "always"
```

## Side Bar

The **Projects** are now presented in its own **Side Bar**, giving you more free space in your Explorer view. You will have a few extra commands available:

* Open a project, simply clicking in the project item
* Open a project in a New Window, right clicking in the project item, or using the hover button
* Add a project to the current Workspace

![Side Bar](images/vscode-project-manager-side-bar.gif)

> If you don't want to see the **Project Manager** icon in the Activity Bar, right-click and uncheck it from the context menu. 

## Installation and Configuration

You should follow the official documentation to:

- [Install the extension](https://code.visualstudio.com/docs/editor/extension-gallery)
- [Modify its settings](https://code.visualstudio.com/docs/getstarted/settings)

# License

[MIT](LICENSE.md) &copy; Alessandro Fragnani
