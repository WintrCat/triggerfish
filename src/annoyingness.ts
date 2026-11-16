import { Chess, NormalMove, squareFile, squareRank } from "chessops";
import { INITIAL_FEN, makeFen } from "chessops/fen";
import { makeSan, parseSan } from "chessops/san";
import {
    EngineLine,
    getEvaluation,
    getWinPercent,
    getWinPercentLoss
} from "wintrchess/engine";
import { getHangingPieces, getLegalMoves, withMove } from "wintrchess/utils";
import { contextualizeMove, ContextualMove } from "wintrchess/types";
import { shuffle, sumBy } from "es-toolkit";

/** The maximum disadvantage the bot is willing to sustain normally. */
const DEFAULT_MAX_DISV = getWinPercent({ type: "cp", value: -500 });

/** The maximum Win% loss the bot will sustain per move. */
const DEFAULT_MAX_WPL = 0.215;

/** The Win% after which the bot tries to remain winning. */
const WIN_THRESHOLD = getWinPercent({ type: "cp", value: 600 });


/** If you're configuring the bot, DON'T EDIT ANYTHING BELOW THIS */
const FIRST_MOVES = ["f3", "g4", "h4", "a4", "Na3", "Nh3"]
    .map(san => contextualizeMove(
        Chess.default(),
        parseSan(Chess.default(), san) as NormalMove
    ));

/**
 * Gets annoyingness score of a move. `lastMove` is the last move
 * that was played by the SAME SIDE as `move`, which is the move
 * to be applied to `position`.
 */
export function getAnnoyingness(
    position: Chess,
    move: ContextualMove,
    lastMove?: ContextualMove
) {
    const result = withMove(position, move);
    let score = 0;

    // moving pawns or knights out nearer the edge for no reason
    if (move.piece.role == "pawn" || move.piece.role == "knight")
        score += Math.floor(Math.abs(3.5 - squareFile(move.to)));

    // any king move that isn't castles, especially closer to center
    const pieceDistance = position.turn == "white"
        ? squareRank(move.to)
        : 7 - squareRank(move.to);

    const isCastles = makeSan(position, move).includes("O");
    if (move.piece.role == "king" && !isCastles)
        score += pieceDistance * 5;

    // bonus for moving piece far out into the position for no reason
    score += pieceDistance / 2;

    // bonus for any move that allows a forward king move next time
    const king = position.board.kingOf(position.turn)!;

    const turnedResult = result.clone();
    turnedResult.turn = position.turn;

    if (
        getLegalMoves(turnedResult, king).toArray().length
        > getLegalMoves(position, king).toArray().length
    ) score += 3;

    // the more material sacrificed the better
    const hanging = getHangingPieces(result, {
        move, includedPieces: position.board[position.turn]
    });

    score += sumBy(
        hanging.toArray(),
        piece => piece.role == "king" ? 0 : piece.exchange.evaluation
    );

    // bonus for moving the same piece again
    if (move.from == lastMove?.to) score += 2;

    // NOTE: all must not go over disadvantage threshold
    return score;
}

/**
 * Selects moves from a set of engine lines given for `position` that do
 * not surpass a given disadvantage threshold. Then, it orders them by
 * annoyingness score and returns the ordered list.
 */
export function selectAnnoyingMoves(
    position: Chess,
    lines: EngineLine[],
    options?: {
        maxWpl?: number;
        maxDisadvantage?: number;
        lastMove?: ContextualMove;
    }
) {
    if (makeFen(position.toSetup()) == INITIAL_FEN)
        return shuffle(FIRST_MOVES).map(move => ({ move, score: 0 }));

    const eligibleMoves = lines
        .filter(line => {
            const evaluation = getEvaluation(lines);
            if (!evaluation) return false;

            const resultWp = getWinPercent(line.evaluation, position.turn);
            const wpl = getWinPercentLoss(
                evaluation, line.evaluation, position.turn
            );

            const maxWpl = options?.maxWpl || DEFAULT_MAX_WPL;

            if (getWinPercent(evaluation, position.turn) >= WIN_THRESHOLD)
                return resultWp >= WIN_THRESHOLD && wpl <= maxWpl;

            return resultWp >= (options?.maxDisadvantage || DEFAULT_MAX_DISV)
                && wpl <= maxWpl;
        })
        .map(line => line.moves.at(0))
        .filter(move => move != undefined);

    return eligibleMoves
        .map(move => ({
            move,
            score: getAnnoyingness(position, move, options?.lastMove)
        }))
        .sort((a, b) => b.score - a.score);
}