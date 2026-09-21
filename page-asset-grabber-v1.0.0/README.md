# Page Asset Grabber

一个精简的 Manifest V3 浏览器扩展，用于扫描当前网页并批量保存 JPG/JPEG、PNG、GIF 素材。GIF 通过原始 URL 下载，不会被转成静态图片。

## 安装（Microsoft Edge / Google Chrome）

1. 解压本项目 ZIP（或直接使用项目文件夹）。
2. 打开 `edge://extensions` 或 `chrome://extensions`。
3. 开启右上角的“开发人员模式”。
4. 点击“加载解压缩的扩展”，选择本项目文件夹。
5. 打开一个普通网页，点击工具栏中的 Page Asset Grabber 图标。

## 使用

扩展会查找 `<img>`、`srcset`、`picture/source`、常见懒加载属性、内联/计算后的 CSS background-image、可访问的开放 Shadow DOM，以及同源 iframe。结果会按 URL 去重，并显示缩略图、格式和尺寸（若浏览器能读取）。

可按格式和最小尺寸筛选，勾选素材后点击 Download selected。文件会保存到浏览器默认 Downloads 文件夹下的：

`PageAssetGrabber/网站名_YYYY-MM-DD/`

浏览器负责处理文件名冲突，失败下载会自动重试最多 3 次。首次批量下载时，浏览器可能显示“允许多个下载”的提示，请选择允许。

## 已知限制

- 受浏览器安全策略限制，`edge://`、`chrome://`、扩展商店页面和部分受保护页面不能扫描。
- 跨域 iframe、跨域 CSS 规则和需要登录/鉴权的资源可能无法读取或下载。
- CSS 图片和懒加载资源只有在页面已经提供 URL 时才能发现；尚未触发的网络请求不会被凭空推断。
- “最小尺寸”依赖浏览器能读取的图片自然尺寸；尺寸未知的资源仍会保留在“Any”筛选中。

## 项目结构

- `manifest.json`：MV3 清单和权限
- `popup.html/css/js`：界面、筛选、预览和下载交互
- `scanner.js`：页面资源扫描逻辑
- `background.js`：下载队列、冲突处理和失败重试

## 权限说明

`downloads` 用于批量保存，`scripting` 用于扫描当前页面，`tabs` 用于获取页面地址，`storage` 预留给后续设置持久化；`<all_urls>` 让扩展可以在用户主动打开的普通网页上扫描资源。
