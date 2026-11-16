import { components } from "@lichess-org/types";

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

const decoder = new TextDecoder("utf-8");

// Stream of challenge events
export async function* streamEvents() {
    const eventStreamResponse = await fetch("https://lichess.org/api/stream/event", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${process.env.BOT_TOKEN}`
        }
    });

    const eventStream = eventStreamResponse.body;
    if (!eventStream) return;

    for await (const event of eventStream) {
        const eventText = decoder.decode(event);

        try {
            yield JSON.parse(eventText) as BotEvent;
        } catch {
            if (eventText.trim())
                console.error(`unable to parse: ${eventText}`);
        }
    }
}

// Stream of board updates / move events
export async function* streamBoardState(gameId: string) {
    const stateStreamResponse = await fetch(
        `https://lichess.org/api/bot/game/stream/${gameId}`,
        { headers: { Authorization: `Bearer ${process.env.BOT_TOKEN}` } }
    );

    const stateStream = stateStreamResponse.body;
    if (!stateStream) return;

    for await (const event of stateStream) {
        const eventText = decoder.decode(event);

        try {
            yield JSON.parse(eventText) as BoardStateEvent;
        } catch {
            if (eventText.trim())
                console.error(`unable to parse: ${eventText}`);
        }
    }
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