import { config } from "dotenv";
import { Chess, Color, makeUci } from "chessops";
import { getTopMove } from "wintrchess/engine";
import { ProcessEngine } from "wintrchess/engine/node";
import { chessFromFen, withMove } from "wintrchess/utils";
import { collectCtxMoves, PlayMoveOptions } from "./utils";
import { selectAnnoyingMoves } from "./annoyingness";
import * as bot from "./lichess-bot";

config({ quiet: true });

const { ALLOWED_USER, BOT_TOKEN, ENGINE_DEPTH } = process.env;

const engine = await ProcessEngine.create("./resources/stockfish-19.exe");
engine.setLineCount(20);
engine.setThreadCount(4);
engine.on("message", msg => console.log(`[INFO] ${msg}`));

async function playBotMove({
    gameId, initialPosition, colour, ucis = []
}: PlayMoveOptions) {
    const moves = collectCtxMoves(initialPosition.clone(), ucis).toArray();
    const result = withMove(initialPosition, moves);

    if (!colour || result.turn != colour) return;

    // play bot move
    engine.setPosition(initialPosition, moves);

    const lines = await engine.evaluate({
        depth: Number(ENGINE_DEPTH) || 18
    });

    const annoyingMoves = selectAnnoyingMoves(result, lines, {
        lastMove: moves.length >= 2 ? moves.at(-2) : undefined
    });

    const topMove = annoyingMoves[0]?.move || getTopMove(lines);
    if (!topMove) return await bot.sendChatMessage(
        gameId, "no moves available. did you win?"
    );

    await bot.playMove(gameId, makeUci(topMove));
}

async function listenBoardStates(gameId: string) {
    let initialPosition: Chess | undefined;
    let colour: Color | undefined;

    const username = await bot.getUsername();

    for await (const event of bot.streamBoardState(gameId)) {
        console.log(`board state event received: ${event.type}`);

        if (event.type == "gameState") {
            if (!initialPosition || !colour) continue;

            await playBotMove({
                gameId, initialPosition, colour,
                ucis: event.moves.split(" ").filter(m => m)
            });
        }

        if (event.type == "gameFull") {
            initialPosition = event.initialFen == "startpos"
                ? Chess.default() : chessFromFen(event.initialFen);

            colour = event.white.id == username ? "white" : "black";

            await playBotMove({
                gameId, initialPosition, colour,
                ucis: event.state.moves.split(" ").filter(m => m)
            });
        }
    }
}

console.log("starting annoying engine bot on lichess...");
console.log("listening to challenges...");

for await (const event of bot.streamEvents()) {
    if (event.type == "gameStart") {
        console.log("game started.");
        listenBoardStates(event.game.gameId);

        continue;
    }

    if (event.type != "challenge") continue;

    if (ALLOWED_USER && event.challenge.challenger.id != ALLOWED_USER) {
        console.log(
            "challenge from unauthorized user "
            + `${event.challenge.challenger.id} blocked.`
        );

        continue;
    }

    await fetch(`https://lichess.org/api/challenge/${event.challenge.id}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${BOT_TOKEN}` }
    });

    console.log("challenge received from allowed user, accepting it...");
}