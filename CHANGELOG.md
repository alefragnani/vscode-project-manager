## [8.0.0] - 2018-07-04
### Added
- Project Manager Activity Bar (issue [#183](https://github.com/alefragnani/vscode-project-manager/issues/183))
- New Command in TreeView `Add to Workspace` (issue [#161](https://github.com/alefragnani/vscode-project-manager/issues/161))
- New Version Numbering based on `semver`

### Fixed
- `Save Project` command raises error when no folder is open (issue [#191](https://github.com/alefragnani/vscode-project-manager/issues/191))

## [0.25.2 - 7.2.2] - 2018-04-23
### Fixed
- Support _OSS_ releases, using the correct _User folder_ to store the projects (kudos to @Kurolox [PR 179](https://github.com/alefragnani/vscode-project-manager/pull/179))

## [0.25.0 - 7.2.0] - 2018-03-18
### New
- Support _Mercurial_ projects, similar to VSCode, Git and SVN (kudos to @lavir [PR 168](https://github.com/alefragnani/vscode-project-manager/pull/168))

### Changed
- The _sort by name_ option is now case-insensitive (kudos to @lavir [PR 169](https://github.com/alefragnani/vscode-project-manager/pull/169))

### Fixed
- Readme typo (thanks to @gavinr [PR 171](https://github.com/alefragnani/vscode-project-manager/pull/171))

## [0.24.1 - 7.1.1] - 2018-03-06
### Fixed
- `Refresh Projects` and Automatic Detection of Projects not working correctly (issues [#157](https://github.com/alefragnani/vscode-project-manager/issues/157), [#164](https://github.com/alefragnani/vscode-project-manager/issues/164), [#167](https://github.com/alefragnani/vscode-project-manager/issues/167) and [#172](https://github.com/alefragnani/vscode-project-manager/issues/172))

## [0.24.0 - 7.1.0] - 2018-02-03
### Added
- Setting to filter projects through full path (Thanks to @R3oLoN [PR #166](https://github.com/alefragnani/vscode-project-manager/pull/166))

## [0.23.1 - 7.0.1] - 2017-12-14
### Fixed
- Paths are now OS independent (issue [#152](https://github.com/alefragnani/vscode-project-manager/issues/152))
- Detect changes on any `git`, `vscode` or `svn` config (Thanks to @jcw- [PR #150](https://github.com/alefragnani/vscode-project-manager/pull/150))

## [0.23.0 - 7.0.0] - 2017-11-02
### Added
- Multi-root support (issue [#149](https://github.com/alefragnani/vscode-project-manager/issues/149))

## [0.22.0 - 6.0.0] - 2017-10-27
### Added
- Setting to display the Treeview (issue [#143](https://github.com/alefragnani/vscode-project-manager/issues/143))
- Setting to remove current project from list (Thanks to @rockingskier [PR #146](https://github.com/alefragnani/vscode-project-manager/pull/146))

### Changed
- Add `.haxelib` to `git.ignoredFolders` (Thanks to @Gamma11 [PR #140](https://github.com/alefragnani/vscode-project-manager/pull/140))

## [0.21.1 - 5.0.1] - 2017-09-08
### Fixed
- Error opening _Favorite_ projects in Treeview (issue [#141](https://github.com/alefragnani/vscode-project-manager/issues/141))

## [0.21.0 - 5.0.0] - 2017-09-07
### Added
- Projects Treeview (issue [#103](https://github.com/alefragnani/vscode-project-manager/issues/103))

## [0.20.0 - 4.5.0] - 2017-08-26
### Added
- Status Bar now also displays for auto-detected projects (VSCode, Git and SVN) (issue [#116](https://github.com/alefragnani/vscode-project-manager/issues/116))
- Support keyboard navigation (Vim like) in the project list (issue [#136](https://github.com/alefragnani/vscode-project-manager/issues/136))

## [0.19.0 - 4.4.0] - 2017-08-03
### Added
- Support _git-worktree_ projects (issue [#134](https://github.com/alefragnani/vscode-project-manager/issues/134))

## [0.18.1 - 4.3.1] - 2017-06-18
### Fixed
- Status Bar sometimes not showing in MacOS  (issue [#127](https://github.com/alefragnani/vscode-project-manager/issues/127))

## [0.18.0 - 4.3.0] - 2017-05-25
### Added
- Setting to decide if it would open projects in New Window when clicking in Status Bar
- Setting to disable checking for invalid paths before listing projects

### Changed
- Source code moved to `src` folder

## [0.17.0 - 4.2.0] - 2017-05-20
### Added
- Support grouping projects by type in `List Projects...` commands.

### Changed
- The `projectManager.openInNewWindow` setting was removed, since you already have `List Projects to Open in New Window` command.

## [0.16.0 - 4.1.0] - 2017-05-04
### Added
- Support cross platform path definitions also in VSCode, Git and SVN Projects (issue [#88](https://github.com/alefragnani/vscode-project-manager/issues/88))

## [0.15.1 - 4.1.1] - 2017-04-27
### Added
- Avoid _unnecessary_ cache delete when no `baseFolder` setting is changed in `User Settings` (issue [#111](https://github.com/alefragnani/vscode-project-manager/issues/111))

## [0.15.0 - 4.1.0] - 2017-04-18
### Added
- Projects now detect _configuration changes_ to update Git/VSCode/SVN caches (issue [#110](https://github.com/alefragnani/vscode-project-manager/issues/110))

## [0.14.0 - 4.0.0] - 2017-04-12
### Added
- Projects now detect _external changes_ to update cache (Thanks to @likun7981 [PR #107](https://github.com/alefragnani/vscode-project-manager/pull/107))

## [0.13.5 - 3.8.5] - 2017-03-18
### Fixed
- Duplicate projects being listed (Thanks to @mlewand [PR #101](https://github.com/alefragnani/vscode-project-manager/pull/101))

## [0.13.4 - 3.8.4] - 2017-05-08
### Fixed
- `Delete Project` wasn't working (Thanks to @mlewand [PR #100](https://github.com/alefragnani/vscode-project-manager/pull/100))

## [0.13.3 - 3.8.3] - 2017-05-05
### Fixed
- Extension loading delay (Thanks to @Gama11 [PR #97](https://github.com/alefragnani/vscode-project-manager/pull/97))

## [0.13.2 - 3.8.2] - 2017-02-01
### Fixed
- Status Bar not working for newly saved projects in macOS and Linux (issue [#84](https://github.com/alefragnani/vscode-project-manager/issues/84))

## [0.13.1 - 3.8.1] - 2017-01-28
### Fixed
- Invalid `projects.json` file causing erros (issue [#82](https://github.com/alefragnani/vscode-project-manager/issues/82))
- Projects not displaying when no projects saved (Thanks to @samuelsuarez [PR #81](https://github.com/alefragnani/vscode-project-manager/pull/81))
- Typo in message (Thanks to @Gama11 [PR #83](https://github.com/alefragnani/vscode-project-manager/pull/83))

### Changed
- Enabled **TSLint**

## [0.13.0 - 3.8.0] - 2017-01-15
### Added
- Also list _Git_ and _SVN_ projects
- Setting to support Git and SVN projects (`baseFolders`, `maxDepthRecursion` and `ignoredFolders`)
- Setting to cache VSCode, Git and SVN projects 

### Added
- New Command `Refresh Projects`

### Changed
- `projects.json` file has been refactored to support upcoming features 

## [0.12.2 - 3.7.2] - 2016-11-06
### Fixed
- Saving a project with a new name was duplicating the Status Bar (issue [#69](https://github.com/alefragnani/vscode-project-manager/issues/69))

## [0.12.1 - 3.7.1] - 2016-11-05
### Fixed
- The `path` should not be relevant while filtering projects (issue [#67](https://github.com/alefragnani/vscode-project-manager/issues/67))

## [0.12.0 - 3.7.0] - 2016-10-26
### Added
- Display the _Project Name_ in the Status Bar (kudos to @BonDoQ)
- Setting to display the _Project Name_ in the Status Bar 
- Improved message when there is project saved yet (issue [#57](https://github.com/alefragnani/vscode-project-manager/issues/57))

## [0.11.0 - 3.6.0] - 2016-10-19
### Added
- Also list _VS Code_ projects
- Setting to support VS Code projects (`baseFolders`, `maxDepthRecursion` and `ignoredFolders`)

## [0.10.0 - 3.5.0] - 2016-09-20
### Added
- New Command `List Projects to Open in New Window`
- Comment for `sortList` setting now shows available options (issue [#52](https://github.com/alefragnani/vscode-project-manager/issues/52))

### Changed
- Renamed Command `List Projects to Open`

## [0.9.2 - 3.4.2] - 2016-09-09
### Fixed
- Interim fix for project's name suggestion not working (also in _Stable_ release) (issue [#51](https://github.com/alefragnani/vscode-project-manager/issues/51))

## [0.9.1 - 3.4.1] - 2016-09-04
### Fixed
- Saving projects with no name (_Insider_ release) (issue [#42](https://github.com/alefragnani/vscode-project-manager/issues/42))

## [0.9.0 - 3.4.0] - 2016-09-01
### Added
- Added another **Sort** option (`Recent`)

## [0.8.3 - 3.3.1] - 2016-08-03
### Fixed
- Linux support broken (issue [#39](https://github.com/alefragnani/vscode-project-manager/issues/39))

## [0.8.2 - 3.3.0] - 2016-07-29
### Added
- The extension now supports **VSCode Insiders** version and has its own `projects.json` file. Use the **new setting** if you want to have **Stable** and **Insider** versions sharing the project list. 
- Setting to indicate an alternative location where the `projects.json` file is located

### Fixed
- Not working on machines with _only_ **VSCode Insider** version installed (issue [#22](https://github.com/alefragnani/vscode-project-manager/issues/22))

## [0.8.1 - 3.2.1] - 2016-07-27
### Fixed
- Sort by _Saved_ not available (issue [#37](https://github.com/alefragnani/vscode-project-manager/issues/37))

## [0.8.0 - 3.2.0] - 2016-07-14
### Added
- Support `$home` variable in project paths (kudos to @efidiles)

## [0.7.1 - 3.1.1] - 2016-05-30
### Fixed
- List Projects command failed when no folder is open (issue [#32](https://github.com/alefragnani/vscode-project-manager/issues/32))

## [0.7.0 - 3.1.0] - 2016-05-17
### Added
- Don't show the current folder/project in the project list (issue [#28](https://github.com/alefragnani/vscode-project-manager/issues/28))
- Indicate _invalid paths_ in the project list (issue [#30](https://github.com/alefragnani/vscode-project-manager/issues/30))

## [0.6.0 - 3.0.0] - 2016-04-26
### Added
- Use new native API for opening folders _(requires VSCode 1.1.0 or higher)_

### Changed
- The `projectManager.codePath` and `projectManager.useAlternativeMacOSXPath` where removed because are not necessary anymore.

### Fixed
- Click or enter in project list does not work (Linux / Mac) (issue [#27](https://github.com/alefragnani/vscode-project-manager/issues/27))

## [0.5.5 - 2.0.5] - 2016-04-03
### Fixed
- Saving projects not working in Linux (issue [#16](https://github.com/alefragnani/vscode-project-manager/issues/16)
- Readme updated to better explain how to install and configure the extension

## [0.5.4 - 2.0.4] - 2016-03-14
### Fixed
- Updated instructions for Mac OS X after Code February Release (issue [#14](https://github.com/alefragnani/vscode-project-manager/issues/14) - Thanks to @satokaz, @janmarek and @csholmq)

## [0.5.3 - 2.0.3] - 2016-03-09
### Fixed
- Save Project was using the whole path (issue [#12](https://github.com/alefragnani/vscode-project-manager/issues/12))

## [0.5.2 - 2.0.2] - 2016-02-24
### Fixed
- Project switch not working for network folders (UNC Notation) (issue [#10](https://github.com/alefragnani/vscode-project-manager/issues/10))

## [0.5.1 - 2.0.1] - 2016-02-11
### Fixed
- Interim fix for project switching not working in Mac OS X (issue [#7](https://github.com/alefragnani/vscode-project-manager/issues/7) - Thanks to @satokaz)

## [0.5.0 - 2.0.0] - 2016-02-10
### Added
- The `projects.json` file is now formatted (Thanks to @cuth [PR #6](https://github.com/alefragnani/vscode-project-manager/pull/6))

### Fixed
- The `List Projects` keybinding was not working property (issue [#8](https://github.com/alefragnani/vscode-project-manager/issues/8)) 

## [0.4.0 - 1.3.0] - 2016-01-20
### Added
- New Command `Edit Projects`

## [0.3.1 - 1.2.1] - 2016-01-18
### Fixed
- Project switch not working properly (issue [#5](https://github.com/alefragnani/vscode-project-manager/issues/5))

## [0.3.0 - 1.2.0] - 2016-01-18
### Added
- Setting to Indicate Code path
- Setting to Open a New Window when you choose a project, or just switch the current

### Fixed
- Spaces in Project Path (issue [#3](https://github.com/alefragnani/vscode-project-manager/issues/3))

## [0.2.0 - 1.1.0] - 2016-01-16
### Added
* License updated

## [0.1.1 - 1.0.0] - 2016-01--6
* Initial release