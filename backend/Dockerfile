# 1. 軽量で安定している公式のPHPイメージを使う
FROM php:8.3-fpm-alpine

# 2. 必要なライブラリだけ入れる（PostgreSQL用など）
RUN apk add --no-cache \
    postgresql-dev \
    libpng-dev \
    zip \
    libzip-dev \
    unzip

# 3. PHPの拡張機能をインストール
RUN docker-php-ext-install pdo_pgsql gd zip

# 4. 作業ディレクトリの設定
WORKDIR /var/www/html

# 5. ファイルをコピー
COPY . .

# 6. Composerのインストール（マルチステージビルドから拝借）
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
RUN composer install --no-dev --optimize-autoloader

# 7. 権限設定
RUN chmod -R 777 storage bootstrap/cache

# 8. 起動（開発サーバーモード）
CMD php artisan serve --host=0.0.0.0 --port=$PORT