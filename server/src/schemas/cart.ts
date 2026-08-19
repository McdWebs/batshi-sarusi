import { z } from "zod";

const addressSchema = z
  .object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    company: z.string().optional(),
    address1: z.string().optional(),
    address2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postcode: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
  })
  .strict();

export const addCartItemSchema = z
  .object({
    id: z.number().int().positive(),
    quantity: z.number().int().positive().default(1),
    variation: z
      .array(
        z.object({
          attribute: z.string().min(1),
          value: z.string().min(1),
        }),
      )
      .optional(),
  })
  .strict();

export const updateCartItemSchema = z
  .object({
    quantity: z.number().int().min(0),
  })
  .strict();

export const cartItemKeySchema = z.object({
  key: z.string().min(1),
});

export const updateCustomerSchema = z
  .object({
    shippingAddress: addressSchema.optional(),
    billingAddress: addressSchema.optional(),
  })
  .strict()
  .refine((value) => value.shippingAddress || value.billingAddress, {
    message: "shippingAddress or billingAddress is required",
  });

export const selectShippingSchema = z
  .object({
    packageId: z.number().int().min(0),
    rateId: z.string().min(1),
  })
  .strict();

export const couponSchema = z
  .object({
    code: z.string().trim().min(1),
  })
  .strict();
