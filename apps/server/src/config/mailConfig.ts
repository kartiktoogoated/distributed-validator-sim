import { z } from "zod";

export const mailEnv = z
  .object({
    SMTP_HOST:   z.string().optional().default(""),              
    SMTP_PORT:   z.coerce.number().int().positive().default(587),
    SMTP_USER:   z.string().optional().default(""),
    SMTP_PASS:   z.string().optional().default(""),
    SMTP_SECURE: z.coerce.boolean().default(false),
    MAIL_FROM:   z.string().email().optional().default("no-reply@example.com"),
  })
  .parse(process.env);

export type MailConfig = typeof mailEnv;
export const mailConfig = mailEnv;
