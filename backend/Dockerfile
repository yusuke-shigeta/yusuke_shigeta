# 1. PHP 8.4 の公式イメージに変更（ここが重要！）
FROM php:8.4-fpm-alpine

# 2. 必要なライブラリを入れる
RUN apk add --no-cache \
    postgresql-dev \
    libpng-dev \
    zip \
    libzip-dev \
    unzip \
    oniguruma-dev \
    icu-dev

# 3. PHPの拡張機能をインストール
RUN docker-php-ext-install pdo_pgsql gd zip mbstring intl

# 4. 作業ディレクトリの設定
WORKDIR /var/www/html

# 5. ファイルをコピー
COPY . .

# 6. Composerのインストール
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
RUN composer install --no-dev --optimize-autoloader

# 7. 権限設定
RUN chmod -R 777 storage bootstrap/cache

# 8. 起動
CMD php artisan serve --host=0.0.0.0 --port=$PORT