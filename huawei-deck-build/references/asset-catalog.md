# Huawei asset catalog

Use assets only when the page script calls for a visual proof or the user explicitly requests official branding. The visual system remains authoritative; the presence of an asset is not permission to decorate a slide.

All paths are relative to `assets/huawei-refs/`.

## Preferred assets

- `官方PPT模板-浅色16-9.pptx`: official master and visual reference when exact official-template following is required.
- `pages/官方模板-图表配色示范页.jpg`: official grey-scale plus Huawei-red chart reference.
- `logos/huawei-横版logo-透明.png` and `logos/huawei-花瓣-红.png`: use only when the user or source template requires a logo.
- `logos/huawei-花瓣-大.png` and `logos/huaweicloud.png`: use only when the page script calls for the corresponding brand mark.
- `components/icons-gray/`: neutral line icons for a genuine category or status, not generic decoration.
- `covers/封面-雪山红伞KV.png` and `封面-深蓝金光轨KV.jpeg`: optional official-extracted cover visuals; use only when the page script authorizes a visual cover.
- `pages/官方模板-封面页.jpg`, `目录页.jpg`, `ThankYou页.jpg`: references, not mandatory page types.

## Authority and provenance

The assets were extracted and selected from official Huawei presentation/PDF references documented in `assets/huawei-refs/README.md`. Preserve that README. Record the exact asset path in `sources.md` and speaker notes when used.

The skill's original code and documentation are MIT-licensed. Huawei logos, official templates, and brand assets remain Huawei property. Use them only for authorized Huawei or internal-brand work. For external or unrelated work, replace the brand assets and retain only general layout principles. An available asset is not evidence of authorization.

## Selection order

1. User-provided, approved assets.
2. Relevant official Huawei assets in this catalog.
3. Primary-source screenshots or charts needed as evidence.
4. Searched or generated imagery when the runtime supports it and the page script authorizes it.
5. A stable native placeholder when no valid visual is available.

Never add snow-mountain/red-paraglider imagery, a mission statement, confidentiality text, a QR code, or a global logo automatically. Never reuse one illustrative image on multiple slides unless it is an intentional background.
