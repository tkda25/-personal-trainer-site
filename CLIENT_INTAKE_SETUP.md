# クライアント入力フォーム運用手順

## 目的
クライアントにはGitHubを見せず、通常の入力フォームだけを渡します。

フォーム送信後はサーバー側APIがGitHub Issueを作成し、既存の `[NEW SITE]` 自動生成ワークフローへ接続します。

## 構成

- `client/index.html` : クライアント向け入力フォーム
- `api/new-site.js` : GitHub Issueを作るサーバーAPI
- `vercel.json` : `/` でクライアントフォームを表示

## 必要な環境変数

デプロイ先のEnvironment Variablesに以下を設定します。

- `GITHUB_SITE_TOKEN`
  - GitHub Issueを作成できるトークン
  - ブラウザ側には絶対に書かない
- `FORM_ACCESS_CODE`
  - クライアントへ案内するフォーム送信用コード
- `GITHUB_OWNER`
  - `tkda25`
- `GITHUB_REPO`
  - `-personal-trainer-site`

## 動作フロー

1. クライアントがフォームへ入力
2. `/api/new-site` へ送信
3. サーバー側でアクセスコード・必須項目・slugを検証
4. GitHub APIで `[NEW SITE] 屋号` のIssueを作成
5. GitHub ActionsがIssueを検知
6. `sites/<slug>/` を自動生成
7. GitHub Pagesへ自動公開

## セキュリティ

- GitHubトークンはサーバーの環境変数だけに保存
- フォームにはhoneypotを設置
- slugは英小文字・数字・ハイフンのみ許可
- サーバー側でも全必須項目を再検証
- 同一slugの上書き防止は既存GitHub Actions側で実施

## 次の改善候補

- Cloudflare TurnstileなどのBOT対策
- 送信完了メール
- 管理者への通知
- 写真アップロード
- 申込ステータス管理
