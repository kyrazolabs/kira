import { Elysia, t } from 'elysia'
import type { Auth } from '../auth'
import { sessionAuth } from '../middleware/auth'
import { UsageEvent } from '../models/usage'

const eventBody = t.Object({
  platform: t.String(),
  tone: t.String(),
  eventType: t.Union([
    t.Literal('enhance_requested'),
    t.Literal('enhance_success'),
    t.Literal('enhance_error')
  ]),
  textLength: t.Optional(t.Number({ default: 0 })),
  errorMessage: t.Optional(t.Nullable(t.String({ default: null }))),
  apiKeyId: t.Optional(t.String())
})

export function usageRoutes(auth: Auth) {
  return new Elysia({ prefix: '/api/usage' })

    // POST /api/usage/event — session or API key
    .use(sessionAuth(auth))
    .post('/event', async ({ userId, body }) => {
      const event = await UsageEvent.create({
        ...body,
        userId,
        apiKeyId: body.apiKeyId || 'api-key'
      })
      return { id: event._id, createdAt: event.createdAt }
    }, {
      auth: true,
      body: eventBody
    })

    // GET /api/usage/today — session or API key
    .get('/today', async ({ userId }) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const count = await UsageEvent.countDocuments({
        userId,
        eventType: { $in: ['enhance_requested', 'enhance_success'] },
        createdAt: { $gte: today }
      })

      return { count, date: today.toISOString().split('T')[0], limit: 10 }
    }, { auth: true })

    // GET /api/usage/stats — session required
    .group('', app => app
      .use(sessionAuth(auth))
      .get('/stats', async ({ userId, query }) => {
        const days = parseInt(query?.days as string) || 30

        const since = new Date()
        since.setDate(since.getDate() - days)
        since.setHours(0, 0, 0, 0)

        const [dailyBreakdown, platformBreakdown, toneBreakdown, totals] = await Promise.all([
          UsageEvent.aggregate([
            { $match: { userId, createdAt: { $gte: since }, eventType: { $ne: 'enhance_error' } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
          ]),

          UsageEvent.aggregate([
            { $match: { userId, eventType: { $ne: 'enhance_error' } } },
            { $group: { _id: '$platform', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ]),

          UsageEvent.aggregate([
            { $match: { userId, eventType: { $ne: 'enhance_error' } } },
            { $group: { _id: '$tone', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ]),

          UsageEvent.aggregate([
            { $match: { userId, eventType: { $ne: 'enhance_error' } } },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                thisMonth: {
                  $sum: {
                    $cond: [{ $gte: ['$createdAt', since] }, 1, 0]
                  }
                },
                today: {
                  $sum: {
                    $cond: [{
                      $gte: ['$createdAt', new Date(new Date().setHours(0, 0, 0, 0))]
                    }, 1, 0]
                  }
                }
              }
            }
          ])
        ])

        const totalStats = totals[0] || { total: 0, thisMonth: 0, today: 0 }

        const dailyMap = new Map(dailyBreakdown.map((d: any) => [d._id, d.count]))
        const dailySeries = []
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const key = d.toISOString().split('T')[0]
          dailySeries.push({ date: key, count: dailyMap.get(key) || 0 })
        }

        return {
          ...totalStats,
          daily: dailySeries,
          byPlatform: platformBreakdown.map((p: any) => ({ platform: p._id, count: p.count })),
          byTone: toneBreakdown.map((t: any) => ({ tone: t._id, count: t.count }))
        }
      }, { auth: true })
    )
}
