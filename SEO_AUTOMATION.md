# SEO自動化 V1

新規HPの自動生成時に、以下のSEO初期設定を自動で作成します。

- `<title>`
- meta description
- canonical URL
- robots meta
- OGP（title / description / URL / site name / image）
- Twitter Card
- Schema.org `LocalBusiness` のJSON-LD構造化データ
- 各サイトの `sitemap.xml`
- 各サイトの `robots.txt`
- リポジトリ全体の `sitemap.xml`
- リポジトリ全体の `robots.txt`

## URL

GitHub Pages利用時は次の形式をcanonicalとして設定します。

`https://tkda25.github.io/-personal-trainer-site/sites/<slug>/`

将来、独自ドメインを利用する場合はcanonicalとsitemapのベースURLを独自ドメインへ切り替えます。

## テストサイト

slugに `test` を含む検証サイトは `noindex,nofollow` とし、ルートサイトマップから除外します。

## Google Search Console

この自動化はGoogleに読み取られやすいサイト状態を作るところまでです。Google Search Consoleでの所有権確認・サイトマップ送信・URL検査は別途Googleアカウント側で行います。
