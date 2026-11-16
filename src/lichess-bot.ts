import { components } from "@lichess-org/types";
import { readNdjsonStream } from "./utils";

type BotEvent =
    | components["schemas"]["GameStartEvent"]
    | components["schemas"]["GameFinishEvent"]
    | components["schemas"]["ChallengeEvent"]
    | components["schemas"]["ChallengeCanceledEvent"]
    | components["schemas"]["ChallengeDeclinedEvent"];

type BoardStateEvent =
    | components["schemas"]["GameFullEvent"]
    | components["schemas"]["GameStateEvent"]
    | components["schemas"]["ChatLineEvent"]
    | components["schemas"]["OpponentGoneEvent"];

type User = components["schemas"]["UserExtended"];

// Stream of challenge events
export async function* streamEvents() {
    const eventStreamResponse = await fetch("https://lichess.org/api/stream/event", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${process.env.BOT_TOKEN}`
        }
    });

    const eventStream = eventStreamResponse.body
        ?.pipeThrough(new TextDecoderStream());
    if (!eventStream) return;

    yield* readNdjsonStream<BotEvent>(eventStream);
}

// Stream of board updates / move events
export async function* streamBoardState(gameId: string) {
    const stateStreamResponse = await fetch(
        `https://lichess.org/api/bot/game/stream/${gameId}`,
        { headers: { Authorization: `Bearer ${process.env.BOT_TOKEN}` } }
    );

    const stateStream = stateStreamResponse.body
        ?.pipeThrough(new TextDecoderStream());
    if (!stateStream) return;

    yield* readNdjsonStream<BoardStateEvent>(stateStream);
}

// Play a move in a game
export async function playMove(gameId: string, moveUci: string) {
    await fetch(`https://lichess.org/api/bot/game/${gameId}/move/${moveUci}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.BOT_TOKEN}` }
    });
}

// Send a chat message in a game
export async function sendChatMessage(gameId: string, message: string) {
    await fetch(`https://lichess.org/api/bot/game/${gameId}/chat`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.BOT_TOKEN}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `room=player&text=${message}`
    });
}

// Get bot's username
export async function getUsername() {
    const response = await fetch("https://lichess.org/api/account", {
        headers: { Authorization: `Bearer ${process.env.BOT_TOKEN}` }
    });

    const user: User = await response.json();
    return user.id;
}