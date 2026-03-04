FROM php:8.3-cli

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    unzip \
    zip \
    libzip-dev \
    libxml2-dev \
    libcurl4-openssl-dev \
    libonig-dev \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-install -j$(nproc) \
    bcmath \
    curl \
    mbstring \
    pdo_mysql \
    xml \
    zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

ENV COMPOSER_ALLOW_SUPERUSER=1
ENV COMPOSER_MEMORY_LIMIT=-1

COPY composer.json composer.lock ./
RUN mkdir -p database
RUN composer install --no-dev --prefer-dist --no-interaction --no-scripts --no-autoloader --ignore-platform-req=ext-fileinfo --ignore-platform-req=ext-tokenizer

COPY . .

RUN composer dump-autoload --no-dev --optimize --no-interaction --ignore-platform-req=ext-fileinfo --ignore-platform-req=ext-tokenizer

RUN mkdir -p \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 8080

CMD ["sh", "-c", "mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views bootstrap/cache && php artisan serve --host=0.0.0.0 --port=${PORT:-8080}"]
