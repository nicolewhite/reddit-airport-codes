import { z } from 'zod';
import airportsData from './db/airports.json' with { type: 'json' };
import countriesData from './db/countries.json' with { type: 'json' };
import { AirportSchema } from './schema.js';

export const APP_USERNAME = 'airport-codes';

export const FALSE_POSITIVES_LIST_SETTING_NAME = 'false-positives-list';

// Default value of the false positives list (in case we fail to fetch it from the settings client).
export const FALSE_POSITIVES_LIST_DEFAULT = [
  'ILS',
  'RAF',
  'TCA',
  'PAN',
  'MKI',
  'KLM',
  'EPS',
  'JAL',
  'USA',
  'ITA',
  'AIR',
  'ALL',
  'MIG',
];

// Map of ICAO code to airport.
export const AIRPORTS = z.record(z.string(), AirportSchema).parse(airportsData);

// Map of country code to country name.
export const COUNTRIES = z.record(z.string(), z.string()).parse(countriesData);
