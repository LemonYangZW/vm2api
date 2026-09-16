# kin-console web

Vite + TypeScript + Tailwind + shadcn/ui 管理台。壳来自 [satnaing/shadcn-admin](https://github.com/satnaing/shadcn-admin)（MIT），鉴权走 `POST /api/panel/login`，没有 Clerk。

和网关怎么联调、现网单文件怎么起：见 [../docs/RUN.md](../docs/RUN.md)。

本目录就是现网面板（2026-08-29 上线）。仓库根目录的 `index.html` 已下线，只作应急回滚副本，本目录**不会**把它当作构建入口。

## 开发

```bash
cd web
pnpm install
pnpm dev
```

浏览器打开 Vite 提示的地址，路由是 hash：`#/overview`、`#/database`、`#/users`、`#/settings/backup`。

本地默认把 `/api` 反代到 `https://ccmax20.cc`。换后端：

```bash
KIN_API_PROXY=http://127.0.0.1:8787 pnpm dev
```

登录页在非 `ccmax20.cc` / `kin.fkcodex.com` 宿主上可填 API Base（与旧面板 `apiBase()` 相同）。

「数据库」是 admin-only view：`GET /api/panel/me` 的 `views` 必须包含 `database`，页面再调用 `GET /api/panel/database/metrics`。前端与网关必须使用同一版契约；只部署前端时侧栏不会出现该入口，直接打开 `#/database` 会显示后端的 `panel route not found`。

### WSL + Windows 挂载盘（`/mnt/x` 等）下 HMR 不可靠

如果代码在 WSL2 里、仓库路径挂在 Windows 盘（9p 文件系统，如 `/mnt/x/...`）下，Vite 的文件监听经常收不到变更事件——改了代码但浏览器 HMR 不生效，页面还是旧的。**不要花时间等 HMR 或反复刷新**；直接完整重启 dev server：

```bash
pkill -f "vite --port 5173" 2>/dev/null
rm -rf node_modules/.vite
pnpm dev --port 5173 --force
```

`--force` 让 Vite 重新预打包依赖，配合清掉 `.vite` 缓存，能避免"服务端其实还在吐旧代码"的情况。这比排查 HMR 为什么没触发要快得多。

## 构建

```bash
cd web
pnpm build
```

`node_modules` 是在 WSL 里装的，`rolldown` 只有 linux 原生 binding，所以 Windows PowerShell 里跑 `pnpm build` 会在 vite 那步报 `Cannot find module '@rolldown/binding-win32-x64-msvc'`（`tsc -b` 那步照常能跑，类型错误照样会报）。构建在 WSL 里做，root 下 `pnpm` 不在 PATH，直接调 vite 入口：

```powershell
wsl -u root -e bash -c "cd /mnt/x/kin/kin-console/web && node node_modules/vite/bin/vite.js build"
```

`-u root` 不能省。`/usr/local/bin/node` 是一层 `runuser -u mci777` 包装，只有 root 调得动；换成默认用户跑同一条命令，`runuser` 会拒绝，整条命令**退出码 1、标准输出和标准错误都是空的**，`dist/` 保持上一次的产物。看不到任何报错并不等于构建成功，确认 `dist/` 的时间戳或看 vite 的 `✓ built in` 那一行。

产物在 `web/dist/`。部署走蓝绿双槽，详见 [../docs/RUN.md](../docs/RUN.md#蓝绿部署)：

```bash
tar -czf /tmp/dist.tar.gz -C dist .
# 上传到服务器后
kin-console-deploy /tmp/dist.tar.gz   # 解到空闲槽 → 校验 → 原子切换
kin-console-rollback                  # 出问题切回，约 2 秒
```

涉及新 `/api/panel` 路由或新 `views` 权限时，先更新并验证 kin-gateway，再部署 Web。只改样式、文案或纯前端交互时才可单独部署 Web。

不要手动往 `/var/www/kin-console` 里写文件——它是软链，直接写会破坏蓝绿结构。也不要自己解压到槽位再 `ln -sfn` 切过去：槽位里除了构建产物还需要一条指向共享 `/var/www/kin-console-dl` 的 `dl` 软链，而 `kin-console-deploy` 是从**当前服役的那个槽**读出这条链再复制过去的，缺了它下一次正常部署也会跟着坏。脚本还负责规范权限（文件 644 / 目录 755）、`nginx -t` 与优雅 reload、切换后校验首页 200。
