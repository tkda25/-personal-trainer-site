# HP自動生成・公開フロー

## 完成後の流れ

1. GitHubのIssuesから「新規HP自動作成」を選ぶ
2. クライアント情報を入力してIssueを作成する
3. `new-site` ラベルを検知してGitHub Actionsが起動する
4. `sites/<slug>/` に以下を自動生成する
   - index.html
   - style.css
   - script.js
   - site.config.js
   - README.md
5. 自動コミット後、GitHub Pagesが再デプロイされる
6. `https://tkda25.github.io/-personal-trainer-site/sites/<slug>/` で公開される

## 注意

- この仕組みはテンプレートV1とフォーム生成V1がmainに入った後に動作します。
- Site slugは英小文字・数字・ハイフンのみです。
- 同じslugが既にある場合は上書きせず停止します。
- GitHub PagesのSourceはGitHub Actionsを使用してください。
- クライアント本人にGitHub Issueを書かせず、ヒアリング結果を運営側で入力する運用でも使えます。
