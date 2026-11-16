import { Chess, Color, NormalMove, parseUci } from "chessops";
import { contextualizeMove } from "wintrchess/types";

export interface PlayMoveOptions {
    /** The Lichess ID of the game. */
    gameId: string;
    /** The initial position. Usually the starting position. */
    initialPosition: Chess;
    /** The UCI moves to apply to the initial position. */
    ucis?: string[];
    /** The colour that the bot is playing. */
    colour: Color;
}

/** Given a position and UCI moves to be added, returns contextual moves. */
export function* collectCtxMoves(position: Chess, uciMoves: string[]) {
    position = position.clone();

    for (const uci of uciMoves) {
        const move = parseUci(uci) as NormalMove;

        yield contextualizeMove(position, move);
        position.play(move);
    }
}