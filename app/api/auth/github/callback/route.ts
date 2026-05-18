import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error || !code) {
    // Fechar popup com erro
    return new NextResponse(
      `<html><body><script>
        window.opener?.postMessage({ type: 'github-oauth-error', error: '${error || "No code received"}' }, '*');
        window.close();
      </script></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    )
  }

  try {
    // Trocar o code pelo access_token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error || !tokenData.access_token) {
      throw new Error(tokenData.error_description || "Failed to get access token")
    }

    const accessToken = tokenData.access_token

    // Buscar dados do usuário para confirmar
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    })
    const userData = await userResponse.json()

    // Enviar token e user de volta para a janela pai via postMessage e fechar popup
    return new NextResponse(
      `<html>
        <body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0d1117;color:#fff;">
          <div style="text-align:center;padding:2rem;">
            <div style="font-size:3rem;margin-bottom:1rem;">✅</div>
            <h2 style="margin:0 0 0.5rem;font-size:1.25rem;">Conectado com sucesso!</h2>
            <p style="color:#8b949e;font-size:0.875rem;">Conectado como @${userData.login}. Fechando...</p>
          </div>
          <script>
            window.opener?.postMessage({
              type: 'github-oauth-success',
              token: '${accessToken}',
              user: '${userData.login}'
            }, '*');
            setTimeout(() => window.close(), 1200);
          </script>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return new NextResponse(
      `<html><body style="font-family:system-ui;background:#0d1117;color:#fff;padding:2rem;">
        <h2>❌ Erro na autenticação</h2>
        <p style="color:#f85149">${message}</p>
        <script>
          window.opener?.postMessage({ type: 'github-oauth-error', error: '${message}' }, '*');
          setTimeout(() => window.close(), 3000);
        </script>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    )
  }
}
