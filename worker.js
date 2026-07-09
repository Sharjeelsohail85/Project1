export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // If it's an API route, handle it
    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Try to serve the exact asset
    try {
      const response = await env.ASSETS.fetch(request);
      // If the response is a 404, we want to return index.html for SPA routing
      if (response.status === 404) {
        const indexRequest = new Request(new URL('/index.html', request.url), request);
        return env.ASSETS.fetch(indexRequest);
      }
      return response;
    } catch (e) {
      // Fallback to index.html for SPA routing
      const indexRequest = new Request(new URL('/index.html', request.url), request);
      return env.ASSETS.fetch(indexRequest);
    }
  }
}
