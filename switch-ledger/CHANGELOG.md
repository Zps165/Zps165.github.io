# 更新日志 · Cart Log（Switch 花费与 eShop 余额）

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号用语义化版本，日期用 `YYYY-MM-DD`。

> 注意区分三种「版本」：
> - **应用版本**（本文件，例如 `1.1.0`）——页面功能与 Service Worker 的发布版本；
> - **数据版本**（`app.js` 的 `APP_VERSION`，当前 `5`）——`localStorage` 里数据结构与备份 JSON 的版本，只有改数据格式时才升；
> - **缓存名**（`sw.js` 的 `CACHE`）——离线缓存的容器名，现在只在需要一次性丢弃旧缓存时才改。

## [Unreleased]

（暂无）

## 1.1.0 — 2026-11-10

### 变更

- Service Worker 由「缓存优先」改为「网络优先」：先取网络，成功就写回缓存，只有离线或请求失败时才用缓存。改完 `index.html` / `styles.css` / `app.js` 后刷新即可看到新版，**不需要再手改版本号**。
- Service Worker 的请求统一带 `cache: 'no-cache'`，绕过浏览器 HTTP 缓存和 GitHub Pages 的 `max-age=600`，避免改动在十分钟内仍显示旧文件。
- `CACHE` 由 `cartlog-v18` 升到 `cartlog-v19`：一次性丢掉旧策略留下的缓存。
- 设置页「关于 → 离线缓存」文案由「PWA 自动更新 · 当前 CACHE v18」改为说明「网络优先」，不再展示会过期的缓存号。
- 新增本更新日志文件，并在 README 中链接。

### 升级说明

已安装的旧版本会在下次打开时提示「新版本已准备好」，点「刷新」即可切到新策略；下拉或重启应用也只会读到最新文件。

## 1.0.0 — 2026-11-10（首次发布）

随 [Zps165/Zps165.github.io](https://github.com/Zps165/Zps165.github.io) 上线，地址 <https://zps165.github.io/switch-ledger/>。

首个公开版本的功能集合：

- 四个视图：概览 `#overview`、清单 `#ledger`、统计 `#stats`、设置 `#settings`，hash 路由支持后退与刷新保持
- 记录类型：卡带 / 配件 / 点卡 / eShop 游戏；卡带与配件可标记「已出二手」，自动折算净成本与回血进度
- 多区服 eShop 钱包（港 / 日 / 美 / 欧 / 国 / 其他），各币种互不混算，支持自定义区服与三位大写币种
- 点卡购卡自动充值面值到对应区服余额；余额购游戏只扣余额、不重复计入现金支出；直购游戏记原币标价与实付人民币
- 平台、配件类型、区服可在设置页增删改，内置项可隐藏不可删
- 暖白 / 深色 / 跟随系统三种主题，尽早应用避免刷新闪白
- JSON 完整备份与恢复（数据版本 5，兼容 v1–v4）、CSV 导出
- PWA：可安装、离线可打开，manifest 提供「记一笔 / 记点卡 / 记 eShop / 查看已出」快捷方式
- 数据仅存本机 `localStorage` 键 `cartlog.switch.v1`，无后端、无第三方依赖
