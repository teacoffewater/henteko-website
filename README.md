# ヘンテコ製作所

役に立つかは、つくってから考える。

ページ遷移なしのシングルページ・インタラクティブサイト。作品はコンベアベルトに載って流れてくる。

## 使い方

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ に静的ファイルを出力(GitHub Pages等にそのまま置ける)
```

## 作品を追加する

`src/data/works.ts` に1エントリ足すだけ。

```ts
{
  id: 'my-new-thing',
  title: '新しいヘンテコ',
  description: '説明文。',
  year: '2026',
  image: '/works/my-new-thing.jpg', // 省略するとヨレ線の「?」プレースホルダになる
  link: 'https://...',              // 省略すると「※現地(ローカル)でのみ稼働中」表示
  tags: ['タグ'],
}
```

画像は `public/works/` に置く。800px以下に縮小しておくと軽い:

```bash
sips -Z 800 -s format jpeg -s formatOptions 82 元画像.png --out public/works/my-new-thing.jpg
```

## ロゴ

読み込み時にロゴが3Dプリントされる。レイヤー合成:
文字+サポートが下から積層 → ガイドレール+ノズルが境界と一緒に上昇(ノズルは左右にスキャン)
→ 完了の振動 → ガントリー退場 → サポート+プレートが下に外れて落ち、文字だけ残って完成。

- 表示用アセット(`public/`): `logo.png`(文字)/ `logo-supports.png`(サポート+プレート)/
  `logo-rail.png`(ガイドレール)/ `logo-nozzle.png`(ノズル)。64色パレット化済み
- `logo.png` と `logo-supports.png` は同一キャンバス(1323×639)で位置合わせされている。
  差し替えるときも同一キャンバスで書き出すこと
- 元画像: `assets-src/` に保管

## 隠し要素

- ロゴを3秒以内に5連打すると、作品がベルトから全部落ちる
- `?static=1` を付けると全アニメーション停止(prefers-reduced-motion でも同様)

## 技術メモ

- Vite + React + TypeScript。ランタイム依存は react / react-dom のみ(アニメーションライブラリなし)
- 動きは共有 requestAnimationFrame ループ1本が ref へ直接 transform を書く方式。
  フレーム毎の React 再レンダはゼロ、transform/opacity のみでアニメーション
- ドラッグは Pointer Events(マウス/タッチ統一)+ `touch-action: pan-y` で縦スクロール共存
- ベルトは無限ループ(mod折り返し)、画面外アイテムはスキップ、
  セクションが画面外なら IntersectionObserver で処理停止
