## Git anbarlarını avtomatik aşkarla

Sadəcə `baseFolders` parametrində layihələrinizin yerləşdiyi qovluqları göstərin — genişlənmə orada yerləşən bütün Git layihələrini sizə göstərəcək. Hər hansı alt qovluğu nəzərə almamaq lazımdırsa, bunu `glob` şablonları ilə edə bilərsiniz

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
