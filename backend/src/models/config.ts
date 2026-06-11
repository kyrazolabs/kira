import mongoose from 'mongoose'

export interface IUserConfig {
  userId: string
  defaultPersonaId: string | null
  defaultTone: 'casual' | 'professional' | 'engaging'
  analyticsEnabled: boolean
  updatedAt: Date
}

const configSchema = new mongoose.Schema<IUserConfig>({
  userId: { type: String, required: true, unique: true },
  defaultPersonaId: { type: String, default: null },
  defaultTone: {
    type: String,
    enum: ['casual', 'professional', 'engaging'],
    default: 'casual'
  },
  analyticsEnabled: { type: Boolean, default: true }
}, { timestamps: true })

export const UserConfig = mongoose.model<IUserConfig>('UserConfig', configSchema)
