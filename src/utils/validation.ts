import { z } from 'zod';

export const envSchema = z.object({
  GOOGLE_CREDS: z.string().min(1, "GOOGLE_CREDS is required"),
  GOOGLE_SHEET_ID: z.string().min(1, "GOOGLE_SHEET_ID is required"),
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET is required"),
  BOOKLA_API_KEY: z.string().min(1, "BOOKLA_API_KEY is required"),
  BOOKLA_COMPANY_ID: z.string().min(1, "BOOKLA_COMPANY_ID is required"),
  WEBFLOW_API_TOKEN: z.string().min(1, "WEBFLOW_API_TOKEN is required"),
  WEBFLOW_SITE_ID: z.string().min(1, "WEBFLOW_SITE_ID is required"),
  SYNC_SECRET: z.string().min(1, "SYNC_SECRET is required"),
});

export const validateEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.format());
    throw new Error("Invalid environment variables");
  }
  return result.data;
};
