import { AIRPORTS, COUNTRIES, COMMON_ACRONYMS_TO_IGNORE } from './data.js';

function findMentionedIcaoCodes(text: string): Set<string> {
  const mentioned = new Set<string>();

  for (const [key, airport] of Object.entries(AIRPORTS)) {
    // Check for either the ICAO or IATA code
    const codesToCheck = [airport.icao, airport.iata].filter(
      (c) => c && !COMMON_ACRONYMS_TO_IGNORE.includes(c),
    );
    if (codesToCheck.length === 0) {
      continue;
    }

    // Only match if the code is surrounded by non-word characters or at the start/end of the string.
    // This prevents matching substrings within other words, e.g. "SEA" in "OVERSEAS".
    // We also only match on the uppercase version of the code to avoid matching on common language,
    // e.g. "sea level" should not match "SEA".
    const codesRegex = codesToCheck.join('|');
    const pattern = new RegExp(`(^|\\W+)(${codesRegex})(\\W+|$)`, 'm');

    if (pattern.test(text)) {
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

export function makeCommentResponse(text: string): string | null {
  const mentionedIcaoCodes = findMentionedIcaoCodes(text);

  if (mentionedIcaoCodes.size === 0) {
    return null;
  }

  return makeCommentBody(mentionedIcaoCodes);
}
