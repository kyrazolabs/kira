import { betterAuth } from 'better-auth'
import type { BetterAuthOptions } from 'better-auth'
import { mongodbAdapter } from 'better-auth/adapters/mongodb'
import { stripe } from '@better-auth/stripe'
import { apiKey } from '@better-auth/api-key'
import Stripe from 'stripe'
import type { Db } from 'mongodb'

let stripeClient: Stripe | null = null

function getStripeClient() {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-06-15.basil' as any
    })
  }
  return stripeClient
}

export function createAuth(db: Db) {
  const client = (db as any).client as import('mongodb').MongoClient

  return betterAuth({
    database: mongodbAdapter(db, { client }),
    trustedOrigins: [
      'http://localhost:5173',
      'http://localhost:3000',
      'chrome-extension://igmencoidcodhdiccnokpijdiepghlmb'
    ],

    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
      }
    },

    plugins: [
      apiKey({
        defaultPrefix: 'ce_',
        enableSessionForAPIKeys: true,
        rateLimit: { enabled: false }
      }),
      ...(process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('replace_me')
        ? [stripe({
            stripeClient: getStripeClient(),
            stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
            createCustomerOnSignUp: true,
            subscription: {
              enabled: true,
              plans: [{
                name: 'pro',
                priceId: process.env.STRIPE_PRO_PRICE_ID || '',
                limits: { enhancements: 'unlimited', tones: 'all', platforms: 'all', personas: 10 },
                freeTrial: { days: 7 }
              }]
            }
          })]
        : [])
    ],

    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24
    },

    user: {
      additionalFields: {
        tier: { type: 'string', defaultValue: 'free' }
      }
    }
  })
}

export type Auth = ReturnType<typeof createAuth>
