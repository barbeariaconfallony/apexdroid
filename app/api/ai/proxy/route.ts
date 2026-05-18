import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { url, method = 'GET', headers = {}, body } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store'
    }).catch(err => {
      console.error(`Proxy Fetch Error (${url}):`, err.message)
      throw new Error(`Conexão recusada em ${url}. Certifique-se que o serviço está rodando.`)
    })

    const data = await response.json().catch(() => ({}))
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: data.error || `Erro HTTP ${response.status}`,
        details: data
      }, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Proxy error:', error)
    return NextResponse.json({ error: error.message || 'Proxy request failed' }, { status: 500 })
  }
}
