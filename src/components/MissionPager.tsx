import type { GameState } from "@/lib/game";
import { useI18n } from "@/lib/i18n";

export function MissionPager({
  state,
  selectedMissionIndex,
  onSelect
}: {
  state: GameState;
  selectedMissionIndex: number;
  onSelect: (missionIndex: number | null) => void;
}) {
  const { text } = useI18n();
  return (
    <div className="mission-pager">
      {state.missionResults.map((result, i) => {
        const isLiveMission = i === state.currentMission && !state.finished;
        const canOpen = Boolean(result) || isLiveMission;
        return (
          <button
            key={i}
            type="button"
            disabled={!canOpen}
            className={`pager-tab ${result === "good" ? "good-win" : ""} ${result === "bad" ? "bad-win" : ""} ${i === selectedMissionIndex ? "active" : ""}`}
            onClick={() => onSelect(isLiveMission ? null : i)}
          >
            <strong>{text("任务", "Quest")} {i + 1}</strong>{result === "good" ? text("好人成功", "Good succeeds") : result === "bad" ? text("坏人成功", "Evil succeeds") : text("未发车", "Not started")}
          </button>
        );
      })}
    </div>
  );
}
