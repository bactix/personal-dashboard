import { z } from "zod";

/** Largest accepted image file, in bytes. It is stored inline as a base64 data URL. */
export const MAX_LOGO_BYTES = 1024 * 1024;
export const LOGO_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"] as const;

// base64 inflates by 4/3; leave room for the "data:<mime>;base64," prefix.
const MAX_DATA_URL_LENGTH = Math.ceil((MAX_LOGO_BYTES * 4) / 3) + 64;

const imageSchema = z
  .string()
  .max(MAX_DATA_URL_LENGTH, "Image is too large (max 1 MB)")
  .regex(
    /^data:image\/(png|jpeg|webp|gif|svg\+xml);base64,[A-Za-z0-9+/]+=*$/,
    "Choose a PNG, JPEG, WebP, GIF or SVG image"
  );

export const logoSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(60),
  /** The image as a base64 data URL. */
  image: z.string(),
  createdAt: z.string(),
});

export const createLogoInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Name is too long"),
  image: imageSchema,
});

export type Logo = z.infer<typeof logoSchema>;
export type CreateLogoInput = z.infer<typeof createLogoInputSchema>;
