export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Fetch the asset from the ASSETS binding
    let response = await env.ASSETS.fetch(request);

    // If the asset is not found and it's a client-side navigation (no extension),
    // serve index.html to let the React SPA router handle the navigation
    if (response.status === 404 && !url.pathname.includes('.')) {
      const indexRequest = new Request(new URL('/index.html', request.url), request);
      response = await env.ASSETS.fetch(indexRequest);
    }

    return response;
  }
};
