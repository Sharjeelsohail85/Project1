export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Serve dynamic OneDrive and Azure configuration
    if (url.pathname === '/api/onedrive-config') {
      return new Response(JSON.stringify({
        clientId: env.VITE_ONEDRIVE_CLIENT_ID || 'fac31fe1-c18e-4894-aa70-6589ae18d996',
        tenantId: env.VITE_ONEDRIVE_TENANT_ID || 'common',
        primaryDomain: env.VITE_ONEDRIVE_PRIMARY_DOMAIN || 'sharjeelsohail85gmail.onmicrosoft.com',
        name: env.VITE_ONEDRIVE_NAME || 'Default Directory',
        license: env.VITE_ONEDRIVE_LICENSE || 'Microsoft Entra ID Free'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*'
        }
      });
    }

    // Intercept MEGA API/upload requests to proxy them and add CORS headers
    if (url.pathname.startsWith('/api/mega-proxy')) {
      // CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Expose-Headers': '*',
            'Access-Control-Max-Age': '86400',
          }
        });
      }

      // Determine target URL
      let targetUrl = '';
      const urlParam = url.searchParams.get('url');
      if (urlParam) {
        targetUrl = urlParam;
      } else {
        // e.g. /api/mega-proxy/cs?id=... -> https://g.api.mega.co.nz/cs?id=...
        const pathSuffix = url.pathname.slice('/api/mega-proxy'.length);
        targetUrl = 'https://g.api.mega.co.nz' + pathSuffix + url.search;
      }

      try {
        const targetUrlObj = new URL(targetUrl);
        const headers = new Headers(request.headers);
        headers.set('Host', targetUrlObj.host);
        headers.delete('Origin');
        headers.delete('Referer');

        // Forward request
        const proxyResponse = await fetch(targetUrl, {
          method: request.method,
          headers,
          body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.arrayBuffer() : undefined,
          redirect: 'follow'
        });

        const responseHeaders = new Headers(proxyResponse.headers);
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        responseHeaders.set('Access-Control-Allow-Headers', '*');
        responseHeaders.set('Access-Control-Expose-Headers', '*');

        return new Response(proxyResponse.body, {
          status: proxyResponse.status,
          statusText: proxyResponse.statusText,
          headers: responseHeaders
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    // We can first try to fetch the asset
    let response = await env.ASSETS.fetch(request);
    
    // If it's a 404 and doesn't have a file extension (e.g. not a .js or .css or image),
    // serve index.html for SPA routing
    if (response.status === 404 && !url.pathname.includes('.')) {
      const indexRequest = new Request(new URL('/index.html', request.url), request);
      response = await env.ASSETS.fetch(indexRequest);
    }
    
    return response;
  }
};
