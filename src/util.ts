import { airports, countries, COMMON_ACRONYMS_TO_IGNORE } from "./data.js";

export function findMentionedIcaoCodes(text: string): Set<string> {
  const mentioned = new Set<string>();

  for (const [key, airport] of Object.entries(airports)) {
    // Check for either the ICAO or IATA code
    const codesToCheck = [
      airport.icao,
      airport.iata,
    ].filter(c => c && !COMMON_ACRONYMS_TO_IGNORE.includes(c));
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

export function makeCommentBody(icaoCodes: Set<string>): string {
  let body = "|IATA|ICAO|Name|Location|\n|:-|:-|:-|:-|";

  for (const code of Array.from(icaoCodes).sort((a, b) => a.localeCompare(b))) {
    const airport = airports[code];

    const name = airport.name;
    const icao = airport.icao;
    const iata = airport.iata || '';
    const city = airport.city;
    const state = airport.state;
    const countryCode = airport.country;
    const country = countries[countryCode] || countryCode;
    const location = [city, state, country].filter(x => x).join(', ');

    body += `\n|${iata}|${icao}|${name}|${location}|`;
  }

  body += "\n\n*I am a bot.*";

  return body;
}
