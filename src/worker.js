export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
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
