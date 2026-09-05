## Uzaq mühitlərlə işləmək

Genişlənmə [Uzaq İnkişaf](https://code.visualstudio.com/docs/remote/remote-overview) ssenarilərini dəstəkləyir və ehtiyaclarınızdan asılı olaraq onu necə istifadə edəcəyinizi seçə bilərsiniz

### Uzaq mühitlərə daxil oluram, amma işimin çoxu lokaldır

Bu, _adi_ ssenaridir və məhz buna görə genişlənmənin işləməsi üçün xüsusi bir şey etməyinizə ehtiyac yoxdur. Quraşdırıldığı kimi işləyir.

Lokal quraşdırıldıqda istənilən Container, SSH, WSL və ya Codespaces layihəsini Seçilmişlərə əlavə edə bilərsiniz. Hər birinin düzgün tanınması üçün öz ikonası olacaq və onları seçdiyinizdə VS Code uzaq mühiti avtomatik açacaq.

_Sadəcə işləyir_

### Bəs işimin çoxunu uzaq mühitlərdə görürəmsə

Adətən uzaq mühitlərə (məsələn, SSH/WSL) qoşulursunuzsa və həmin uzaq mühitdə Seçilmiş layihələri saxlamaq və ya orada yerləşən anbarları avtomatik aşkarlamaq istəyirsinizsə, genişlənməni uzaq mühitdə işləmək üçün aktivləşdirməli/quraşdırmalısınız. 

Sadəcə aşağıdakı sətirləri `İstifadəçi parametrlərinizə` əlavə etməlisiniz.

```json
    "remote.extensionKind": {
        "alefragnani.project-manager": [
            "workspace"
        ]
    },
```

> Ətraflı məlumat [VS Code sənədlərində](https://code.visualstudio.com/docs/remote/containers#_advanced-forcing-an-extension-to-run-locally-or-remotely)
