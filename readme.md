<div align="center">
    <img width="904" height="361" alt="image" src="https://github.com/user-attachments/assets/0952fa84-b65e-4e87-86d8-5662c33787a3" />
</div>

<hr/>

The most annoying Chess engine ever. By the way, the fish in the logo is a Bowfin. idk.

The engine strives to play the most disrespectful, frustrating and painful moves possible, with more an emphasis on doing so than actually winning the game. But it will win the game eventually. But only just before the fifty-move rule would have been reached, probably.

## How it works

The underlying Chess engine calculating the normal evaluations of moves is Stockfish 19. Triggerfish is simply an additional layer of conditions and heuristics that helps to pick which of those moves that it would rather play in the pursuit of being annoying.

Each move in a position is given an "annoyingness" score based on several heuristics that reflect what people find most disrespectful. This includes:

- Moving pawns that are closer to the edges of the board for no reason
- Moving knights to the edge of the board for no reason
- Moving the king closer to the centre for no reason
- Moving anything else so that on the next move you can move the king out for no reason
- Speaking of that; moving any piece super far out for no reason
- Sacrificing material in a winning position for no reason
- Moving pieces multiple times in a row for no reason

The moves are then ordered by this score and the one with the highest score is played. This is provided that the move does not cause the bot too large of a disadvantage. The default threshold is -5 on the evaluation bar, but this may be configured if you think that the bot can suffer a larger disadvantage against a presumably lower-rated opponent. If the bot has advantage to spare, then it may do so in the pursuit of disrespect.

There's also a "winning" clause such that if the advantage becomes quite high for the bot (provided mistakes by its human opponent despite their initial advantage), then it will begin to hold on to this advantage. In this case, the human opponent will surely lose.

But, in theory, it is possible to beat this bot, if you can exploit the disadvantage it willingly suffers in order to disrespect you. Kill it quickly or it will kill you slowly!

## Running locally

### Prerequisites
- Node.js
- TypeScript
- pnpm

### Deploying

- `git clone https://github.com/wintrcat/triggerfish.git .`
- `pnpm install`
- `pnpm build`

Now, create a `.env` file in the project directory. Populate it as such:

```toml
# The Lichess bot account access token
BOT_TOKEN=lip_iopajhdoiawhodiah

# The username of the account who is allowed to challenge the bot.
# Omit this if everyone should be allowed to play.
ALLOWED_USER=wintrcat

# The depth of the underlying Stockfish engine.
ENGINE_DEPTH=14
```
###### Note that right now only one person can play the bot at a time.

It is also possible to configure the maximum disadvantage the bot is willing to suffer, and at what *ad*vantage it will remain trying to win. The constants are at the top of `src/annoyingness.ts`. You will have to `pnpm build` to recompile if you change these.

You can now start the bot with `pnpm start`.
Challenge the bot to a casual, unlimited time game and choose any colour you want. From my experience, it is more fun to play with Black.

###### For some reason, the time it takes to think of each move can vary significantly. Expect to wait anywhere between 1-60 seconds depending on the position.
