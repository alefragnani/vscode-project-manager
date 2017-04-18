## Version 0.15.0

* **New:** Projects now detect _configuration changes_ to update Git/VSCode/SVN caches (issue [#110](https://github.com/alefragnani/vscode-project-manager/issues/110))

## Version 0.14.0

* **New:** Projects now detect _external changes_ to update cache (Thanks to @likun7981 [PR #107](https://github.com/alefragnani/vscode-project-manager/pull/107))

## Version 0.13.5

* **Fix:** Duplicate projects being listed (Thanks to @mlewand [PR #101](https://github.com/alefragnani/vscode-project-manager/pull/101))

## Version 0.13.4

* **Fix:** `Delete Project` wasn't working (Thanks to @mlewand [PR #100](https://github.com/alefragnani/vscode-project-manager/pull/100))

## Version 0.13.3

* **Fix:** Extension loading delay (Thanks to @Gama11 [PR #97](https://github.com/alefragnani/vscode-project-manager/pull/97))

## Version 0.13.2

* **Fix:** Status Bar not working for newly saved projects in macOS and Linux (issue [#84](https://github.com/alefragnani/vscode-project-manager/issues/84))

## Version 0.13.1

* **Fix:** Invalid `projects.json` file causing erros (issue [#82](https://github.com/alefragnani/vscode-project-manager/issues/82))
* **Fix:** Projects not displaying when no projects saved (Thanks to @samuelsuarez [PR #81](https://github.com/alefragnani/vscode-project-manager/pull/81))
* **Fix:** Typo in message (Thanks to @Gama11 [PR #83](https://github.com/alefragnani/vscode-project-manager/pull/83))
* **Internal**: Enabled **TSLint**

## Version 0.13.0

* **New:** Also list _Git_ and _SVN_ projects
* **New Setting:** Git and SVN projects support (`baseFolders`, `maxDepthRecursion` and `ignoredFolders`)
* **New Setting:** Cache VSCode, Git and SVN projects found
* **New Command:** Refresh Projects
* **Internal:** `projects.json` file has been refactored to support upcoming features 

## Version 0.12.2

* **Fix:** Saving a project with a new name was duplicating the Status Bar (issue [#69](https://github.com/alefragnani/vscode-project-manager/issues/69))

## Version 0.12.1

* **Fix:** The `path` should not be relevant while filtering projects (issue [#67](https://github.com/alefragnani/vscode-project-manager/issues/67))

## Version 0.12.0

* **New:** Display the _Project Name_ in the Status Bar (kudos to @BonDoQ)
* **New Setting:** Display the _Project Name_ in the Status Bar 
* **New:** Improved message when there is project saved yet (issue [#57](https://github.com/alefragnani/vscode-project-manager/issues/57))

## Version 0.11.0

* **New:** Also list _VS Code_ projects
* **New Setting:** VS Code projects support (`baseFolders`, `maxDepthRecursion` and `ignoredFolders`)

## Version 0.10.0

* **New Command:** List Projects to Open in New Window
* **Renamed Command:** List Projects to Open
* **New:** Comment for `sortList` setting now shows available options (issue [#52](https://github.com/alefragnani/vscode-project-manager/issues/52))

## Version 0.9.2

* **Fix:** Interim fix for project's name suggestion not working (also in _Stable_ release) (issue [#51](https://github.com/alefragnani/vscode-project-manager/issues/51))

## Version 0.9.1

* **Fix:** Saving projects with no name (_Insider_ release) (issue [#42](https://github.com/alefragnani/vscode-project-manager/issues/42))

## Version 0.9.0

* **New:** Added another **Sort** option (`Recent`)

## Version 0.8.3

* **Fix:** Linux support broken (issue [#39](https://github.com/alefragnani/vscode-project-manager/issues/39))

## Version 0.8.2

* **New:** The extension now supports **VSCode Insiders** version and has its own `projects.json` file. Use the **new setting** if you want to have **Stable** and **Insider** versions sharing the project list. 
* **Fix:** Not working on machines with _only_ **VSCode Insider** version installed (issue [#22](https://github.com/alefragnani/vscode-project-manager/issues/22))
* **New Setting:** Indicates an alternative location where the `projects.json` file is located

## Version 0.8.1

* **Fix:** Sort by _Saved_ not available (issue [#37](https://github.com/alefragnani/vscode-project-manager/issues/37))

## Version 0.8.0

* **New:** Support `$home` variable in project paths (kudos to @efidiles)

## Version 0.7.1

* **Fix:** List Projects command failed when no folder is open (issue [#32](https://github.com/alefragnani/vscode-project-manager/issues/32))

## Version 0.7.0

* **New:** Don't show the current folder/project in the project list (issue [#28](https://github.com/alefragnani/vscode-project-manager/issues/28))
* **New:** Indicate _invalid paths_ in the project list (issue [#30](https://github.com/alefragnani/vscode-project-manager/issues/30))

## Version 0.6.0

* **New:** Use new native API for opening folders _(requires VSCode 1.1.0 or higher)_
* **Fix:** Click or enter in project list does not work (Linux / Mac) (issue [#27](https://github.com/alefragnani/vscode-project-manager/issues/27))
* **Removed Settings:** The `projectManager.codePath` and `projectManager.useAlternativeMacOSXPath` where removed because are not necessary anymore.

## Version 0.5.5

* **Fix:** Saving projects not working in Linux (issue [#16](https://github.com/alefragnani/vscode-project-manager/issues/16)
* Readme updated to better explain how to install and configure the extension

## Version 0.5.4

* **Fix:** Updated instructions for Mac OS X after Code February Release (issue [#14](https://github.com/alefragnani/vscode-project-manager/issues/14) - Thanks to @satokaz, @janmarek and @csholmq)

## Version 0.5.3

* **Fix:** Save Project was using the whole path (issue [#12](https://github.com/alefragnani/vscode-project-manager/issues/12))

## Version 0.5.2

* **Fix:** Project switch not working for network folders (UNC Notation) (issue [#10](https://github.com/alefragnani/vscode-project-manager/issues/10))

## Version 0.5.1

* **Fix:** Interim fix for project switching not working in Mac OS X (issue [#7](https://github.com/alefragnani/vscode-project-manager/issues/7) - Thanks to @satokaz)

## Version 0.5.0

* **New:** The `projects.json` file is now formatted (Thanks to @cuth [PR #6](https://github.com/alefragnani/vscode-project-manager/pull/6))
* **Fix:** The `List Projects` keybinding was not working property (issue [#8](https://github.com/alefragnani/vscode-project-manager/issues/8)) 

## Version 0.4.0

* **New Command:** Edit Projects

## Version 0.3.1

* **Fix:** Project switch not working properly (issue [#5](https://github.com/alefragnani/vscode-project-manager/issues/5))

## Version 0.3.0

* **New Setting:** Indicate Code path
* **New Setting:** Open a New Window when you choose a project, or just switch the current
* **Fix:** Spaces in Project Path (issue [#3](https://github.com/alefragnani/vscode-project-manager/issues/3))

## Version 0.2.0

* License updated

## Version 0.1.1

* Initial release
