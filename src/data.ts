import { z } from 'zod';
import airportsData from './db/airports.json' with { type: 'json' };
import countriesData from './db/countries.json' with { type: 'json' };
import falsePositivesData from './db/falsePositives.json' with { type: 'json' };
import { AirportSchema } from './schema.js';

export const APP_USERNAME = 'airport-codes';

export const MY_USERNAME = 'moduli-retain-banana';

export const BAD_BOT_PHRASE = 'bad bot';

export const FALSE_POSITIVES_GITHUB_URL =
  'https://raw.githubusercontent.com/nicolewhite/reddit-airport-codes/refs/heads/main/src/db/falsePositives.json';

// List of common acronyms that conflict with lesser-known airports.
export const FALSE_POSITIVES = z.array(z.string()).parse(falsePositivesData);

// Map of ICAO code to airport.
export const AIRPORTS = z.record(z.string(), AirportSchema).parse(airportsData);

// Map of country code to country name.
export const COUNTRIES = z.record(z.string(), z.string()).parse(countriesData);
