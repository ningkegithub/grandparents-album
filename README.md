# grandparents-album

爷爷奶奶的时光相册 —— 宁重瑛 · 刘庆芬（2004 — 2026）

线上地址：https://ningkegithub.github.io/grandparents-album/

## 结构

- `index.html` —— 封面 + 相册骨架（引用时请带 `?v=` 缓存参数）
- `album.css` / `album.js` —— 样式与交互（查看器、年份跳转、滑动切图、加载重试）
- `photos.js` —— 全站数据源：`const PHOTOS = [...]`，每条含 id/src/thumb/when/title/desc/quality/width/height
- `photos/` —— 大图（长边约 2048px）
- `thumbs/` —— 缩略图
- `music/bgm.mp3` —— 背景音乐（Kevin MacLeod · CC BY 3.0）

## 维护约定

- 加照片：往 `photos/`、`thumbs/` 放文件，并在 `photos.js` 按时间顺序插入一条记录；同步更新 `index.html` 里的" N 张照片"计数，并刷新 `photos.js` 的 `?v=` 缓存参数。
- 删照片：从 `photos.js` 移除记录后，记得同时删除 `photos/` 与 `thumbs/` 下的对应文件，避免留下孤儿文件。
- 去重标准：连拍只留最好一张（放大比较脸部、表情、遮挡、构图）。
- 描述标准：地点、人物、事件交代清楚，不写笼统话；日期由 `when` 字段单独显示，正文不重复；关键家人具名；认不准不编造。
- 方向修正：用 EXIF 无损转正后，在 `src`/`thumb` 后加 `?v=uprightN` 刷新缓存。

## 历史

- 2026-10-01：Dot（OpenAI agent）初建，413 张上线。
- 2026-10-03：Muse 复核，加回 26 张遗漏照片（总数 439），删除 17 组连拍重复的孤儿文件。
