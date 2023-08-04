## Auto-detect Git Repositories

Simply define the `baseFolders` setting with the folders where your projects are located, and the extension will show you all Git projects located in it. If you need to ignore any subfolder, you can do it, using `glob` patterns

```json
    "projectManager.git.baseFolders": [
        "c:\\Projects\\code",
        "d:\\MoreProjects\\code-testing",
        "$home\\personal-coding"
    ]
```

```json
    "projectManager.git.ignoredFolders": [
        "node_modules", 
        "out", 
        "typings", 
        "test"
        "fork*"
    ],
```
