import { Elysia } from 'elysia'
import type { Auth } from '../auth'

export function sessionAuth(auth: Auth) {
  return new Elysia({ name: 'session-auth' })
    .macro({
      auth: {
        async resolve({ request: { headers }, set }) {
          const session = await auth.api.getSession({ headers })

          if (!session?.user) {
            set.status = 401
            return { userId: null }
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
        async resolve({ request: { headers }, set }) {
          const authHeader = headers.get('authorization')

          if (!authHeader?.startsWith('Bearer ')) {
            set.status = 401
            return { userId: null }
          }

          const key = authHeader.slice(7)

          try {
            const result = await auth.api.verifyApiKey({
              body: { key }
            })

            if (!result.valid || !result.key) {
              set.status = 401
              return { userId: null }
            }

            return { userId: result.key.userId }
          } catch {
            set.status = 401
            return { userId: null }
          }
        }
      }
    })
}
