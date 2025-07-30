import { z } from 'zod';

// Schema that transforms empty strings to null.
const nullableString = z
  .string()
  .nullable()
  .transform((val) => val || null);

export const AirportSchema = z.object({
  icao: z.string(),
  iata: nullableString,
  name: z.string(),
  city: nullableString,
  state: nullableString,
  country: z.string(),
  elevation: z.number(),
  lat: z.number(),
  lon: z.number(),
  tz: z.string(),
});

export type Airport = z.infer<typeof AirportSchema>;
