// src/worker.js
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    let response = await env.ASSETS.fetch(request);
    if (response.status === 404 && !url.pathname.includes(".")) {
      const indexRequest = new Request(new URL("/index.html", request.url), request);
      response = await env.ASSETS.fetch(indexRequest);
    }
    return response;
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
