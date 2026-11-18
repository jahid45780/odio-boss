const { z } = require('zod');

const createProductSchema = z.object({
  name: z.string().trim().min(2).max(140),
  sku: z.string().trim().min(2).max(60),
  description: z.string().trim().min(10),
  shortDescription: z.string().trim().optional().default(''),
  price: z.coerce.number().positive(),
  previousPrice: z.coerce.number().nonnegative().nullable().optional(),
  category: z.string().min(1),
  brand: z.string().min(1),
  stock: z.coerce.number().int().min(0),
  specs: z.array(z.object({ label: z.string(), value: z.string() })).optional().default([]),
  isFeatured: z.coerce.boolean().optional().default(false),
  isBestSeller: z.coerce.boolean().optional().default(false),
  isNewArrival: z.coerce.boolean().optional().default(false),
  isPublished: z.coerce.boolean().optional().default(true),
});

module.exports = { createProductSchema };
