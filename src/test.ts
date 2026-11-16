import { DEFAULT_WPL_THRESHOLDS } from "wintrchess/classify";
import { getWinPercent, getWinPercentLoss } from "wintrchess/engine";
import { chessFromFen } from "wintrchess/utils";
import { getAnnoyingness } from "./annoyingness";
import { contextualizeMove } from "wintrchess/types";
import { NormalMove, parseUci } from "chessops";

const pos = chessFromFen("r1bqkbnr/ppp2ppp/n7/3pp3/8/8/1PPPPPPP/RNBQKBNR w KQkq - 0 4");

console.log(getAnnoyingness(pos, contextualizeMove(pos, parseUci("h2h4") as NormalMove)));

console.log(getWinPercent({ type: "cp", value: -250 }));