import mongoose from 'mongoose'

export interface IUsageEvent {
  userId: string
  apiKeyId: string
  platform: string
  tone: string
  eventType: 'enhance_requested' | 'enhance_success' | 'enhance_error'
  textLength: number
  errorMessage: string | null
  createdAt: Date
}

const usageEventSchema = new mongoose.Schema<IUsageEvent>({
  userId: { type: String, required: true, index: true },
  apiKeyId: { type: String, required: true },
  platform: { type: String, required: true },
  tone: { type: String, required: true },
  eventType: {
    type: String,
    enum: ['enhance_requested', 'enhance_success', 'enhance_error'],
    required: true
  },
  textLength: { type: Number, default: 0 },
  errorMessage: { type: String, default: null }
}, { timestamps: true })

// Index for daily aggregation queries
usageEventSchema.index({ userId: 1, createdAt: -1 })
usageEventSchema.index({ userId: 1, eventType: 1, createdAt: -1 })

export const UsageEvent = mongoose.model<IUsageEvent>('UsageEvent', usageEventSchema)
