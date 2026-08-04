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
        $headers = $this->getHeaders($request);

        // Handle preflight OPTIONS request
        if ($request->getMethod() === "OPTIONS") {
            return response()->json([], 200, $headers);
        }

        $response = $next($request);

        // Add CORS headers to the response (StreamedResponse-safe)
        foreach ($headers as $key => $value) {
            if (method_exists($response, 'header')) {
                $response->header($key, $value);
            } else {
                $response->headers->set($key, $value);
            }
        }

        return $response;
    }

    /**
     * Get CORS headers
     *
     * @return array
     */
    private function getHeaders($request)
    {
        // NUCLEAR OPTION: Explicit origin configuration for credentialed requests
        $allowedOrigins = env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000');
        $allowedMethods = env('CORS_ALLOWED_METHODS', 'GET, POST, PUT, DELETE, OPTIONS');
        $allowedHeaders = env('CORS_ALLOWED_HEADERS', 'Content-Type, Authorization, X-Requested-With, token, client_id, Accept');
        $maxAge = env('CORS_MAX_AGE', '3600');

        // CRITICAL: Extract the actual origin from the request
        $currentOrigin = (string)($request->headers->get('Origin') ?: $request->headers->get('Referer') ?: '');
        
        // Handle comma-separated origins - find exact match
        $origin = '*';
        if ($allowedOrigins !== '*') {
            $originList = array_map('trim', explode(',', $allowedOrigins));
            
            // Find exact match for the current origin
            foreach ($originList as $allowedOrigin) {
                if ($allowedOrigin === $currentOrigin) {
                    $origin = $allowedOrigin;
                    break;
                }
            }
            
            // If no exact match found, use the first allowed origin as fallback
            if ($origin === '*') {
                $origin = $originList[0] ?? '*';
            }
        }

        // CRITICAL: For credentialed requests (which we have due to custom headers),
        // we MUST use explicit origin and MUST allow credentials
        $headers = [
            'Access-Control-Allow-Origin' => $origin,
            'Access-Control-Allow-Methods' => $allowedMethods,
            'Access-Control-Allow-Headers' => $allowedHeaders,
            'Access-Control-Max-Age' => $maxAge,
            'Access-Control-Allow-Credentials' => 'true', // REQUIRED for credentialed requests
        ];

        return $headers;
    }
}
