import { z } from "zod";

const mailEnv = z.object({
  SMTP_HOST: z.string().nonempty(),
  SMTP_PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(587),
  SMTP_USER: z.string().nonempty(),
  SMTP_PASS: z.string().nonempty(),
  SMTP_SECURE: z.coerce.boolean().default(false),
  MAIL_FROM: z.string().email(),
});

export type MailConfig = z.infer<typeof mailEnv>;
export const mailConfig = mailEnv.parse(process.env);
