import { z } from 'zod'

const envSchema = z.object({
  VITE_API_MODE: z.enum(['mock', 'http']).default('mock'),
  VITE_API_BASE_URL: z.string().default('/api'),
  VITE_MOCK_LATENCY_MS: z.coerce.number().int().min(0).max(3000).default(250),
})

/** 非法配置在启动时直接失败，避免"看起来能跑" */
export const env = envSchema.parse(import.meta.env)
