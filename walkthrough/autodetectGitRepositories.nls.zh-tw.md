## 自動檢測 Git 存儲庫

只需使用項目所在的文件夾定義 `baseFolders` 設置，擴展就會顯示其中的所有 Git 項目。 如果您需要忽略任何子文件夾，可以使用 `glob` 模式來做到這一點

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
