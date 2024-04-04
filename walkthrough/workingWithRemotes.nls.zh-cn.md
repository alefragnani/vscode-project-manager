## 使用远程工作

该扩展支持 [远程开发](https://code.visualstudio.com/docs/remote/remote-overview) 场景，您可以根据需要选择如何使用它。

### 我访问远程，但我的大部分工作是本地的

这是 _常规_ 场景，这就是为什么您不需要执行任何特殊操作即可使扩展正常工作。 它开箱即用。

在本地安装时，您可以将任何 Container、SSH、WSL 或 Codespaces 项目保存为收藏夹。 每一个都有自己的图标来正确识别，当您选择它们时，VS Code 将自动打开远程项目。

_它确实有效_

### 但是如果我的大部分工作都是在远程上完成怎么办

如果您通常连接到远程设备（例如 SSH/WSL）并希望在该远程设备上保存收藏夹项目，或者能够自动检测位于该远程设备上的存储库，则必须激活/安装该扩展才能在远程设备上工作。

您只需在“用户设置”中添加以下行即可。

```json
    "remote.extensionKind": {
        "alefragnani.project-manager": [
            "workspace"
        ]
    },
```

> 更多详细信息在 [VS Code documentation](https://code.visualstudio.com/docs/remote/containers#_advanced-forcing-an-extension-to-run-locally-or-remotely)
