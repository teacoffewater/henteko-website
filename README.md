# ヘンテコ製作所

役に立つかは、つくってから考える。

スクロールなしの1画面シーン制インタラクティブサイト。
浮遊するメニュー(「つくったもの」「つくっているひと」)をタッチすると、
その点から白いワイプが広がってシーンが切り替わり、コンテンツがタッチ点から飛び出して配置される。

- home : ロゴが3Dプリントされる(初回のみ自動再生)
- works: 作品カードが散らばり配置。掴んで自由に動かせる(慣性つき)
- about: 製造者銘板風のプロフィール(`src/data/profile.ts` を編集)

## 公開URL

**https://teacoffewater.github.io/henteko-website/** (GitHub Pages)

## 使い方

```bash
npm install
npm run dev      # http://localhost:5173 (--host付きなので同一Wi-FiのスマホからもMacのIPで見られる)
npm run build    # dist/ に静的ファイルを出力
npm run deploy   # ビルドして gh-pages ブランチへ公開(GitHub Pagesに反映)
```

コード変更を公開に反映する手順: `git push`(ソース保存)+ `npm run deploy`(サイト更新)。

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

- ロゴを3秒以内に5連打すると、プリントアニメーションをもう一度再生する
- `?static=1` を付けると全アニメーション停止(prefers-reduced-motion でも同様)

## 技術メモ

- Vite + React + TypeScript。ランタイム依存は react / react-dom のみ(アニメーションライブラリなし)
- 動きは共有 requestAnimationFrame ループ1本が ref へ直接 transform を書く方式。
  フレーム毎の React 再レンダはゼロ、transform/opacity のみでアニメーション
- ドラッグは Pointer Events(マウス/タッチ統一)。ページ自体はスクロールしない(html/body固定)
- シーン遷移の白ワイプは `clip-path: circle()` のワンショットCSS transition
