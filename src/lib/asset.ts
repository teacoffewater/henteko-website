// public/ 配下のアセットURLをベースパス(GitHub Pagesのサブパス等)込みで解決する。
// データやJSX内の "/works/..." のような絶対パス文字列はViteのbase書き換え対象外なので、
// 実行時にこの関数を通す。

export function asset(path: string): string {
  return import.meta.env.BASE_URL + path.replace(/^\//, '')
}
