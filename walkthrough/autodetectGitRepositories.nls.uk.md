## Автоматичне виявлення Git-репозиторіїв

Просто визначте налаштування `baseFolders` з папками, де знаходяться ваші проєкти, і розширення покаже всі Git-проєкти, які там розташовані. Якщо потрібно ігнорувати певні підпапки, це можна зробити за допомогою шаблонів `glob`.

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
