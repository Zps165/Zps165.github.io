# Zps165.github.io

个人小工具集合站，纯静态、无后端、无第三方依赖，托管在 GitHub Pages。每个工具是一个独立子目录，数据只保存在各自浏览器本地。

## 在线地址

| 项目 | 地址 |
| --- | --- |
| 站点入口 | <https://zps165.github.io/> |
| Switch 花费账本 | <https://zps165.github.io/switch-ledger/> |
| 工时记 | <https://zps165.github.io/worklog/> |

## 项目

### switch-ledger · Cart Log（Switch 花费与 eShop 余额）

记录 Switch 卡带、配件、点卡和 eShop 数字版游戏的支出，并按区服维护 eShop 余额。采用「现金支出」口径：点卡充值和信用卡直购算现金支出，用余额买游戏只扣余额、不重复计现金。

- 四个视图：概览 / 清单 / 统计 / 设置，hash 路由，支持后退与刷新保持
- 卡带与配件可标记「已出二手」，自动折算净成本与回血进度
- 多区服钱包（港 / 日 / 美 / 欧 / 国 / 其他），各自币种互不混算，支持自定义区服与三位币种
- 平台、配件类型、区服可在设置页增删改，内置项可隐藏不可删
- 暖白 / 深色 / 跟随系统三主题；JSON 完整备份与恢复、CSV 导出
- 存储键 `cartlog.switch.v1`，结构 v5；应用版本 1.1.0（见 [CHANGELOG](switch-ledger/CHANGELOG.md)）

详见 [switch-ledger/README.md](switch-ledger/README.md)。

### worklog · 工时记（白夜班工时与加班费）

手机优先的工时记录 PWA：月历首页记每日起止时间与休息时长，按工作日 / 休息日 / 法定节假日分档计算加班费，支持缺勤、请假、排休计划与节假日自定义。

- 加班分档：工作日超 8h 计 1.5×，休息日 2×，法定节假日 3×
- 内置 2025–2027 国务院节假日安排，支持在线 JSON 更新
- 月度汇总、公式拆解、计薪加班构成图表、CSV 导出
- 存储键 `worklog:v1`；应用版本 1.3.0（见 [CHANGELOG](worklog/CHANGELOG.md)）

详见 [worklog/README.md](worklog/README.md)。

## 目录结构

```text
Zps165.github.io/
├── index.html                  # 入口页，从 projects.json 读取并渲染项目卡片
├── projects.json               # 项目清单：新增项目只改这里，不用动首页代码
├── .nojekyll                   # 关闭 Jekyll，按静态文件原样发布（含下划线开头的文件）
├── switch-ledger/              # Switch 花费账本
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── manifest.webmanifest
│   ├── sw.js
│   ├── CHANGELOG.md
│   ├── serve.sh
│   └── icons/
└── worklog/                    # 工时记
    ├── index.html
    ├── selftest.html
    ├── manifest.webmanifest
    ├── sw.js
    ├── CHANGELOG.md
    ├── css/
    ├── js/
    └── icons/
```

## 本地预览

两个项目都是静态文件，在仓库根目录起任意静态服务器即可同时预览入口页和所有子项目：

```bash
cd Zps165.github.io
python -m http.server 8090
```

然后访问 <http://localhost:8090/>，各项目在 `/switch-ledger/`、`/worklog/` 下。

注意：

- 必须通过 `http://localhost` 或 HTTPS 访问，`file://` 下浏览器不会注册 Service Worker，无法安装为 PWA。
- 不要直接双击 `index.html` 用 `file://` 打开：子项目依赖目录相对路径，且 `file://` 下 Service Worker 无法注册。
- `switch-ledger/` 另附 `serve.sh`（监听 `0.0.0.0:8090`），方便手机在同一 Wi-Fi 下访问。

## 部署

`master` 分支根目录即发布产物，推送到 GitHub Pages 后自动构建：

```bash
git add .
git commit -m "feat: ..."
git push origin master
```

约定：

- 所有资源使用相对路径（`./`），入口页链接写作 `./<project>/`，这样可以整体部署在域名根目录，也能放进任意子目录。
- 每个项目自带 `manifest.webmanifest`，`id` / `start_url` / `scope` 均为 `./`，Service Worker 以 `./sw.js` 注册、scope 为 `./`，互不影响。
- 仓库根目录保留 `.nojekyll`，避免 Jekyll 忽略以下划线开头的资源。

### Service Worker：网络优先

两个项目的 Service Worker 都是**网络优先**：先取网络，成功就用最新内容并写回缓存，只有离线或请求失败时才回退到缓存。请求还统一带 `cache: 'no-cache'`，绕过浏览器 HTTP 缓存和 GitHub Pages 的 `max-age=600`。

所以改完页面文件**直接刷新就生效，不需要再改任何版本号**。

`switch-ledger/sw.js` 的 `CACHE`、`worklog/sw.js` 的 `VERSION` 现在只是离线缓存的名字，只在想一次性丢弃全部旧缓存时才有必要升一下。

### 更新日志

每个项目在各自目录下维护 `CHANGELOG.md`，格式参考 Keep a Changelog，版本号用 `x.y.z`、日期用 `YYYY-MM-DD`：

- [switch-ledger/CHANGELOG.md](switch-ledger/CHANGELOG.md)
- [worklog/CHANGELOG.md](worklog/CHANGELOG.md)

发布时在 `CHANGELOG.md` 顶部加一节 `## x.y.z — YYYY-MM-DD`，并同步更新 `projects.json` 里的 `version` 与 `updated`，首页卡片上的版本信息就跟着变了。

## 新增一个项目

首页不再硬编码项目卡片：它读取根目录的 `projects.json` 生成，新增项目**不需要改任何首页代码**。

1. 新建 `<project>/` 目录，放入静态文件（`index.html`、样式、脚本、图标）。
2. 在 [projects.json](projects.json) 的 `projects` 数组里加一条：

   ```json
   {
     "dir": "my-tool",
     "name": "我的工具",
     "tag": "PWA · 工具",
     "description": "一句话说明它能干什么。",
     "cta": "打开我的工具",
     "version": "1.0.0",
     "updated": "2026-11-10",
     "changelog": "my-tool/CHANGELOG.md"
   }
   ```

   字段都可省略，`dir` 必填；可选 `order`（数字，越小越靠前）、`hidden`（`true` 则不在首页显示）。
3. 如需 PWA：加 `manifest.webmanifest` 与 `sw.js`，路径全部写成 `./` 相对形式。
4. 建议加 `<project>/CHANGELOG.md`，格式照现有两个项目的写。
5. 在本文件「在线地址」与「目录结构」中补上条目，提交并推送；Pages 构建完成后访问 `https://zps165.github.io/<project>/` 验证，首页卡片会自动出现。

## 隐私

没有分析脚本、没有远程请求、没有账号系统。每个工具的数据都只存在当前浏览器的 `localStorage` 里，清理浏览器数据、更换设备或无痕模式都会导致数据丢失，建议定期在各自设置页导出 JSON 备份。
