import type { Vote } from "@/lib/game";
import { useI18n } from "@/lib/i18n";

export function VoteResultGraphic({
  votes,
  playerCount,
  passed
}: {
  votes: Record<number, Vote>;
  playerCount: number;
  passed: boolean;
}) {
  const { text } = useI18n();
  const seatLabel = (seat: number) => seat === 1 ? text("我", "Me") : text(`${seat}号`, `Seat ${seat}`);
  const voteLabel = (vote?: Vote) => vote === "agree" ? text("赞成", "Approve") : vote === "reject" ? text("反对", "Reject") : text("未记录", "Missing");
  const seats = Array.from({ length: playerCount }, (_, index) => index + 1);
  const agreeSeats = seats.filter((seat) => votes[seat] === "agree");
  const rejectSeats = seats.filter((seat) => votes[seat] === "reject");
  const missingSeats = seats.filter((seat) => votes[seat] !== "agree" && votes[seat] !== "reject");
  const isComplete = missingSeats.length === 0;
  const isTie = isComplete && agreeSeats.length === rejectSeats.length;
  const calculatedPassed = agreeSeats.length > rejectSeats.length;
  const hasResultConflict = isComplete && calculatedPassed !== passed;

  const agreePercent = playerCount ? (agreeSeats.length / playerCount) * 100 : 0;
  const rejectPercent = playerCount ? (rejectSeats.length / playerCount) * 100 : 0;
  const missingPercent = playerCount ? (missingSeats.length / playerCount) * 100 : 0;

  let decisionText = passed ? text("组队通过", "Team approved") : text("组队未通过", "Team rejected");
  let decisionClass = passed ? "passed" : "rejected";
  let decisionIcon = passed ? "✓" : "×";

  if (!isComplete) {
    decisionText = text("记录不完整", "Incomplete record");
    decisionClass = "incomplete";
    decisionIcon = "!";
  } else if (hasResultConflict) {
    decisionText = text("记录与结果不一致", "Record conflict");
    decisionClass = "incomplete";
    decisionIcon = "!";
  } else if (isTie) {
    decisionText = text("平票，组队未通过", "Tie · Team rejected");
    decisionClass = "tied";
    decisionIcon = "=";
  }

  const ariaSummary = [
    text(`赞成 ${agreeSeats.length} 票`, `${agreeSeats.length} approve`),
    text(`反对 ${rejectSeats.length} 票`, `${rejectSeats.length} reject`),
    missingSeats.length ? text(`未记录或弃票 ${missingSeats.length} 票`, `${missingSeats.length} missing or abstained`) : text("全部票已记录", "All votes recorded"),
    decisionText
  ].join("，");

  return (
    <div className="vote-graphic" aria-label={text(`投票结果：${ariaSummary}`, `Vote result: ${ariaSummary}`)}>
      <div className="vote-summary-row">
        <div className="vote-total vote-total-agree"><span>{text("赞成", "Approve")}</span><strong>{agreeSeats.length}</strong></div>
        <div className={`vote-decision ${decisionClass}`}>
          <span aria-hidden="true">{decisionIcon}</span>
          <strong>{decisionText}</strong>
        </div>
        <div className="vote-total vote-total-reject"><span>{text("反对", "Reject")}</span><strong>{rejectSeats.length}</strong></div>
      </div>

      <div className="vote-balance" role="img" aria-label={text(`赞成 ${Math.round(agreePercent)}%，反对 ${Math.round(rejectPercent)}%，未记录或弃票 ${Math.round(missingPercent)}%`, `${Math.round(agreePercent)}% approve, ${Math.round(rejectPercent)}% reject, ${Math.round(missingPercent)}% missing or abstained`)}>
        {agreePercent > 0 && <span className="vote-balance-agree" style={{ width: `${agreePercent}%` }} />}
        {rejectPercent > 0 && <span className="vote-balance-reject" style={{ width: `${rejectPercent}%` }} />}
        {missingPercent > 0 && <span className="vote-balance-missing" style={{ width: `${missingPercent}%` }} />}
      </div>

      <div className="vote-seat-grid" role="list" aria-label={text("逐座位投票记录", "Votes by seat")}>
        {seats.map((seat) => {
          const vote = votes[seat];
          const statusClass = vote === "agree" ? "agree" : vote === "reject" ? "reject" : "missing";
          return (
            <div className={`vote-seat-card ${statusClass}`} key={seat} role="listitem">
              <span className="vote-seat-name">{seatLabel(seat)}</span>
              <strong>{voteLabel(vote)}</strong>
            </div>
          );
        })}
      </div>

      <p className={`vote-boundary-note ${missingSeats.length || hasResultConflict ? "warning" : ""}`}>
        {missingSeats.length > 0
          ? text(`未记录／弃票：${missingSeats.map(seatLabel).join("、")}。这些座位未被自动计入反对票。`, `Missing/abstained: ${missingSeats.map(seatLabel).join(", ")}. These seats are not automatically counted as Reject.`)
          : hasResultConflict
          ? text("票数计算结果与原始对局记录中的通过状态不一致，请以原始记录为准并检查数据。", "The calculated vote conflicts with the saved result. Check the original record.")
          : isTie
          ? text("赞成票未超过反对票；平票按组队未通过处理。", "Approve did not exceed Reject; a tie rejects the team.")
          : text("已记录全部玩家投票，结果与原始投票记录一致。", "All votes are recorded and match the saved result.")}
      </p>
    </div>
  );
}
