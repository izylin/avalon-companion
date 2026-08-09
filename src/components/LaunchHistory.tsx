import { missionLogsFor, type GameState } from "@/lib/game";
import { useI18n } from "@/lib/i18n";
import { VoteResultGraphic } from "./VoteResultGraphic";

export function LaunchHistory({ state, missionIndex }: { state: GameState; missionIndex: number }) {
  const { text } = useI18n();
  const logs = missionLogsFor(state, missionIndex);
  if (!logs.length) return null;
  return (
    <>
      <div className="section-title"><h3>{text("本局发车记录", "Team proposal history")}</h3></div>
      {logs.slice().reverse().map((log, index) => (
        <div className="launch-card" key={`${log.missionNo}-${log.round}-${index}`}>
          <div className="launch-head">
            <div>
              <h4>{log.resultOnly ? text("快速记录", "Quick record") : text(`第 ${log.round} 次组队 · ${log.leaderSeat === 1 ? "我" : `${log.leaderSeat}号`}队长`, `Proposal ${log.round} · ${log.leaderSeat === 1 ? "Me" : `Seat ${log.leaderSeat}`} leads`)}</h4>
              <p>{log.resultOnly ? text("未记录组队与投票详情", "Team and vote details were skipped") : text(`队伍：${log.team.map((s) => s === 1 ? "我" : `${s}号`).join(", ")}`, `Team: ${log.team.map((s) => s === 1 ? "Me" : `Seat ${s}`).join(", ")}`)}</p>
            </div>
            <span className={`tag ${log.missionResult === "good" ? "blue" : log.missionResult === "bad" || !log.passed ? "bad" : ""}`}>{log.missionResult === "good" ? text("好人任务成功", "Good succeeds") : log.missionResult === "bad" ? text("坏人任务成功", "Evil succeeds") : log.passed ? text("已通过表决", "Approved") : text("未通过", "Rejected")}</span>
          </div>
          {!log.resultOnly && <VoteResultGraphic votes={log.votes} playerCount={state.playerCount} passed={log.passed} />}
        </div>
      ))}
    </>
  );
}
