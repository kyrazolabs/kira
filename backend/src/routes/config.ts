import { Elysia, t } from 'elysia'
import type { Auth } from '../auth'
import { sessionAuth } from '../middleware/auth'
import { Persona } from '../models/persona'
import { UserConfig } from '../models/config'

const personaBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
  description: t.Optional(t.String({ maxLength: 500, default: '' })),
  platform: t.Optional(t.Union([
    t.Literal('twitter'), t.Literal('linkedin'), t.Literal('reddit'),
    t.Literal('threads'), t.Literal('generic'), t.Literal('all')
  ], { default: 'all' })),
  tone: t.Optional(t.Union([
    t.Literal('casual'), t.Literal('professional'), t.Literal('engaging')
  ], { default: 'casual' })),
  systemPrompt: t.String({ minLength: 1, maxLength: 4000 }),
  temperature: t.Optional(t.Number({ minimum: 0, maximum: 2, default: 0.8 })),
  isDefault: t.Optional(t.Boolean({ default: false }))
})

const personaUpdate = t.Partial(personaBody)

const configUpdateBody = t.Object({
  defaultPersonaId: t.Optional(t.Nullable(t.String())),
  defaultTone: t.Optional(t.Union([
    t.Literal('casual'), t.Literal('professional'), t.Literal('engaging')
  ])),
  analyticsEnabled: t.Optional(t.Boolean())
})

export function configRoutes(auth: Auth) {
  return new Elysia({ prefix: '/api/config' })
    .use(sessionAuth(auth))

    .get('/', async ({ userId }) => {
      const [personas, config] = await Promise.all([
        Persona.find({ userId }).sort({ updatedAt: -1 }).lean(),
        UserConfig.findOne({ userId }).lean()
      ])

      return {
        personas,
        config: config || {
          userId,
          defaultPersonaId: null,
          defaultTone: 'casual',
          analyticsEnabled: true
        }
      }
    }, { auth: true })

    .get('/personas', async ({ userId }) => {
      const personas = await Persona.find({ userId }).sort({ updatedAt: -1 }).lean()
      return personas
    }, { auth: true })

    .post('/personas', async ({ userId, body }) => {
      if (body.isDefault) {
        await Persona.updateMany({ userId }, { $set: { isDefault: false } })
      }

      const persona = await Persona.create({ ...body, userId })

      const count = await Persona.countDocuments({ userId })
      if (count === 1) {
        persona.isDefault = true
        await persona.save()
        await UserConfig.findOneAndUpdate(
          { userId },
          { $set: { defaultPersonaId: persona._id.toString() } },
          { upsert: true }
        )
      }

      return persona.toObject()
    }, {
      auth: true,
      body: personaBody
    })

    .put('/personas/:id', async ({ userId, params, body }) => {
      const persona = await Persona.findOne({ _id: params.id, userId })
      if (!persona) return new Response(JSON.stringify({ error: 'Persona not found' }), { status: 404 })

      if (body.isDefault) {
        await Persona.updateMany({ userId }, { $set: { isDefault: false } })
        await UserConfig.findOneAndUpdate(
          { userId },
          { $set: { defaultPersonaId: params.id } },
          { upsert: true }
        )
      }

      Object.assign(persona, body)
      await persona.save()
      return persona.toObject()
    }, {
      auth: true,
      body: personaUpdate
    })

    .delete('/personas/:id', async ({ userId, params }) => {
      const persona = await Persona.findOneAndDelete({ _id: params.id, userId })
      if (!persona) return new Response(JSON.stringify({ error: 'Persona not found' }), { status: 404 })

      const config = await UserConfig.findOne({ userId })
      if (config?.defaultPersonaId === params.id) {
        config.defaultPersonaId = null
        await config.save()
      }

      return { success: true }
    }, { auth: true })

    .put('/', async ({ userId, body }) => {
      const config = await UserConfig.findOneAndUpdate(
        { userId },
        { $set: body },
        { upsert: true, new: true }
      ).lean()
      return config
    }, {
      auth: true,
      body: configUpdateBody
    })
}
