# Mermaidダイアグラム例

このドキュメントにはさまざまなMermaidダイアグラムの例が含まれています。

## シーケンス図（Sequence Diagram）

```mermaid
sequenceDiagram
    autonumber
    participant ブラウザ
    participant API
    participant DB

    ブラウザ->>API: ユーザー情報リクエスト
    API->>DB: SQLクエリ実行
    DB->>API: ユーザーデータ
    API->>ブラウザ: JSONレスポンス
    
    alt データが見つからない場合
        API->>ブラウザ: 404エラー
    else 権限エラーの場合
        API->>ブラウザ: 403エラー
    end
```

## フローチャート（Flowchart）

```mermaid
flowchart TD
    A[スタート] --> B{ユーザー登録済み?}
    B -->|Yes| C[ダッシュボード表示]
    B -->|No| D[登録フォーム表示]
    D --> E[ユーザー情報入力]
    E --> F{入力は有効?}
    F -->|Yes| G[ユーザー作成]
    F -->|No| E
    G --> C
```

## ガントチャート（Gantt Chart）

```mermaid
gantt
    title プロジェクト開発計画
    dateFormat  YYYY-MM-DD
    section 計画フェーズ
    要件定義           :a1, 2025-05-01, 10d
    設計               :a2, after a1, 15d
    section 開発フェーズ
    コーディング       :a3, after a2, 25d
    テスト             :a4, after a3, 12d
    section リリースフェーズ
    デプロイ準備       :a5, after a4, 5d
    リリース           :milestone, after a5, 0d
```

## クラス図（Class Diagram）

```mermaid
classDiagram
    class ドキュメント {
      +int id
      +String タイトル
      +String 内容
      +Date 作成日時
      +作成()
      +更新()
      +削除()
    }
    
    class プロジェクト {
      +int id
      +String 名前
      +Date 作成日時
      +ドキュメント[] ドキュメント一覧
      +ドキュメント追加()
    }
    
    プロジェクト "1" *-- "多" ドキュメント : 含む
```

## 状態図（State Diagram）

```mermaid
stateDiagram-v2
    [*] --> 未着手
    未着手 --> 作業中 : 担当者が作業開始
    作業中 --> レビュー中 : 作業完了
    レビュー中 --> 作業中 : 修正依頼
    レビュー中 --> 完了 : 承認
    完了 --> [*]
```

## 円グラフ（Pie Chart）

```mermaid
pie title プロジェクト予算配分
    "開発" : 50
    "マーケティング" : 20
    "運用" : 15
    "研修" : 10
    "予備" : 5
```