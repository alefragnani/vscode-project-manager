# Functionality

Manage your projects right inside Visual Studio Code. Easily access and switch between them.

# Usage

## Available commands

* **Project Manager: Edit Project** Edit the project list (`projects.json` file) directly inside **Code**
* **Project Manager: List Projects** List all saved projects and pick one
* **Project Manager: Save Project** Save the current project in the manager

![Commands](images/project-manager-commands.png)

### Save Project

You can save the current project in the manager at any time. You just need to type a name. It even suggest you _automatically_ :)

![Save](images/project-manager-save.png)

 > _new in version 0.4.0_ 
 
### Edit Projects

For easier customization of your project list, you can edit the `projects.json` file directly inside **Code**. Just execute `Project Manager: Edit Projects` and the `projects.json` file is opened. Simple as this:

```json
[
    {
        "label": "Pascal MI",
        "description": "c:\\Users\\Alessandro\\Documents\\GitHub\\pascal-menu-insight"
    },
    {
        "label": "Bookmarks",
        "description": "c:\\Users\\Alessandro\\Documents\\vso\\vscode-bookmarks"
    }
]
```

> Be sure that the JSON file is well-formed. Otherwise, **Project Manager** will not be able to open it, and an error message like this should appear. In this case, you should use the `Open File` button to fix it.

![Corrupted](images/project-manager-edit-corrupted-projectsJson.png)


## Available settings

* Allow you to choose how the projects are sorted in **List Projects** command. You can choose:

    * **Saved**: The order that you saved the projects
    * **Name**: The name that you typed for the project
    * **Path**: The full path of the project

```
    "projectManager.sortList": "Name"
```

![List](images/project-manager-list-sort-by-name.png)

> _new in version 0.3.0_  

* Indicate Code path (useful if not in `PATH` and if switching projects does not work when Code is opened from Start Menu / Taskbar)
```
    "projectManager.codePath": "C:\\Program Files\\Microsoft VS Code\\Bin\\Code.cmd"
```

* Open a New Window when you choose a project, or just switch the current _(default is `true`)_
```
    "projectManager.openInNewWindow": true
```

# Changelog

## Version 0.4.0

* **New:** Edit Projects

## Version 0.3.1

* **Fix:** Switching projects not working properly (issue [#5](https://github.com/alefragnani/vscode-project-manager/issues/5))

## Version 0.3.0

* **New:** Indicate Code path
* **New:** Open a New Window when you choose a project, or just switch the current
* **Fix:** Spaces in Project Path (issue [#3](https://github.com/alefragnani/vscode-project-manager/issues/3))

## Version 0.2.0

* License updated

## Version 0.1.1

* Initial release

## Participate

If you have any idea, feel free to create issues and pull requests

# License

[MIT](LICENSE.md) &copy; Alessandro Fragnani

---

[![Paypal Donations](https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=EP57F3B6FXKTU&lc=US&item_name=Alessandro%20Fragnani&item_number=vscode%20extensions&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted) if you enjoy using this extension :-)