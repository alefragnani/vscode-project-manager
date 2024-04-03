## Travailler à distance

L'extension prend en charge les scénarios de [développement à distance] (https://code.visualstudio.com/docs/remote/remote-overview), et vous pouvez choisir comment l'utiliser, en fonction de vos besoins.

### J'accède à distance, mais la plupart de mon travail se fait au niveau local.

C'est le scénario _habituel_, et c'est pourquoi vous n'avez pas besoin de faire quoi que ce soit de spécial pour que l'extension fonctionne. Elle est prête à l'emploi.

Lorsqu'il est installé localement, vous pouvez sauvegarder tous les projets Container, SSH, WSL ou Codespaces en tant que Favoris. Chacun d'entre eux aura sa propre icône pour être correctement identifié, et lorsque vous les sélectionnerez, VS Code ouvrira automatiquement le projet distant.

_Ça marche, c'est tout_

### Mais que se passe-t-il si j'effectue la majeure partie de mon travail à distance ?

Si vous vous connectez normalement à des connexions distantes (comme SSH/WSL) et que vous souhaitez sauvegarder les projets Favorite sur cette connexion distante, ou être en mesure de détecter automatiquement les dépôts situés sur cette connexion distante, vous devez activer/installer l'extension pour travailler à distance. 

Il vous suffit d'ajouter les lignes ci-dessous dans vos `Paramètres utilisateur`.

```json
    "remote.extensionKind": {
        "alefragnani.project-manager": [
            "workspace"
        ]
    },
```

> Plus de détails sur [documentation VS Code](https://code.visualstudio.com/docs/remote/containers#_advanced-forcing-an-extension-to-run-locally-or-remotely)