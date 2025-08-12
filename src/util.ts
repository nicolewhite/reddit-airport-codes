import { z } from 'zod';
import type { SettingsClient } from '@devvit/public-api';
import {
  AIRPORTS,
  COUNTRIES,
  FALSE_POSITIVES_LIST_DEFAULT,
  FALSE_POSITIVES_LIST_SETTING_NAME,
} from './data.js';

function findMentionedIcaoCodes(args: { text: string; ignoreCodes: Set<string> }): Set<string> {
  const mentioned = new Set<string>();

  for (const [key, airport] of Object.entries(AIRPORTS)) {
    // Check for either the ICAO or IATA code
    const codesToCheck = [airport.icao, airport.iata].filter((c) => c && !args.ignoreCodes.has(c));
    if (codesToCheck.length === 0) {
      continue;
    }

    // Only match if the code is surrounded by non-word characters or at the start/end of the string.
    // This prevents matching substrings within other words, e.g. "SEA" in "OVERSEAS".
    // We also only match on the uppercase version of the code to avoid matching on common language,
    // e.g. "sea level" should not match "SEA".
    const codesRegex = codesToCheck.join('|');
    const pattern = new RegExp(`(^|\\W+)(${codesRegex})(\\W+|$)`, 'm');

    if (pattern.test(args.text)) {
      mentioned.add(key);
    }
  }

  return mentioned;
}

function makeCommentBody(icaoCodes: Set<string>): string {
  let body = '|IATA|ICAO|Name|Location|\n|:-|:-|:-|:-|';

  for (const code of Array.from(icaoCodes).sort((a, b) => a.localeCompare(b))) {
    const airport = AIRPORTS[code];

    const name = airport.name;
    const icao = airport.icao;
    const iata = airport.iata || '';
    const city = airport.city;
    const state = airport.state;
    const countryCode = airport.country;
    const country = COUNTRIES[countryCode] || countryCode;
    const location = [city, state, country].filter((x) => x).join(', ');

    body += `\n|${iata}|${icao}|${name}|${location}|`;
  }

  body += '\n\n*I am a bot.*';

  const links = [
    {
      name: 'Source',
      url: 'https://github.com/nicolewhite/reddit-airport-codes',
    },
    {
      name: 'FAQ',
      url: 'https://github.com/nicolewhite/reddit-airport-codes/blob/main/README.md#faq',
    },
    {
      name: 'Report a bug',
      url: 'https://github.com/nicolewhite/reddit-airport-codes/issues/new',
    },
  ];

  body += '\n\n';

  body += links.map((link) => `[${link.name}](${link.url})`).join(' | ');

  return body;
}

export function makeCommentResponse(args: {
  text: string;
  ignoreCodes: Set<string>;
}): string | null {
  const mentionedIcaoCodes = findMentionedIcaoCodes(args);

  if (mentionedIcaoCodes.size === 0) {
    return null;
  }

  return makeCommentBody(mentionedIcaoCodes);
}

/**
 * Get common acronyms that conflict with lesser-known airports.
 *
 * This is maintained as a global app setting so that we can update it without
 * needing to bother mods about deploying a new version of the app.
 *
 * To add a new value to the list, first add it to the default list in `FALSE_POSITIVES_LIST_DEFAULT`.
 *
 * Then, use the devvit CLI to update the value immediately across all installations:
 *
 * ```bash
 * devvit settings set false-positives-list
 * ```
 *
 * An interactive prompt will ask for the value. Grab the current list from
 * `FALSE_POSITIVES_LIST_DEFAULT`, join on a comma, and paste it in.
 *
 * Finally, update the README changelog with the newly-added false positive code(s).
 */
export async function getFalsePositiveCodes(settings: SettingsClient): Promise<Set<string>> {
  let val: unknown;

  try {
    val = await settings.get(FALSE_POSITIVES_LIST_SETTING_NAME);
  } catch (error) {
    console.error('Error getting false positives list:', error);
    return new Set(FALSE_POSITIVES_LIST_DEFAULT);
  }

  const resp = z
    .string()
    .transform((value) => value.trim().split(','))
    .pipe(z.string().array())
    .safeParse(val);

  if (!resp.success) {
    console.error('Invalid false positives list:', resp.error);
    return new Set(FALSE_POSITIVES_LIST_DEFAULT);
  }

  return new Set([
    ...FALSE_POSITIVES_LIST_DEFAULT,
    ...resp.data.map((code) => code.trim().toUpperCase()),
  ]);
}
