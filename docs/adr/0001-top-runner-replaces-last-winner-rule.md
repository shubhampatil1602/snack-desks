# Top Runner replaces the last-winner rule and the excluded list

The spin used to sit out the previous window's split master and a hard-coded list of users (`SPIN_EXCLUDED_USER_IDS`). We dropped both. Now the only person who sits out is the Top Runner: the participant ranked highest on today's Runs Leaderboard. That rewards running instead of luck. If nobody connected Strava or nobody ran today, every participant can be drawn. If sitting the Top Runner out would leave nobody, everyone can be drawn.

## Considered Options

- **Keep the last-winner rule alongside the Top Runner rule**: rejected. Two rules stacking made small windows fall back to "anyone" too often, and the reward should come from running alone.
- **Score with distance and pace each scaled against the day's best, 50/50**: rejected. Someone walking a long way could beat a fast short run, and a person's score changed depending on who else ran. The run score uses average speed × distance^0.4 (twice the distance counts the same as 32% faster), and anything slower than 11:30/km counts as a walk (first 10:00/km, raised because most office runners run 10:00–11:00/km).
- **Distance to the power 0.5 (square root)**: the first version, rejected. A 2 km run had to beat 4:28/km to outscore 10 km at 10:00/km, so distance decided too much.
- **Distance to the power ⅓ (cube root)**: rejected. An ordinary 2 km at 5:45/km would beat 10 km at 10:00/km, so long, steady runs lost too easily. At 0.4 the 2 km has to beat 5:15/km.
