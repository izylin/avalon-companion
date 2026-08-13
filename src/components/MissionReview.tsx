"use client";

import { useState } from "react";
import { effectiveIdentityTags, missionCardClass, missionLogsFor, type GameState, type Vote } from "@/lib/game";
import { useI18n } from "@/lib/i18n";
import { SeatSvg } from "./SeatSvg";
import { VoteResultGraphic } from "./VoteResultGraphic";

export function MissionReview({
  state,
  missionIndex,
  onChangeRecord
}: {
  state: GameState;
  missionIndex: number;
  onChangeRecord?: (missionIndex: number, result: "good" | "bad", votes?: Record<number, Vote>) => void;
}) {
  const { text } = useI18n();
  const seatLabel = (seat: number) => seat === 1 ? text("我", "Me") : text(`${seat}号`, `Seat ${seat}`);
  const voteLabel = (vote?: Vote) => vote === "agree" ? text("赞成", "Approve") : vote === "reject" ? text("反对", "Reject") : text("未记录", "Missing");
  const [editingMission, setEditingMission] = useState<number | null>(null);
  const [draftResult, setDraftResult] = useState<"good" | "bad">("good");
  const [draftVotes, setDraftVotes] = useState<Record<number, Vote>>({});
  const editing = editingMission === missionIndex;
  const logs = missionLogsFor(state, missionIndex);
  const finalLog = logs.slice().reverse().find((log) => log.missionResult) ?? logs.at(-1);
  const result = state.missionResults[missionIndex];
  const leaderText = finalLog ? seatLabel(finalLog.leaderSeat) : "";
  const failText = finalLog?.missionResult ? text(`失败票 ${finalLog.fails} 张，成功票 ${Math.max(0, finalLog.team.length - finalLog.fails)} 张`, `${finalLog.fails} Fail, ${Math.max(0, finalLog.team.length - finalLog.fails)} Success`) : text("暂无任务结算记录", "No quest result recorded");
  const canEdit = Boolean(result && onChangeRecord);
  const canEditVotes = Boolean(finalLog && !finalLog.resultOnly);
  const seats = Array.from({ length: state.playerCount }, (_, index) => index + 1);
  const agreeCount = seats.filter((seat) => draftVotes[seat] === "agree").length;
  const rejectCount = seats.filter((seat) => draftVotes[seat] === "reject").length;
  const missingCount = state.playerCount - agreeCount - rejectCount;
  const editedVotePassed = agreeCount > rejectCount;
  const canSave = !canEditVotes || (missingCount === 0 && editedVotePassed);

  function toggleEditor() {
    if (editing) {
      setEditingMission(null);
      return;
    }
    setDraftResult(result === "bad" ? "bad" : "good");
    setDraftVotes(finalLog ? { ...finalLog.votes } : {});
    setEditingMission(missionIndex);
  }

  function toggleDraftVote(seat: number) {
    setDraftVotes((current) => ({
      ...current,
      [seat]: current[seat] === "agree" ? "reject" : "agree"
    }));
  }

  return (
    <div className={missionCardClass(result)}>
      <div className="mission-review-head">
        <div>
          <h4>{text("最终结果", "Final result")}</h4>
          <p>
            {result === "good" ? text("好人任务成功", "Good succeeds") : result === "bad" ? text("坏人任务成功", "Evil succeeds") : text("尚未发车", "Not started")}
            {finalLog && !finalLog.resultOnly ? text(` · 第 ${finalLog.round} 次组队通过 · ${leaderText}队长`, ` · Proposal ${finalLog.round} approved · ${leaderText} leads`) : ""}
          </p>
        </div>
        {canEdit && (
          <button className="ghost-btn mission-edit-btn" type="button" onClick={toggleEditor}>
            {editing ? text("收起编辑", "Close editor") : text("编辑记录", "Edit record")}
          </button>
        )}
      </div>

      {editing && result && onChangeRecord && (
        <div className="mission-edit-panel">
          <div>
            <strong>{text("修改任务结果与投票", "Edit quest result and votes")}</strong>
            <span>
              {canEditVotes
                ? text("点击玩家可切换赞成或反对；保存后会回到当前正在进行的任务。", "Tap a player to toggle their vote. Saving returns to the current quest.")
                : text("本轮使用了快速记录，没有保存投票人员，因此只能修改任务结果。", "This was a quick record, so only the quest result can be changed.")}
            </span>
          </div>

          <div className="mission-edit-actions" aria-label={text("修改任务结果", "Edit quest result")}>
            <button
              type="button"
              className={draftResult === "good" ? "primary-btn" : "ghost-btn"}
              onClick={() => setDraftResult("good")}
            >
              {text("任务成功", "Success")}
            </button>
            <button
              type="button"
              className={draftResult === "bad" ? "primary-btn danger-primary" : "ghost-btn"}
              onClick={() => setDraftResult("bad")}
            >
              {text("任务失败", "Fail")}
            </button>
          </div>

          {canEditVotes && (
            <div className="mission-vote-editor">
              <div className="mission-vote-editor-head">
                <strong>{text("修改组队投票", "Edit team vote")}</strong>
                <span>{text("赞成", "Approve")} {agreeCount} · {text("反对", "Reject")} {rejectCount}</span>
              </div>
              <div className="mission-vote-edit-grid" role="group" aria-label={text("逐位修改组队投票", "Edit each player's vote")}>
                {seats.map((seat) => {
                  const vote = draftVotes[seat];
                  const statusClass = vote === "agree" ? "agree" : vote === "reject" ? "reject" : "missing";
                  return (
                    <button
                      key={seat}
                      type="button"
                      className={`mission-vote-edit-card ${statusClass}`}
                      onClick={() => toggleDraftVote(seat)}
                      aria-label={text(`${seatLabel(seat)}当前${voteLabel(vote)}，点击切换`, `${seatLabel(seat)} is ${voteLabel(vote)}; tap to toggle`)}
                    >
                      <span>{seatLabel(seat)}</span>
                      <strong>{voteLabel(vote)}</strong>
                    </button>
                  );
                })}
              </div>
              {!canSave && (
                <p className="mission-edit-warning">
                  {missingCount > 0
                    ? text(`还有 ${missingCount} 位玩家未记录投票。`, `${missingCount} player vote(s) are missing.`)
                    : text("最终执行任务的组队必须获得超过半数赞成票，请继续调整。", "The final quest team must have a strict majority. Adjust the votes.")}
                </p>
              )}
            </div>
          )}

          <div className="mission-edit-save-actions">
            <button className="ghost-btn" type="button" onClick={() => setEditingMission(null)}>{text("取消", "Cancel")}</button>
            <button
              className="primary-btn"
              type="button"
              disabled={!canSave}
              onClick={() => {
                onChangeRecord(missionIndex, draftResult, canEditVotes ? draftVotes : undefined);
                setEditingMission(null);
              }}
            >
              {text("保存修改", "Save changes")}
            </button>
          </div>
        </div>
      )}

      {finalLog?.resultOnly ? (
        <div className="result-only-review">
          <strong>{text("本轮为快速记录", "Quick record")}</strong>
          <span>{text("已跳过组队、投票和任务牌数量，只保存任务成功或失败。", "Team, vote, and card details were skipped; only the quest result was saved.")}</span>
        </div>
      ) : finalLog ? (
        <>
          <SeatSvg
            n={state.playerCount}
            leaderSeat={finalLog.leaderSeat}
            teamSeats={finalLog.team}
            voteMap={finalLog.votes}
            identityTags={effectiveIdentityTags(state, missionIndex)}
            captionTop={text(`队长 ${leaderText}`, `Leader: ${leaderText}`)}
            captionBottom={text(`上车 ${finalLog.team.map((s) => s === 1 ? "我" : s).join(",")}`, `Team: ${finalLog.team.map(seatLabel).join(", ")}`)}
          />
          <VoteResultGraphic votes={finalLog.votes} playerCount={state.playerCount} passed={finalLog.passed} />
          <div className="mission-table">
            <div className="mission-table-row"><span>{text("队伍", "Team")}</span><strong>{finalLog.team.map(seatLabel).join(text("、", ", "))}</strong></div>
            <div className="mission-table-row"><span>{text("任务牌", "Quest cards")}</span><strong>{failText}</strong></div>
          </div>
        </>
      ) : null}
    </div>
  );
}
