import { describe, it, expect } from 'bun:test'
import { Elysia } from 'elysia'

// Create a minimal test app without MongoDB
const testApp = new Elysia()
  .get('/api/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))

describe('API routes', () => {
  it('GET /api/health returns ok', async () => {
    const res = await testApp.handle(new Request('http://localhost/api/health'))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.status).toBe('ok')
  })

  it('returns 404 for unknown routes', async () => {
    const res = await testApp.handle(new Request('http://localhost/api/nonexistent'))
    expect(res.status).toBe(404)
  })
})
