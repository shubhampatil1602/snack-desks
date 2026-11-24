# Strava data reaches coworkers only with the user's consent

Strava's API Agreement says a user's Strava data, leaderboards included, may only be shown to that user unless they give explicit consent. The Runs Leaderboard and the spin need other people to see it. So connecting Strava requires agreeing that everyone in your org sees your place on the leaderboard (distance, pace, score, photo), and that the spin names you, above the wheel, when you sit out as the fastest runner. You're left off the wheel itself unless nobody else is left to draw. Your individual activities, charts and totals stay visible to you alone.

The first version showed the leaderboard to admins only. It was opened to the whole org (23 Nov 2026) because seeing where you stand is what makes people run. The consent text changed with it; anyone who connected before agreed only to admins seeing them.

## Consequences

- The consent text must appear on the `/strava` page before the redirect to Strava, next to Strava's official "Connect with Strava" button. Strava's review checks this.
- Disconnecting, in SnackDesk or from inside Strava (deauthorization webhook), deletes the user's tokens and stored activities.
- The Strava app is shared by every org. It allows 10 athletes until Strava approves a review, so past that the page shows "More spots coming soon".
