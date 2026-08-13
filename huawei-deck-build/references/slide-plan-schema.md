# Engine-neutral slide plan

`slide-plan.json` is the single visual source for both build engines. Use schema version `1.0`. Geometry is authored on a `1280 × 720` design canvas; the local adapter converts pixels to inches at 96 px/in. Store typography in points so both engines preserve the same intended size.

## Root

```json
{
  "schemaVersion": "1.0",
  "projectId": "example-deck",
  "title": "Deck title",
  "language": "zh-CN",
  "canvas": { "width": 1280, "height": 720 },
  "theme": {
    "fonts": { "sans": "Noto Sans CJK SC", "serif": "Noto Serif CJK SC" },
    "colors": { "red": "C7000B", "ink": "1A1A1C", "muted": "585860", "line": "E7E7E7", "paper": "FFFFFF" }
  },
  "slides": []
}
```

## Slide

```json
{
  "id": "P03",
  "pageType": "data-trend",
  "title": "结论式标题",
  "primaryProofObject": "chart-main",
  "background": "FFFFFF",
  "elements": [],
  "groups": [{ "name": "KPI module", "members": ["kpi-bg", "kpi-value", "kpi-label"] }],
  "notes": "讲解要点\n\n[Sources]\n- E-03-01 https://example.com",
  "sourceIds": ["E-03-01"]
}
```

Every slide has exactly one `primaryProofObject`. The named element must exist. Every element has a stable unique `id`, semantic `role`, `type`, and `position`.

## Position

```json
{ "x": 72, "y": 64, "w": 1136, "h": 80, "rotation": 0 }
```

Coordinates must remain on canvas. Rotation is optional. Intentional bleed must set `allowBleed: true` on the element.

## Text

```json
{
  "id": "title",
  "type": "text",
  "role": "slide-title",
  "position": { "x": 72, "y": 56, "w": 1136, "h": 64 },
  "text": "页面标题",
  "style": {
    "fontFace": "Noto Sans CJK SC",
    "fontPt": 28,
    "bold": true,
    "color": "1A1A1C",
    "align": "left",
    "valign": "middle",
    "marginPt": 0,
    "maxLines": 1
  }
}
```

Roles map to the typography tokens in `visual-system.md`. Use `paragraphs` instead of `text` only when bullets or mixed emphasis are essential. Adapters must not auto-shrink below the role floor.

## Shape and connector

```json
{
  "id": "module-bg",
  "type": "shape",
  "role": "semantic-surface",
  "geometry": "roundRect",
  "position": { "x": 72, "y": 150, "w": 360, "h": 220 },
  "style": { "fill": "FFFFFF", "line": "E7E7E7", "linePt": 1, "radiusPx": 10 }
}
```

```json
{
  "id": "edge-a-b",
  "type": "connector",
  "role": "relationship",
  "position": { "x": 260, "y": 240, "w": 180, "h": 0 },
  "style": { "line": "76767C", "linePt": 1.25, "endArrow": "triangle" }
}
```

Create connectors before nodes so they remain behind nodes.

## Image

```json
{
  "id": "product-shot",
  "type": "image",
  "role": "primary-proof",
  "position": { "x": 670, "y": 160, "w": 520, "h": 390 },
  "source": { "path": "/absolute/or/project-relative/image.png", "provenanceId": "A-03-01" },
  "fit": "contain",
  "alt": "Product settings screenshot"
}
```

Images remain images; never rasterize text, tables, charts, or an entire slide.

Use `contain` by default. Engine-native `cover` algorithms do not guarantee the same focal crop. A `cover` image is valid only after the source has been pre-cropped to the exact target-frame ratio; then declare it explicitly:

```json
"source": {
  "path": "assets/prepared/P01-cover-16x9.png",
  "provenanceId": "A-01-01",
  "preparedForFrame": true
},
"fit": "cover"
```

Keep the original source and the prepared derivative in the project assets ledger. Never rely on an adapter's implicit focal-point choice.

## Table

```json
{
  "id": "comparison-table",
  "type": "table",
  "role": "primary-proof",
  "position": { "x": 72, "y": 150, "w": 1136, "h": 430 },
  "columns": [0.28, 0.36, 0.36],
  "rows": [["维度", "方案 A", "方案 B"], ["周期", "4 周", "8 周"]],
  "style": { "headerFill": "F3F4F6", "headerColor": "1A1A1C", "bodyFill": "FFFFFF", "line": "E7E7E7", "fontPt": 10.5, "headerFontPt": 11 }
}
```

Use a native table whenever rows and columns carry meaning. Cell-level overrides and merges are optional arrays keyed by zero-based row and column.

## Chart

```json
{
  "id": "trend-chart",
  "type": "chart",
  "role": "primary-proof",
  "chartType": "line",
  "position": { "x": 90, "y": 155, "w": 760, "h": 390 },
  "categories": ["Q1", "Q2", "Q3", "Q4"],
  "series": [{ "name": "实际", "values": [20, 27, 31, 42], "color": "C7000B" }],
  "style": { "showLegend": false, "showValue": true, "numberFormat": "0", "axisFontPt": 10 }
}
```

Allowed common chart types are `bar`, `column`, `line`, `pie`, `doughnut`, `scatter`, and `area`. Prefer common features supported by both engines. Record an adapter deviation when a required feature has no equivalent.

## Cross-engine invariant

Adapters may translate API names and units only. They may not change element type, text, data, geometry, reading order, emphasis color, semantic group, or source notes. A required translation outside those bounds must be recorded in `qa-report.md`.
