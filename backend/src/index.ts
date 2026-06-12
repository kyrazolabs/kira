import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import type { Auth } from './auth'
import { configRoutes } from './routes/config'
import { usageRoutes } from './routes/usage'
import { enhanceRoutes } from './routes/enhance'

export function createApp(auth: Auth) {
  return new Elysia()
    .decorate('auth', auth)

    .use(cors({
      origin: ['http://localhost:5173', 'http://localhost:3000',
        ...(process.env.EXTENSION_ID ? [`chrome-extension://${process.env.EXTENSION_ID}`] : [])
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }))

    .get('/api/health', () => ({
      status: 'ok',
      timestamp: new Date().toISOString()
    }))

    .get('/', () => new Response(null, {
      status: 302,
      headers: { Location: 'http://localhost:5173' }
    }))

    .mount(auth.handler)

    .use(configRoutes(auth))
    .use(usageRoutes(auth))
    .use(enhanceRoutes(auth))
}

export type App = ReturnType<typeof createApp>
