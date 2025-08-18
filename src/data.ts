import { z } from 'zod';
import airportsData from './db/airports.json' with { type: 'json' };
import countriesData from './db/countries.json' with { type: 'json' };
import { AirportSchema } from './schema.js';

export const APP_USERNAME = 'airport-codes';

export const FALSE_POSITIVES_LIST_SETTING_NAME = 'false-positives-list';

// Default value of the false positives list (in case we fail to fetch it from the settings client).
export const FALSE_POSITIVES_LIST_DEFAULT = [
  'AAL',
  'ACC',
  'ADS',
  'AIR',
  'ALL',
  'ANA',
  'ANG',
  'AOA',
  'APU',
  'ATC',
  'ATR',
  'ATS',
  'AWD',
  'BAD',
  'BBC',
  'BIG',
  'CAS',
  'CAX',
  'CBS',
  'CEO',
  'CIA',
  'CNN',
  'CPL',
  'DOT',
  'EAA',
  'EMP',
  'EPS',
  'FAA',
  'ILS',
  'ITA',
  'JAL',
  'KAL',
  'KLM',
  'LOL',
  'MAX',
  'MIG',
  'MKI',
  'NBC',
  'NGO',
  'NOT',
  'OFF',
  'OMG',
  'PAF',
  'PAN',
  'PAX',
  'PIA',
  'POV',
  'PPL',
  'RAF',
  'SSC',
  'SWA',
  'TCA',
  'TFR',
  'TFW',
  'TUI',
  'UAL',
  'UND',
  'UNIT',
  'USA',
  'VIP',
];

// Map of ICAO code to airport.
export const AIRPORTS = z.record(z.string(), AirportSchema).parse(airportsData);

// Map of country code to country name.
export const COUNTRIES = z.record(z.string(), z.string()).parse(countriesData);
