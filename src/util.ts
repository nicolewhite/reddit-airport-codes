import { z } from 'zod';
import {
  APP_USERNAME,
  AIRPORTS,
  COUNTRIES,
  FALSE_POSITIVES,
  FALSE_POSITIVES_GITHUB_URL,
  BAD_BOT_PHRASE,
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

function makeCommentBody(args: { icaoCodes: Set<string>; isReplyToPost: boolean }): string | null {
  if (args.icaoCodes.size === 0) {
    return null;
  }

  let body = '|IATA|ICAO|Name|Location|\n|:-|:-|:-|:-|';

  // Sort airports by IATA code, then name
  const airports = Array.from(args.icaoCodes)
    .map((code) => AIRPORTS[code])
    .sort((a, b) => (a.iata ?? a.name).localeCompare(b.iata ?? b.name));

  for (const airport of airports) {
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

  body += '\n\n';
  body += `*[I am a bot.](https://developers.reddit.com/apps/${APP_USERNAME})*`;

  if (args.isReplyToPost) {
    // If this is a top-level reply to a post, tell the OP how to delete it.
    body += '\n\n';
    body += `^(If you are the OP and this comment is inaccurate or unwanted, reply below with "${BAD_BOT_PHRASE}" and it will be deleted.)`;
  }

  return body;
}

export function makeCommentResponse(args: {
  text: string;
  ignoreCodes: Set<string>;
  isReplyToPost: boolean;
}): string | null {
  const mentionedIcaoCodes = findMentionedIcaoCodes({
    text: args.text,
    ignoreCodes: args.ignoreCodes,
  });

  if (mentionedIcaoCodes.size === 0) {
    return null;
  }

  return makeCommentBody({
    icaoCodes: mentionedIcaoCodes,
    isReplyToPost: args.isReplyToPost,
  });
}

/**
 * Get common acronyms that conflict with lesser-known airports
 * so that they can be ignored when parsing codes from submissions.
 */
export async function getFalsePositiveCodes(): Promise<Set<string>> {
  try {
    // Get the latest list from the main branch of the repo; this allows us to update the list without needing to redeploy the app.
    const resp = await fetch(FALSE_POSITIVES_GITHUB_URL, { signal: AbortSignal.timeout(5000) });
    const text = await resp.text();
    const falsePositivesRemote = z.array(z.string()).parse(JSON.parse(text));

    return new Set([...FALSE_POSITIVES, ...falsePositivesRemote]);
  } catch (error) {
    console.error('Error getting false positives list:', error);
    return new Set(FALSE_POSITIVES);
  }
}
