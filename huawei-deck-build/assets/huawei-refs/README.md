# huawei-refs — 华为官方 PPT 提取素材库

> **V2 使用说明**：本文件保留原始资产来源与索引。下文提到的 AICO HTML bundle、`eb.embed_image()`、`apply_bg.py` 与旧 `references/` 路径不属于 Huawei Deck V2。V2 只通过 `references/asset-catalog.md` 选择素材，将路径与 provenance ID 写入 `slide-plan.json`，并由 artifact-tool 或 PptxGenJS 以原生图片对象加入 PPTX。视觉规则以 V2 的 `references/visual-system.md` 为准。

本目录保留 V2 构建实际使用的官方模板、参考页、品牌标识、图标和两张封面素材。

## 来源材料

| 简称 | 原件 | 特征 |
|---|---|---|
| template-light | PPT模板-浅色版16-9 (2).pptx | 华为官方标准空白模板（封面/目录/图表配色示范/Thank you） |
| research-cover | 研究报告封面 | 深蓝金色光轨封面 |

## 目录

### covers/ — 封面 KV 与背景

| 文件 | 来源 | 用途 |
|---|---|---|
| 封面-雪山红伞KV.png | template-light 封面 | 华为最经典封面画（雪山云海+红色滑翔伞），透明 PNG |
| 封面-深蓝金光轨KV.jpeg | 研究报告封面 | 深蓝紫渐变 + 金色光轨光球，研究报告 / 技术分享深色封面（tech-share 模板封面在用） |

### logos/ — 品牌标识

| 文件 | 说明 |
|---|---|
| huawei-横版logo-透明.png | 花瓣+HUAWEI 字标横版，透明底（页脚右下角用） |
| huawei-花瓣-大.png / huawei-花瓣-红.png | 单独花瓣图形，透明底两种尺寸 |
| huaweicloud.png | Huawei Cloud 品牌标识 |

### components/ — 插画、装饰与图标

| 文件 | 说明 |
|---|---|
| icons-gray/ | 华为官方灰色线框图标（2500px 透明底）：调节器/硬盘/饼图/扫描识别/AI芯片/趋势屏/时钟——deck 深浅两色系均可用 |

### 整页参考与官方模板

| 文件 | 说明 |
|---|---|
| 官方PPT模板-浅色16-9.pptx | 华为官方空白模板原件（需交付 PPTX 且要官方母版时用） |
| pages/官方模板-封面页.jpg | 封面版式参考（部门/作者/日期占位 + 红色角线 + Security Level） |
| pages/官方模板-目录页.jpg | 目录页版式（浅灰底 + 黑「目录」+ 红短下划线） |
| pages/官方模板-图表配色示范页.jpg | **官方图表配色规范**：灰阶做底、华为红做强调、琥珀色点缀 |
| pages/官方模板-ThankYou页.jpg | 结尾页版式（左黑色大字 + 右使命宣言/版权/免责声明） |

## 使用注意

- 本目录是素材库，不会自动进入 deck；构建时按 `references/asset-catalog.md` 选择，并记录来源。
