export const dynamic = 'force-static'

/*
 * GET /api/docs — public Swagger UI for the Hubnovo API (Campus
 * Competition + Wallet). Reads /api/docs/openapi.json. "Authorize" takes a
 * Supabase access token so developers can call the live endpoints.
 */

const SWAGGER = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14'

const HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Hubnovo API</title>
<link rel="stylesheet" href="${SWAGGER}/swagger-ui.css">
<style>
  body { margin: 0; background: #fff; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
  .band { background: linear-gradient(120deg, #2A1873 0%, #4B2BB8 45%, #00688A 100%); color: #fff; padding: 28px max(16px, env(safe-area-inset-left)) 24px; }
  .band h1 { margin: 0 0 6px; font-size: clamp(26px, 4vw, 38px); }
  .band p { margin: 0; max-width: 72ch; line-height: 1.5; color: #EDEAFF; }
  .band code { background: rgba(255,255,255,.15); padding: 1px 6px; border-radius: 6px; }
  .swagger-ui .wrapper { padding: 0 16px; }
</style>
</head>
<body>
<header class="band">
  <h1>Hubnovo API</h1>
  <p>Campus Competition and Wallet endpoints for the mobile app and web. Click <b>Authorize</b> and paste a Supabase access token (just the token, no <code>Bearer</code>) to try requests against this deployment. Any signed-in Hubnovo account can join the Campus Competition.</p>
</header>
<div id="swagger"></div>
<script src="${SWAGGER}/swagger-ui-bundle.js"></script>
<script>
  SwaggerUIBundle({
    url: '/api/docs/openapi.json',
    dom_id: '#swagger',
    deepLinking: true,
    docExpansion: 'list',
    defaultModelsExpandDepth: 0,
    persistAuthorization: true,
    tryItOutEnabled: false,
    presets: [SwaggerUIBundle.presets.apis],
    layout: 'BaseLayout',
  });
</script>
</body>
</html>`

export function GET()
{
    return new Response(HTML, {
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
    })
}
