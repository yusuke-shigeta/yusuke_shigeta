# yusuke_shigeta

- [環境について](#環境について)
  - [なぜこの構成にしたのか](#なぜこの構成にしたのか)
- [環境構築](#環境構築)
  - [事前準備](#事前準備)
  - [手順](#手順)
  - [詳細](#詳細)
- [リリース](#リリース)
  - [手順](#手順-1)
- [コマンド](#コマンド)

## 環境について

**Next.js + Headless Laravel（Docker構成）**

### なぜこの構成にしたのか

1. ユーザー体験（UX）の極致を追求するため

   従来のLaravelのみ（Blade）で作るCMSは、ページ遷移のたびに画面が白く光り、読み込みが発生する。

   Next.jsを採用する理由: 「App Router」と「キャッシュ戦略」により、爆速のページ遷移を実現できる。一度サイトに入れば、まるでスマホアプリを触っているようなヌルヌルとした操作感を提供できる。

   SEOと速度の両立: CMSにとって命であるSEO（検索エンジン最適化）において、Next.jsのサーバーサイドレンダリング（SSR）は最強の武器になる。

2. 開発効率と「型」による安全性

   「とりあえず動く」ではなく「壊れない」システムを作るための選択。

   LaravelをAPIに専念させる理由: Laravelはデータの保存や認証（ログイン管理）において世界一洗練されたフレームワークの一つです。ここにビジネスルールを集中させることで、裏側を盤石にする。

   TypeScriptによる保護: フロントエンドにNext.js（TypeScript）を使うことで、「データが足りなくて画面が真っ白になる」といったケアレスミスを、プログラムを実行する前に防げる。

   Dockerによる再現性: 「PCを壊したくない」という想いは、実は「本番環境で確実に動くものを作る」というプロの意識に繋がる。自分の環境に依存しない開発スタイルは、エンジニアとしての信頼性に直結する。

3. 「将来の拡張性」という資産価値

   マルチデバイス対応: 今回作ったLaravel APIは、将来的に「スマホアプリ」や「スマートウォッチ」「他サイトへのデータ配信」が必要になった際、そのまま「共通のサーバー」として使える。Bladeで作ってしまうと、アプリ化の際にまた一からAPIを作り直すことになり、コストが2倍かかる。

   市場価値の高いスキル: Next.js + Headless Laravelは、現在最も需要が高いモダンな構成の一つです。この仕組みを理解して構築したという実績は、単なるWebサイト制作以上の評価に繋がる。

## 環境構築

### 事前準備

- Docker Desktopのインストール
- Node.jsのインストール

### 手順

1. 開発環境の全体

   Dockerコンテナの中に「PHP/Laravel」「データベース」「Redis」などを閉じ込める。
   Next.jsは、まずは手軽にローカル（自分のPC）で動かして、Laravelコンテナと通信させるのが一般的でスムーズ。

2. Laravel Sailで環境を構築する（所要時間：3分）

   ```bash
   # プロジェクト作成（DBはMySQLを指定）
   curl -s "https://laravel.build/backend?with=mysql,redis" | bash
   ```

3. 起動

   ```bash
   cd backend
   ./vendor/bin/sail up -d
   ```

   これで、http://localhost にアクセスするとLaravelの画面が出る。PCにはDocker以外何もインストールされていない。

   💡 ヒント: 毎回 ./vendor/bin/sail と打つのは面倒なので、alias sail="./vendor/bin/sail" と設定しておくと、次から sail up だけで起動できるようになる。

   テーブルがないよってエラーが出たら以下を叩いてみる

   ./vendor/bin/sail artisan migrate

4. Next.jsを準備する

   Laravelコンテナが動いている状態で、別のターミナルを開き、Laravelの「外側」にNext.jsを作る。

   ```bash
   npx create-next-app@latest frontend
   # 設定はすべてYes（TypeScript, App Router, Tailwind CSS）
   ```

5. コンテナと通信するための「魔法の設定」

   ここが一番のポイント。
   Docker（Laravel）とローカル（Next.js）は「住んでいる世界」が違うので、
   Next.jsからLaravelにアクセスする際は、Laravel側で「CORS（通信許可）」の設定が必要。

   ① Laravel側の設定 (backend/.env)
   Next.js（ポート3000）からの通信を許可。

   ```
   APP_URL=http://localhost
   FRONTEND_URL=http://localhost:3000
   ```

   ② APIの疎通確認
   Laravel側でAPIを作る。

   ```bash
   # コンテナの中でコマンドを実行
   docker exec -it backend-laravel.test-1 bash
   php artisan install:api
   ```

   routes/api.php にテスト用コードを書く。

   ```php
   // backend/routes/api.php
   Route::get('/test', function () {
       return ['status' => 'success', 'message' => 'DockerのLaravelと繋がったよ！'];
   });
   ```

6. Next.jsからデータを取ってくる

   frontend/src/app/page.tsx を以下のように書き換えて、ブラウザで http://localhost:3000 を確認。

   ```tsx
   export default async function Home() {
     // Docker内のLaravel APIを叩く
     const res = await fetch("http://localhost/api/test", {
       cache: "no-store",
     });
     const data = await res.json();

     return (
       <main className="p-24">
         <h1 className="text-2xl font-bold">Next.js + Docker Laravel</h1>
         <p className="mt-4 p-4 bg-gray-100 rounded">{data.message}</p>
       </main>
     );
   }
   ```

   `npm run dev`で起動

### 詳細

「ポート（Port）」という通信の窓口と、「CORS」というセキュリティの壁を正しく設定する。

1. 通信の仕組み（ポート番号の役割）

   PCの中では、LaravelとNext.jsがそれぞれ別の「住所（ポート番号）」で待機している状態。

   Laravel（Docker内）: ポート 80 で待機

   sail up をしたとき、Dockerが「Macのポート80番に届いた通信を、コンテナ内のLaravelに転送する」という設定を自動でしてくれる。

   Next.js（ローカル）: ポート 3000 で待機

   npm run dev をすると、Next.jsが3000番を使って画面を表示する。

   Next.jsのコードで fetch("http://localhost/api/test") と書くと、「自分自身（localhost）の80番（Laravel）にデータをちょうだい！」とリクエストを投げていることになる。

2. なぜ .env の設定が必要だったのか？

   ブラウザには「違う住所（ポート）同士の通信は、相手が許可していない限り拒否する」という厳しいルール（CORS）がある。

   Next.js: http://localhost:3000

   Laravel: http://localhost (ポート80は省略可能)

   この2つは、ブラウザから見ると「別のサイト」扱い。そのため、Laravel側の .env で FRONTEND_URL=http://localhost:3000 と設定することで、Laravelが「3000番さん（Next.js）からのリクエストなら、データを通してもいいよ！」と許可証を発行した状態になった。

3. まとめ：繋がった理由

   Dockerが、Macの80番ポートをLaravelに繋いでくれたから。

   Next.jsが、その80番ポート（localhost）に向けてFetchを送ったから。

   Laravelが、CORS設定によってNext.js（3000番）からの通信を許可したから。

## リリース

### 手順

1. Supabaseで無料DBを作る

   クラウド上に無料のデータベースを用意する。

   ①[Supabase](https://supabase.com/)
   にアクセスして、GitHubアカウントでログイン。

   ②「New Project」を作成（プロジェクト名は yusuke-cms など適当でOK）。

   ③データベースのパスワードを設定（必ずメモしておいてください！）。

   ④プロジェクトが作成されたら、設定画面（Settings > Database）から Connection String を探します。

2. Laravel（Docker側）の設定を変える

   Supabaseが用意できたら、Docker内のLaravelからそこへ接続できるか試してみましょう。
   backend/.env の設定を、Supabaseで取得した情報に書き換えます。

   Connect > Connect to your project画面のConnection Stringタブ
   MethodをTransaction poolerに変更
   View parametersからDB接続情報を取得

   書き換えたら、いつもの魔法のコマンドを叩いてみてください。

   ```bash
   docker exec -it backend-laravel.test-1 bash
   php artisan migrate
   ```

   これで、「MacのDockerで動いているLaravel」が「クラウド上のデータベース」にテーブルを作りにいくという、エキサイティングな連携が始まります！

3. テスト用のユーザーを作成してみる

   ```bash
   # テスト用のユーザーを作成してみる
   php artisan tinker

   # Tinkerが起動したら以下を入力してEnter
   User::factory()->create(['name' => 'Yusuke Shigeta', 'email' => 'test@example.com']);

   # 終わったら exit
   exit
   ```

   これでSupabaseの管理画面（Table Editor）の users テーブルを見てください。あなたの名前が刻まれていれば完璧です！

4. Laravelを Render.com にデプロイする

   Renderは、GitHubのリポジトリを指定するだけで、自動的にDockerコンテナをビルドして公開してくれる非常に便利なサービスです。

   ①Renderにログインして新規作成
   [Render.com](https://render.com/)にアクセスし、GitHubでログイン。

   「+ New」 ボタン ＞ 「Web Service」 をクリック。

   今回の GitHub リポジトリ（yusuke_shigeta）を選択して 「Connect」。

   ②インポート設定（ここが重要！）
   設定画面が開いたら、以下のように入力してください。

   ※以下をbackend直下にコピーする
   backend/vendor/laravel/sail/runtimes/8.5/Dockerfile
   backend/vendor/laravel/sail/runtimes/8.5/start-container
   backend/vendor/laravel/sail/runtimes/8.5/php.ini
   backend/vendor/laravel/sail/runtimes/8.5/supervisord.conf

   git pushしておく

   Name: yusuke_shigeta (何でもOK)

   Region: Singapore (日本に一番近いです)

   Branch: main

   Root Directory: backend (ここを間違えないように！)

   Runtime: Docker

   Root Directory: backend

   Dockerfile Path: Dockerfile （backend/ は含めない）

   ※Renderが自動的に backend/Dockerfile を見つけてくれます。

   ③環境変数（Environment Variables）の設定
   画面の下の方にある 「Environment Variables」 に、先ほど Supabase に繋いだ時の設定を全て入力します。これがないと、本番のLaravelがDBを見つけられません。
   .envファイルを参照。する

5. Next.jsをVercelにデプロイする

   いよいよ「表側」を公開します。ここからはブラウザ操作がメインです。

   [Vercel](https://vercel.com/) にアクセスし、GitHubアカウントでログイン。

   「Add New」 > 「Project」 を選択。

   今回の yusuke_shigeta リポジトリを選択（Import）。

   重要：Root Directory の設定で、frontend ディレクトリを選択してください。

   「Deploy」 ボタンをポチッと押す！

   これで数分待つと、https://yusuke-cms.vercel.app のような あなた専用のURL が発行されます。世界中の誰でも見れるようになります。

## コマンド

- コンテナに入る
  - `docker exec -it backend-laravel.test-1 bash`
