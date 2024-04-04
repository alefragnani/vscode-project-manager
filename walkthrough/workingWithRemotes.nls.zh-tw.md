## 使用遠程工作

該擴展支持 [遠程開發](https://code.visualstudio.com/docs/remote/remote-overview) 場景，您可以根據需要選擇如何使用它。

### 我訪問遠程，但我的大部分工作是本地的

這是 _常規_ 場景，這就是為什麽您不需要執行任何特殊操作即可使擴展正常工作。 它開箱即用。

在本地安裝時，您可以將任何 Container、SSH、WSL 或 Codespaces 項目保存為收藏夾。 每一個都有自己的圖標來正確識別，當您選擇它們時，VS Code 將自動打開遠程項目。

_它確實有效_

### 但是如果我的大部分工作都是在遠程上完成怎麽辦

如果您通常連接到遠程設備（例如 SSH/WSL）並希望在該遠程設備上保存收藏夾項目，或者能夠自動檢測位於該遠程設備上的存儲庫，則必須激活/安裝該擴展才能在遠程設備上工作。

您只需在“用戶設置”中添加以下行即可。

```json
    "remote.extensionKind": {
        "alefragnani.project-manager": [
            "workspace"
        ]
    },
```

> 更多詳細信息在 [VS Code documentation](https://code.visualstudio.com/docs/remote/containers#_advanced-forcing-an-extension-to-run-locally-or-remotely)
