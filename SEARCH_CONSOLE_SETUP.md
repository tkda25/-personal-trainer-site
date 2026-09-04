# Google Search Console 運用

## 目的
自動生成した各サイトを Google Search Console に登録し、所有権確認・サイトマップ送信・インデックス確認まで行うための運用手順です。

## 自動化されるもの
- Google 所有権確認用 meta タグの埋め込み（確認コード入力時）
- canonical / meta description / OGP / JSON-LD
- 各サイトの `sitemap.xml`
- 各サイトの `robots.txt`
- 公開URLとサイトマップURLの生成

## 手動操作が必要なもの
Google アカウントで Search Console にログインし、URLプレフィックスのプロパティ追加と所有権確認を行います。

1. Search Console で新しい「URL プレフィックス」プロパティを追加
2. 自動生成された公開URLを入力
3. 「HTML タグ」を選択
4. `content="..."` の中身だけをヒアリングフォームの「Google Search Console 確認コード」に入力
5. HPを生成・公開
6. Search Console に戻って「確認」
7. 「サイトマップ」で `sitemap.xml` を送信
8. 「URL検査」でトップページを確認し、必要に応じてインデックス登録をリクエスト

## 注意
- 確認用 meta タグは所有権維持のため削除しないでください。
- テスト用 slug（`test` を含むもの）は noindex のため Search Console 本番登録対象にしません。
- インデックス登録や検索順位は Google の判断であり、保証されません。
