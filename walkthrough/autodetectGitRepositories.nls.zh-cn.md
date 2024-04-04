## 自动检测 Git 存储库

只需使用项目所在的文件夹定义 `baseFolders` 设置，扩展就会显示其中的所有 Git 项目。 如果您需要忽略任何子文件夹，可以使用 `glob` 模式来做到这一点

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
