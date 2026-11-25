# SnackDesk

Office snack ordering: an admin opens an order window, employees order from the linked shops, and one participant is drawn to pay the shop.

## Language

### Ordering

**Order Window**:
A time-boxed round of ordering an admin opens (tea, lunch...) and links to shops.
_Avoid_: session, round

**Participant**:
Someone in an order window: they placed a non-cancelled order in it, or share an item in one.
_Avoid_: orderer, member

### The spin

**Spin**:
The random draw that picks a window's split master from its eligible participants.
_Avoid_: lottery, raffle

**Split Master**:
The participant the spin picks to pay the shop for the whole window.
_Avoid_: winner, payer

**Sitting out**:
A participant who is in the window but can't be drawn in its spin.
_Avoid_: excluded, banned

### Strava

**Run**:
A Strava activity recorded (not typed in by hand) as Run, at a moving-time pace of 12:00/km or faster. Slower ones are walks and don't score, but the person still shows on the Runs Leaderboard, unranked at the bottom.
_Avoid_: workout, activity

**Run Score**:
A person's score for one IST day: their average speed (km/h) across that day's runs times their total run distance (km) to the power 0.4. Further and faster both raise it; a run half as long has to be about 32% faster to tie.
_Avoid_: points, effort

**Runs Leaderboard**:
An org's members who connected Strava, ordered by today's run score. It locks at the org's first spin of the day, and runs uploaded after that don't count that day.
_Avoid_: ranking, standings

**Top Runner**:
The participant ranked highest on the locked runs leaderboard among a window's participants. They sit out that window's spin, unless nobody else is left.
_Avoid_: champion, Strava winner
