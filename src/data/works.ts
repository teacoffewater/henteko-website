// 作品データ。新しい作品を追加するときはこのファイルだけ編集すればよい。
// image を省略するとヨレ線の「?」プレースホルダが描かれる。
// link を省略すると詳細に「※現地(ローカル)でのみ稼働中」と表示される。

export type Work = {
  id: string
  title: string
  description: string
  year: string
  /** 例: "/works/goblin-ear.jpg"(public/works/ に置く) */
  image?: string
  /** 追加の画像(詳細表示で使用) */
  images?: string[]
  link?: string
  tags: string[]
}

export const works: Work[] = [
  {
    id: 'umeda-dungeon',
    title: '梅田ダンジョン 3Dナビ',
    description:
      '日本一複雑と噂の梅田地下街(B1/B2)を3Dマップで攻略するナビ。出発地と目的地の店舗を選ぶと、エレベーター・エスカレーター・階段を考慮したルートを3Dマップ上に描き、店舗をランドマークにした道順を日本語で案内する。',
    year: '2026',
    tags: ['Three.js', '3Dナビ', '地下街'],
  },
  {
    id: 'kawasaki-dungeon',
    title: '川崎ダンジョン 3Dナビ',
    description:
      '梅田ダンジョンの兄弟プロジェクト。川崎の地下街・駅ビル網を3Dマップ化し、店舗から店舗への道順をランドマーク付きで案内する。',
    year: '2026',
    tags: ['Three.js', '3Dナビ', '地下街'],
  },
  {
    id: 'goblin-ear',
    title: 'ゴブリンの耳イヤリング',
    description:
      '耳につけるための、耳。Blenderでスカルプトしたゴブリンの耳をイヤリングにした3Dモデル。つけると耳が4つになる。',
    year: '2026',
    image: '/works/goblin-ear.jpg',
    images: ['/works/goblin-ear.jpg', '/works/goblin-ear-2.jpg'],
    tags: ['Blender', '3Dモデル', 'アクセサリー'],
  },
]
