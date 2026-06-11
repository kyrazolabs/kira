import mongoose from 'mongoose'

export interface IPersona {
  userId: string
  name: string
  description: string
  platform: 'twitter' | 'linkedin' | 'reddit' | 'threads' | 'generic' | 'all'
  tone: 'casual' | 'professional' | 'engaging'
  systemPrompt: string
  temperature: number
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

const personaSchema = new mongoose.Schema<IPersona>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true, maxlength: 100 },
  description: { type: String, default: '', maxlength: 500 },
  platform: {
    type: String,
    enum: ['twitter', 'linkedin', 'reddit', 'threads', 'generic', 'all'],
    default: 'all'
  },
  tone: {
    type: String,
    enum: ['casual', 'professional', 'engaging'],
    default: 'casual'
  },
  systemPrompt: { type: String, required: true, maxlength: 4000 },
  temperature: { type: Number, default: 0.8, min: 0, max: 2 },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true })

export const Persona = mongoose.model<IPersona>('Persona', personaSchema)
