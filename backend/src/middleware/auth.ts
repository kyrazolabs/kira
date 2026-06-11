import { Elysia } from 'elysia'
import type { Auth } from '../auth'

export function sessionAuth(auth: Auth) {
  return new Elysia({ name: 'session-auth' })
    .macro({
      auth: {
        async resolve({ error, request: { headers } }) {
          const session = await auth.api.getSession({ headers })

          if (!session?.user) {
            return error(401, { error: 'Authentication required' })
          }

          return {
            userId: session.user.id,
            session: session
          }
        }
      }
    })
}

export function apiKeyAuth(auth: Auth) {
  return new Elysia({ name: 'api-key-auth' })
    .macro({
      auth: {
        async resolve({ error, request: { headers } }) {
          const authHeader = headers.get('authorization')

          if (!authHeader?.startsWith('Bearer ')) {
            return error(401, { error: 'API key required. Use Authorization: Bearer <key>' })
          }

          const key = authHeader.slice(7)

          try {
            const result = await auth.api.verifyApiKey({
              body: { key }
            })

            if (!result.valid || !result.key) {
              return error(401, { error: result.error?.message || 'Invalid API key' })
            }

            return { userId: result.key.userId }
          } catch {
            return error(401, { error: 'Invalid API key' })
          }
        }
      }
    })
}
