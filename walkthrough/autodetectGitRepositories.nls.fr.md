## Détection automatique des dépôts GitDétection automatique des dépôts Git

Définissez simplement le paramètre `baseFolders` avec les dossiers où sont situés vos projets, et l'extension vous montrera tous les projets Git qui s'y trouvent. Si vous avez besoin d'ignorer un sous-dossier, vous pouvez le faire en utilisant les patterns `glob`.

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
