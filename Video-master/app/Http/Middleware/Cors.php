<?php

namespace App\Http\Middleware;

use Closure;

class Cors
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        // Handle preflight OPTIONS request
        if ($request->getMethod() === "OPTIONS") {
            return response()->json([], 200, $this->getHeaders());
        }

        $response = $next($request);

        // Add CORS headers to the response
        foreach ($this->getHeaders() as $key => $value) {
            $response->header($key, $value);
        }

        return $response;
    }

    /**
     * Get CORS headers
     *
     * @return array
     */
    private function getHeaders()
    {
        $allowedOrigins = env('CORS_ALLOWED_ORIGINS', '*');
        $allowedMethods = env('CORS_ALLOWED_METHODS', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        $allowedHeaders = env('CORS_ALLOWED_HEADERS', 'Content-Type, Authorization, X-Requested-With, token, client_id');
        $maxAge = env('CORS_MAX_AGE', '3600');

        $headers = [
            'Access-Control-Allow-Origin' => $allowedOrigins,
            'Access-Control-Allow-Methods' => $allowedMethods,
            'Access-Control-Allow-Headers' => $allowedHeaders,
            'Access-Control-Max-Age' => $maxAge,
        ];

        // Only set credentials if not using wildcard origin
        if ($allowedOrigins !== '*') {
            $headers['Access-Control-Allow-Credentials'] = 'true';
        }

        return $headers;
    }
}
