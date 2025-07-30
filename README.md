# airport-codes

This bot detects airport codes in submissions and leaves a comment on the post with additional information about the mentioned airport(s).

For example, if a submission is posted with the title:

> Spotted at SFO (inbound from SEA!)

The bot will leave a comment like:

|IATA|ICAO|Name|Location|
|-|-|-|-|
|SFO|KSFO|San Francisco International Airport|San Francisco, California, United States|
|SEA|KSEA|Seattle–Tacoma International Airport|Seattle, Washington, United States|

# FAQ

## Where does the airport data come from?

The airport list is maintained in [airports.json](src/db/airports.json) and was originally sourced from [mwgg/Airports](https://github.com/mwgg/Airports).

## The bot replied with an airport I didn't mention.

There can be false positives if your post contains an acronym that happens to match the IATA or ICAO code of an airport.

For example, **ILS** is commonly used to refer to **Instrument Landing System** but is also the IATA code of [Ilopango International Airport](https://en.wikipedia.org/wiki/Ilopango_International_Airport) in El Salvador.

We maintain a list of common acronyms like this so that they can be ignored. If you want to nominate a new acronym to add to the ignore list because it overlaps with the codes of a relatively unknown airport, please [open an issue](https://github.com/nicolewhite/reddit-airport-codes/issues/new).

## How do I add this bot to my community?

Mods can install this app into their subreddit via the official Reddit apps marketplace.
To install this app, go to its [homepage](https://developers.reddit.com/apps/airport-codes) and click **Add to community**.

See [mod resources](https://developers.reddit.com/docs/mod_resources) for more details on installing and managing apps.
