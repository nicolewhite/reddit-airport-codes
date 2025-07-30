import airportsData from './db/airports.json' with { type: 'json' };
import countriesData from './db/countries.json' with { type: 'json' };
import { z } from 'zod';
import { AirportSchema } from './schema.js';

export const COMMON_ACRONYMS_TO_IGNORE = [
    // Instrument Landing System; conflicts with Ilopango International Airport (ILS)
    "ILS",
    // Royal Air Force; conflicts with Rafaela Airport (RAF)
    "RAF",
    // Trans-Canada Air Lines; conflicts with Tennant Creek Airport (TCA)
    "TCA",
    // Pan American; conflicts with Pattani Airport (PAN)
    "PAN",
    // Type of military plane; conflicts with M'Boki Airport (MKI)
    "MKI",
];

// Map of ICAO code to airport.
export const airports = z.record(z.string(), AirportSchema).parse(airportsData);

// Map of country code to country name.
export const countries = z.record(z.string(), z.string()).parse(countriesData);
