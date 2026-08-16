# Stremio 中文多站字幕插件

聚合以下来源：

- ASSRT（官方 API，需要 Token）
- 字幕库 / Zimuku（网页适配器）
- SubHD（网页适配器）

## 启动

需要 Node.js 20 或更高版本。

```powershell
Copy-Item .env.example .env
# 编辑 .env，至少设置部署后的 PUBLIC_URL；如使用 ASSRT，再填写 ASSRT_TOKEN
.\install.cmd
.\start.cmd
```

脚本会依次查找 pnpm、npm 和 Codex 内置的 Node.js，不要求全局安装 pnpm，也不受 PowerShell 脚本执行策略影响。

也提供了同等功能的 PowerShell 脚本。如果需要使用它们，可仅对当前窗口允许本地脚本：

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\install.ps1
.\start.ps1
```

在 Stremio 中安装 `http://127.0.0.1:7000/manifest.json`。远程使用时必须部署到 Stremio 客户端能够访问的 HTTPS 地址，并把 `PUBLIC_URL` 设置成该地址。

## 注意事项

- ASSRT Token 可在其用户面板取得；官方免费配额默认是每分钟 20 次，因此插件只在搜索时请求一次 API，用户真正选择字幕后才请求详情。
- 字幕库与 SubHD 没有公开 API，站点改版、Cloudflare、人机验证或登录要求都可能令匿名下载暂时失效。镜像可通过环境变量调整。
- 当前内置 ZIP 解压和 SRT/ASS/SSA/VTT 文本转码。RAR、7z、SUP 和 VobSub 不是 Stremio 可直接显示的文本字幕，插件会跳过或返回明确错误。
