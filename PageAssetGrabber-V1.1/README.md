# Page Asset Grabber 1.1 — Deep Scan

Manifest V3 Chrome/Edge 扩展，用于发现并批量保存 JPG/JPEG、PNG、GIF 素材。此版本专门加强了 GeoCities、Neocities 和老式页面：每个可注入 frame 独立扫描，popup 负责汇总去重。

## 主要改进

- `chrome.scripting.executeScript({ allFrames: true })` 扫描主页面和可注入 iframe，并保留 frame、document、baseURI、source 信息。
- Fast Scan / Deep Scan：Deep Scan 额外检查 CSS 规则（包含嵌套 `@media` / `@supports`）、开放 Shadow DOM、计算样式和老式 HTML 背景属性。
- 覆盖 `img.src/currentSrc/srcset`、`picture/source`、常见 lazy 属性、`body/table/td/th background`、`input[type=image]`、`video.poster`、SVG image href/xlink:href，以及 `backgroundImage`、`listStyleImage`、`borderImageSource`、`content`。
- 不以文件扩展名作为唯一条件；DOM 明确的图片候选会保留，无扩展名资源在下载前可由浏览器请求结果识别。无法识别时安全回退为 JPG，不会阻塞整批扫描。
- GIF 始终通过原始 URL 下载，不经过 Canvas 转换。
- URL 去重、格式/尺寸筛选、全选、批量下载、文件名整理、最多 3 次重试均保留。
- 500×500 筛选使用正确面积阈值 `250000`。

## 安装

1. 打开 `edge://extensions` 或 `chrome://extensions`。
2. 开启“开发人员模式”。
3. 选择“加载解压缩的扩展”，选中本文件夹。
4. 打开普通网页，点击扩展图标，选择 Fast Scan 或 Deep Scan。

文件保存到 `Downloads/PageAssetGrabber/网站名_YYYY-MM-DD/`。浏览器可能首次提示允许多个下载。

## 限制

浏览器禁止扩展读取 `chrome://`、`edge://`、扩展商店和部分受保护页面。跨域 iframe 只有在浏览器允许注入时才会返回结果；跨域 CSS 的 `cssRules` 可能不可读。无扩展名资源的最终 MIME 类型由下载/网络层决定，预览尺寸也可能未知。

## 文件结构

`manifest.json` 清单；`popup.html/css/js` 界面与扫描汇总；`scanner.js` frame 内扫描器；`background.js` 下载队列、命名和重试。
