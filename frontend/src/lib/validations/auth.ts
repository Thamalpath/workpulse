import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "Username or email is required."),
  password: z.string().min(1, "Password is required."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required."),
    email: z
      .string()
      .min(1, "Email is required.")
      .email("Please provide a valid email address."),
    username: z
      .string()
      .min(1, "Username is required.")
      .min(3, "Username must be at least 3 characters."),
    password: z
      .string()
      .min(1, "Password is required.")
      .min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
