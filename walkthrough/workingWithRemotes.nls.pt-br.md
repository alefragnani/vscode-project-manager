## Trabalhando com Remotos

A extensão suporta cenários de [Desenvolvimento Remoto](https://code.visualstudio.com/docs/remote/remote-overview), e você pode escolher como usar, dependendo das suas necessidades.

### Eu acesso Remotos, mas a maior parte do meu trabalho é Local

Esse é o cenário _comum_, e é por isso que você não precisa fazer nada de especial para a extensão funcionar. Ela funciona naturalmente assim.

Quando instalada localmente, você pode salvar projetos Containers, SSH, WSL ou Codespaces como Favoritos. Cada um terá seu próprio ícone para identificá-lo de forma adequada, e quando você o selecionar, o VS Code irá abrí-lo como Remoto, automaticamente.

_Simplesmente funciona_

### Mas e se a maior porte do meu trabalho é em Remotos

Se você normalmente conecta a remotos (como SSH/WSL) e gostaria de salvar seus projetos Favoritos naquele remoto, ou ser possível auto-detectar repositórios localizados naqueles remotos, você deve ativar/instalar a extensão para funcionar naqueles remotos.. 

Você precisa apenas adicionar as linhas abaixo nas suas `Configurações de Usuário`.

```json
    "remote.extensionKind": {
        "alefragnani.project-manager": [
            "workspace"
        ]
    },
```

> Mais detalhes em [Documentação do VS Code](https://code.visualstudio.com/docs/remote/containers#_advanced-forcing-an-extension-to-run-locally-or-remotely)