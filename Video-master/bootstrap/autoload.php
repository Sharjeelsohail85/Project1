<?php

define('LARAVEL_START', microtime(true));

// Laravel 5.4 on modern PHP (8.x) can emit a large number of deprecation
// notices that this legacy framework converts into exceptions during bootstrap.
// Suppress deprecation-level notices so the app can boot on newer runtimes.
error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);

// Some runtime environments expose mbstring but still miss mb_split.
// Laravel's Str::studly() depends on mb_split, so provide a safe
// UTF-8-aware fallback to keep the app bootable.
if (!function_exists('mb_split')) {
    /**
     * @param string $pattern
     * @param string $string
     * @param int $limit
     * @return array<int, string>
     */
    function mb_split($pattern, $string, $limit = -1)
    {
        $delimiter = '~';
        $escapedPattern = str_replace($delimiter, '\\'.$delimiter, (string) $pattern);
        $regex = $delimiter.$escapedPattern.$delimiter.'u';

        $parts = preg_split($regex, (string) $string, (int) $limit);

        return $parts === false ? [(string) $string] : $parts;
    }
}

/*
|--------------------------------------------------------------------------
| Register The Composer Auto Loader
|--------------------------------------------------------------------------
|
| Composer provides a convenient, automatically generated class loader
| for our application. We just need to utilize it! We'll require it
| into the script here so we do not have to manually load any of
| our application's PHP classes. It just feels great to relax.
|
*/

require __DIR__.'/../vendor/autoload.php';
