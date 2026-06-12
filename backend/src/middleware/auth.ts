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
