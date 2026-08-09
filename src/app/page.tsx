"use client";

import { useEffect, useMemo, useState } from "react";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { IdentityTagsPanel } from "@/components/IdentityTagsPanel";
import { LaunchHistory } from "@/components/LaunchHistory";
import { MissionPager } from "@/components/MissionPager";
import { MissionReview } from "@/components/MissionReview";
import { RulesScreen } from "@/components/RulesScreen";
import { SeatSvg } from "@/components/SeatSvg";
import { TutorialGuide, type TutorialStep } from "@/components/TutorialGuide";
import { useI18n } from "@/lib/i18n";
import {
  allAgreeVotes,
  appendHistory,
  completeMissionLaunch,
  defaultConfig,
  editMissionRecord,
  effectiveIdentityTags,
  failsNeeded,
  finalizeMission,
  freshState,
  isSavedGameState,
  loadHistoryStats,
  logLaunch,
  missionCardClass,
  missionSizeTable,
  normalizeState,
  peekSavedSummary,
  playerCounts,
  recordMissionResultOnly,
  resolveAssassination,
  roleKeys,
  roles,
  storageKey,
  themeStorageKey,
  togglesFor,
  type GameState,
  type HistoryEntry,
  type IdentityTag,
  type RoleKey,
  type SaveSummary,
  type Screen,
  type SeatPoint,
  type Vote
} from "@/lib/game";

const tourStorageKey = "avalon_note_tour_v1";
// 产品需求 #12：当前迭代隐藏所有“从存档继续”入口，但保留存档读写与恢复代码，便于后续重新开放。
const continueFromSaveEnabled = false;
const tutorialStepsZh: TutorialStep[] = [
  {
    selector: '[data-tour="mission-progress"]',
    title: "任务进度",
    description: "这里展示五轮任务的进展。完成任务后，可点击对应任务回看当轮的组队、投票与任务结果。"
  },
  {
    selector: '[data-tour="identity-tags"]',
    title: "身份推测卡",
    description: "这里用于记录您对玩家身份的推测。请先选择一个身份标签，再点击对应座位，即可从当前任务起标记该玩家。"
  },
  {
    selector: '[data-tour="seat-board"]',
    title: "座位与组队",
    description: "圆桌对应现场座位。组队阶段点击座位选择上车玩家；投票阶段点击座位切换赞成或反对。长按座位还可调整位置。"
  },
  {
    selector: '[data-tour="mission-actions"]',
    title: "推进本轮",
    description: "完成当前步骤后，在这里确认组队、结算投票或结算任务。每次操作都会同步保存本局记录。"
  },
  {
    selector: '[data-tour="notes-entry"]',
    title: "对局笔记",
    description: "点击这里记录可疑发言、身份推测与复盘线索。返回战况页面后，笔记内容仍会保留。"
  },
  {
    selector: '[data-tour="quick-record"]',
    title: "跳过详细记录",
    description: "现场来不及逐项记录时，可在页面底部使用这里，跳过组队、投票和任务牌数量，只保存本轮任务成功或失败。"
  }
];
const tutorialStepsEn: TutorialStep[] = [
  { selector: '[data-tour="mission-progress"]', title: "Quest progress", description: "Track all five quests here. Select a completed quest to review its team, vote, and result." },
  { selector: '[data-tour="identity-tags"]', title: "Identity notes", description: "Choose an identity tag, then tap a seat to record your deduction from the current quest onward." },
  { selector: '[data-tour="seat-board"]', title: "Seats and teams", description: "Tap seats to propose a team or record votes. Press and hold a seat to move it." },
  { selector: '[data-tour="mission-actions"]', title: "Advance the quest", description: "Confirm the team, resolve the vote, or resolve the quest here. Every action is saved locally." },
  { selector: '[data-tour="notes-entry"]', title: "Game notes", description: "Record suspicious claims, identity deductions, and review notes. They remain saved when you return." },
  { selector: '[data-tour="quick-record"]', title: "Skip details", description: "When time is short, skip team, vote, and card details and record only whether the quest succeeded or failed." }
];

function formatRelativeTime(ms?: number) {
  if (!ms) return "本机存档";
  const minutes = Math.floor((Date.now() - ms) / 60000);
  if (minutes < 1) return "刚刚保存";
  if (minutes < 60) return `${minutes} 分钟前保存`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前保存`;
  return `${Math.floor(hours / 24)} 天前保存`;
}

function formatShortDate(ms: number) {
  const d = new Date(ms);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function persistState(nextState: GameState) {
  try {
    const serialized = JSON.stringify({ ...nextState, updatedAt: Date.now() });
    if (serialized.length > 256 * 1024) return false;
    localStorage.setItem(storageKey, serialized);
    return true;
  } catch {
    return false;
  }
}

export default function Home() {
  const { locale, setLocale, text } = useI18n();
  const tutorialSteps = locale === "zh" ? tutorialStepsZh : tutorialStepsEn;
  const [screen, setScreen] = useState<Screen>("home");
  const [setupCount, setSetupCount] = useState(8);
  const [setupRoles, setSetupRoles] = useState<Record<RoleKey, boolean>>(togglesFor(8));
  const [setupLeader, setSetupLeader] = useState(1);
  const [state, setState] = useState<GameState | null>(null);
  const [showSave, setShowSave] = useState(false);
  const [viewMissionIndex, setViewMissionIndex] = useState<number | null>(null);
  const [selectedIdentityTag, setSelectedIdentityTag] = useState<IdentityTag | null>(null);
  const [editingSeats, setEditingSeats] = useState(false);
  const [savedSummary, setSavedSummary] = useState<SaveSummary | null>(null);
  const [historyStats, setHistoryStats] = useState<{ total: number; blue: number; red: number; recent: HistoryEntry[] } | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [tourOpen, setTourOpen] = useState(false);
  const [quickRecordOpen, setQuickRecordOpen] = useState(false);

  useEffect(() => {
    // Deferred to an effect (rather than computed during render) so the first client
    // render matches the server-rendered markup before reading localStorage.
    if (screen !== "home") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSavedSummary(peekSavedSummary());
    setHistoryStats(loadHistoryStats());
  }, [screen]);

  useEffect(() => {
    const saved = localStorage.getItem(themeStorageKey);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((cur) => (cur === "dark" ? "light" : "dark"));
  }

  const filler = useMemo(() => {
    const cfg = defaultConfig[setupCount];
    const redSpecialsOn = roleKeys.filter((key) => roles[key].side === "red" && setupRoles[key]).length;
    const blueSpecialsOn = roleKeys.filter((key) => roles[key].side === "blue" && setupRoles[key]).length;
    const assassinMissing = !setupRoles.assassin;
    return {
      redSpecialsOn,
      minionCount: cfg.red - redSpecialsOn,
      loyalCount: cfg.blue - blueSpecialsOn,
      assassinMissing,
      ok: !assassinMissing && redSpecialsOn <= cfg.red && cfg.blue >= blueSpecialsOn
    };
  }, [setupCount, setupRoles]);

  function goTo(next: Screen) {
    setShowSave(false);
    setQuickRecordOpen(false);
    setScreen(next);
  }

  function startNewGame() {
    setSetupCount(8);
    setSetupRoles(togglesFor(8));
    setSetupLeader(1);
    setViewMissionIndex(null);
    goTo("setup");
  }

  function changeSetupCount(nextCount: number) {
    setSetupCount(nextCount);
    setSetupRoles(togglesFor(nextCount));
    setSetupLeader((leader) => Math.min(leader, nextCount));
  }

  function continueGame() {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    let saved: GameState;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isSavedGameState(parsed)) throw new Error("invalid save");
      saved = parsed;
    } catch {
      localStorage.removeItem(storageKey);
      alert(text("存档数据已损坏，已清除，请新开一局", "The saved game was invalid and has been cleared. Please start a new game."));
      return;
    }
    setState(normalizeState(saved));
    setViewMissionIndex(null);
    goTo("record");
  }

  function discardSaveAndReturnHome() {
    localStorage.removeItem(storageKey);
    setState(null);
    setViewMissionIndex(null);
    goTo("home");
  }

  function updateState(updater: (current: GameState) => GameState) {
    setState((current) => {
      if (!current) return current;
      const next = updater(current);
      if (!persistState(next)) {
        alert(text("保存失败：记录过大或浏览器存储空间不足", "Could not save: the record is too large or browser storage is full."));
      }
      if (next.finished && !current.finished && next.winner) {
        appendHistory({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          playerCount: next.playerCount,
          winner: next.winner,
          missionResults: next.missionResults,
          finishedAt: Date.now()
        });
      }
      return next;
    });
  }

  function toggleIdentityTag(seat: number, tag: IdentityTag) {
    updateState((cur) => {
      const missionIndex = cur.currentMission;
      const identityTagEvents = [...(cur.identityTagEvents ?? [])];
      const activeAtMission = (event: { startMission: number; endMission?: number }) => (
        event.startMission <= missionIndex &&
        (event.endMission === undefined || missionIndex < event.endMission)
      );
      const activeIndex = identityTagEvents.findLastIndex((event) => (
        event.seat === seat && event.tag === tag && activeAtMission(event)
      ));

      if (activeIndex >= 0) {
        identityTagEvents[activeIndex] = { ...identityTagEvents[activeIndex], endMission: missionIndex };
      } else {
        identityTagEvents.forEach((event, index) => {
          if (event.seat === seat && activeAtMission(event)) {
            identityTagEvents[index] = { ...event, endMission: missionIndex };
          }
        });
        identityTagEvents.push({ seat, tag, startMission: missionIndex });
      }

      return { ...cur, identityTagEvents };
    });
  }

  function moveSeat(seat: number, point: SeatPoint) {
    updateState((cur) => ({ ...cur, seatLayout: { ...cur.seatLayout, [seat]: point } }));
  }

  function resetSeatLayout() {
    updateState((cur) => {
      const next = { ...cur };
      delete next.seatLayout;
      return next;
    });
  }

  function handleSeatWithIdentityFallback(seat: number, fallback: (seat: number) => void) {
    if (selectedIdentityTag) {
      toggleIdentityTag(seat, selectedIdentityTag);
      return;
    }
    fallback(seat);
  }

  function beginGame() {
    if (!filler.ok) return;
    const next = freshState(setupCount, setupRoles, setupLeader);
    setState(next);
    setViewMissionIndex(null);
    persistState(next);
    setTourOpen(localStorage.getItem(tourStorageKey) !== "done");
    goTo("record");
  }

  function closeTour() {
    localStorage.setItem(tourStorageKey, "done");
    setTourOpen(false);
  }

  function toggleTeamSeat(seat: number) {
    updateState((cur) => {
      const exists = cur.pickedTeam.includes(seat);
      if (!exists && cur.pickedTeam.length >= cur.missionSizes[cur.currentMission]) return cur;
      return { ...cur, pickedTeam: exists ? cur.pickedTeam.filter((s) => s !== seat) : [...cur.pickedTeam, seat].sort((a, b) => a - b) };
    });
  }

  function toggleVoteSeat(seat: number) {
    updateState((cur) => {
      const votes = { ...cur.votes };
      votes[seat] = votes[seat] === "agree" ? "reject" : "agree";
      return { ...cur, votes };
    });
  }

  function quickRecordMission(result: "good" | "bad") {
    setQuickRecordOpen(false);
    updateState((cur) => finalizeMission(recordMissionResultOnly(cur, result), result));
  }

  function changeMissionRecord(missionIndex: number, result: "good" | "bad", votes?: Record<number, Vote>) {
    updateState((cur) => editMissionRecord(cur, missionIndex, result, votes));
    // 修改历史任务只更新该轮记录，不倒退当前流程；完成后回到正在进行的任务。
    setViewMissionIndex(null);
  }

  const currentSize = state ? state.missionSizes[state.currentMission] : 0;
  const leaderSeat = state ? state.leaderIndex + 1 : 1;
  const activeScreen = state?.awaitingAssassination && screen === "record"
    ? "assassinate"
    : state?.finished && screen === "record"
    ? "result"
    : screen;
  const displayedMissionIndex = state ? Math.min(viewMissionIndex ?? state.currentMission, state.missionResults.length - 1) : 0;
  const isLiveMissionView = state ? displayedMissionIndex === state.currentMission && !state.finished : false;
  const displayedIdentityTags = state ? effectiveIdentityTags(state, displayedMissionIndex) : {};

  return (
    <main className="page-wrap">
      <div className="app-container">
        <div className="app-screen">
            {activeScreen === "home" && (
              <section className="screen screen-auto">
              <div className="home-shell">
                <nav className="app-nav top-nav">
                  <div className="brand"><span className="brand-mark">A</span><span>Avalon Note</span></div>
                  <div className="top-nav-links">
                    <button className="nav-link" onClick={() => setLocale(locale === "zh" ? "en" : "zh")}>{locale === "zh" ? "EN" : "中文"}</button>
                    <button className="nav-link" onClick={() => goTo("rules")}>{text("规则", "Rules")}</button>
                    <button className="icon-btn" aria-label={text("切换主题", "Toggle theme")} onClick={toggleTheme}>{theme === "dark" ? "☀️" : "🌙"}</button>
                  </div>
                </nav>

                <div className="hero home-hero">
                  <svg className="hero-motif" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
                    <circle cx="200" cy="200" r="150" fill="none" stroke="currentColor" strokeWidth="1" />
                    <circle cx="200" cy="200" r="108" fill="none" stroke="currentColor" strokeWidth="1" />
                    <circle cx="200" cy="200" r="66" fill="none" stroke="currentColor" strokeWidth="1" />
                    <line x1="200" y1="30" x2="200" y2="370" stroke="currentColor" strokeWidth="1" />
                    <line x1="30" y1="200" x2="370" y2="200" stroke="currentColor" strokeWidth="1" />
                    <line x1="72" y1="72" x2="328" y2="328" stroke="currentColor" strokeWidth="1" />
                    <line x1="328" y1="72" x2="72" y2="328" stroke="currentColor" strokeWidth="1" />
                  </svg>
                  <div className="hero-content">
                    <span className="eyebrow">{text("线下阿瓦隆 · 现场记录", "Avalon companion · Live notepad")}</span>
                    <h1 className="home-title">{text("阿瓦隆笔记本", "Avalon Notepad")}</h1>
                    <p className="home-subtitle">{text("记录组队、投票与任务结果，全部数据只保存在本机。", "Track teams, votes, and quest results. All game data stays on this device.")}</p>
                    <div className="hero-actions">
                      {continueFromSaveEnabled && savedSummary && !savedSummary.finished && (
                        <button className="primary-btn" onClick={continueGame}>{text("继续当前对局", "Continue game")}</button>
                      )}
                      <button
                        className={continueFromSaveEnabled && savedSummary && !savedSummary.finished ? "ghost-btn" : "primary-btn"}
                        onClick={startNewGame}
                      >
                        {text("新开一局", "New game")}
                      </button>
                    </div>
                    {continueFromSaveEnabled && savedSummary && !savedSummary.finished && (
                      <p className="hero-save-meta">
                        {savedSummary.playerCount} 人局 · 任务 {savedSummary.currentMission + 1}/{savedSummary.missionCount} · {formatRelativeTime(savedSummary.updatedAt)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="home-below-hero">
                  {historyStats && historyStats.total > 0 && (
                    <div className="stats-card">
                      <div className="section-title" style={{ margin: "0 0 12px" }}><h3>{text("本机战绩", "Local history")}</h3></div>
                      <div className="stats-grid">
                        <div className="stat-tile"><strong>{historyStats.total}</strong><span>{text("总局数", "Games")}</span></div>
                        <div className="stat-tile stat-blue"><strong>{historyStats.blue}</strong><span>{text("蓝方胜", "Good wins")}</span></div>
                        <div className="stat-tile stat-red"><strong>{historyStats.red}</strong><span>{text("红方胜", "Evil wins")}</span></div>
                      </div>
                      <div className="history-list">
                        {historyStats.recent.map((entry) => (
                          <div className="history-item" key={entry.id}>
                            <span className={`tag ${entry.winner === "blue" ? "blue" : "bad"}`}>{entry.winner === "blue" ? text("蓝方胜", "Good wins") : text("红方胜", "Evil wins")}</span>
                            <span className="history-meta">{entry.playerCount} {text("人局", "players")} · {formatShortDate(entry.finishedAt)}</span>
                            <span className="history-dots">
                              {entry.missionResults.filter(Boolean).map((r, i) => <i key={i} className={`mini-dot ${r === "good" ? "good" : "bad"}`} />)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="rules-summary-card">
                  <div>
                    <div className="section-title" style={{ margin: 0 }}><h3>{text("新手须知", "Quick start")}</h3></div>
                    <p>{text("蓝方完成三次任务获胜；红方靠破坏任务或事后刺杀梅林翻盘。队长每轮组队、全员表决，多数同意才能出发。", "Good wins three quests; Evil sabotages quests or assassinates Merlin. Each leader proposes a team, and everyone votes before it departs.")}</p>
                  </div>
                  <button className="ghost-btn" onClick={() => goTo("rules")}>{text("查看完整规则", "View full rules")}</button>
                </div>
              </div>
              </section>
            )}

            {activeScreen === "setup" && (
              <section className="screen">
                <nav className="app-nav">
                  <button className="icon-btn" onClick={() => goTo("home")}>‹</button>
                  <div className="brand">{text("新开一局", "New game")}</div>
                  <span style={{ width: 36 }} />
                </nav>
                <div className="section-title"><h3>{text("玩家人数", "Players")}</h3><span className="tag blue">{setupCount} {text("人局", "players")}</span></div>
                <div className="segmented" style={{ gridTemplateColumns: "repeat(6,1fr)" }}>
                  {playerCounts.map((n) => <button key={n} className={`segment ${n === setupCount ? "selected" : ""}`} onClick={() => changeSetupCount(n)}>{n}</button>)}
                </div>
                <div className="section-title"><h3>{text("本局角色", "Roles")}</h3><span className="tag">{text("红方特殊", "Evil specials")} {filler.redSpecialsOn}/{defaultConfig[setupCount].red}</span></div>
                <div className="role-grid">
                  {roleKeys.map((key) => (
                    <button key={key} className="role-chip" onClick={() => setSetupRoles((cur) => ({ ...cur, [key]: !cur[key] }))}>
                      <div><strong>{locale === "zh" ? roles[key].name : roles[key].enName}</strong><span className="sub">{locale === "zh" ? roles[key].sub : roles[key].enSub}</span></div>
                      <span className={`toggle ${setupRoles[key] ? "on" : ""}`} />
                    </button>
                  ))}
                </div>
                <p className={`warn-text ${filler.ok ? "" : "error"}`}>
                  {filler.ok
                    ? text(`自动补齐：${filler.loyalCount} 名忠臣（蓝方）、${filler.minionCount} 名爪牙（红方），共 ${setupCount} 人。`, `Auto-fill: ${filler.loyalCount} Loyal Servant(s) and ${filler.minionCount} Minion(s), ${setupCount} players total.`)
                    : filler.assassinMissing
                    ? text(`红方特殊角色不符合 ${setupCount} 人局要求：刺客为必选角色，请开启刺客。`, `The Assassin is required for a ${setupCount}-player game.`)
                    : text(`红方特殊角色不符合 ${setupCount} 人局要求：不能超过 ${defaultConfig[setupCount].red} 个。`, `A ${setupCount}-player game allows at most ${defaultConfig[setupCount].red} special Evil roles.`)}
                </p>
                <div className="section-title"><h3>{text("任务人数配置", "Quest team sizes")}</h3><span className="tag">{text("按官方标准", "Official rules")}</span></div>
                <div className="mission-table">
                  {missionSizeTable[setupCount].map((size, i) => <div className="mission-table-row" key={i}><span>{text("任务", "Quest")} {i + 1}</span><strong>{size} {text("人", "players")}{failsNeeded(setupCount, i) === 2 ? text("（需2张失败票）", " (2 Fails required)") : ""}</strong></div>)}
                </div>
                <div className="section-title"><h3>{text("首轮队长", "First leader")}</h3><span className="tag">{text("谁先发车", "First proposal")}</span></div>
                <div className="segmented" style={{ gridTemplateColumns: `repeat(${Math.min(setupCount, 6)},1fr)` }}>
                  {Array.from({ length: setupCount }, (_, i) => i + 1).map((seat) => <button key={seat} className={`segment ${seat === setupLeader ? "selected" : ""}`} onClick={() => setSetupLeader(seat)}>{seat === 1 ? text("我", "Me") : text(`${seat}号`, `Seat ${seat}`)}</button>)}
                </div>
                <button className="primary-btn" style={{ width: "100%", marginTop: 18 }} disabled={!filler.ok} onClick={beginGame}>{text("生成座位 · 进入对局", "Create seats · Start game")}</button>
              </section>
            )}

            {activeScreen === "rules" && <RulesScreen onBack={() => goTo("home")} full />}
            {activeScreen === "rulesInGame" && <RulesScreen onBack={() => goTo("record")} full />}

            {activeScreen === "record" && state && (
              <section className="screen">
                <nav className="app-nav-3col">
                  <div className="nav-left">
                    <button className="icon-btn" onClick={() => setShowSave(true)}>‹</button>
                    <button className="ghost-btn" onClick={() => goTo("rulesInGame")}>{text("规则", "Rules")}</button>
                  </div>
                  <div className="nav-center">{text(`${state.playerCount} 人局战况`, `${state.playerCount}-player game`)}</div>
                  <div className="nav-right nav-actions">
                    <button className="ghost-btn" onClick={() => setTourOpen(true)}>{text("指引", "Guide")}</button>
                    <button className="ghost-btn" data-tour="notes-entry" onClick={() => goTo("notes")}>{text("笔记", "Notes")}</button>
                  </div>
                </nav>
                {showSave && (
                  <div className="save-confirm">
                    <strong>{text("返回前是否保存本局记录？", "Save this game before leaving?")}</strong>
                    <p>{text("点击左上角返回时弹出，避免误退丢失当前推理。", "Your current deductions are stored locally when you save.")}</p>
                    <div className="confirm-actions">
                      <button className="primary-btn" onClick={() => { if (state) persistState(state); goTo("home"); }}>{text("保存并返回", "Save and leave")}</button>
                      <button className="ghost-btn" onClick={discardSaveAndReturnHome}>{text("不保存", "Discard")}</button>
                      <button className="ghost-btn" onClick={() => setShowSave(false)}>{text("继续记录", "Keep playing")}</button>
                    </div>
                  </div>
                )}
                <div data-tour="mission-progress">
                  <MissionPager state={state} selectedMissionIndex={displayedMissionIndex} onSelect={setViewMissionIndex} />
                </div>
                {isLiveMissionView ? (
                  <div className={missionCardClass(state.missionResults[state.currentMission])}>
                    {state.rejectStreak > 0 && <div className="reset-banner">{text(`已连续 ${state.rejectStreak} 次组队被否决${state.rejectStreak >= 4 ? "，本次为强制轮，将直接出发不再表决" : ""}`, `${state.rejectStreak} consecutive proposal rejection(s)${state.rejectStreak >= 4 ? "; this team proceeds automatically" : ""}`)}</div>}
                    <div className="seat-layout-bar">
                      <button
                        className={editingSeats ? "primary-btn seat-layout-btn" : "ghost-btn seat-layout-btn"}
                        onClick={() => { setEditingSeats((on) => !on); setSelectedIdentityTag(null); }}
                      >
                        {editingSeats ? text("完成编辑", "Done editing") : text("编辑座位图", "Edit seats")}
                      </button>
                      <span className="seat-layout-hint">
                        {editingSeats ? text("拖动座位以贴合现场牌桌，编辑期间不会改动上车与投票记录。", "Drag seats to match the table. Team and vote records will not change.") : text("长按座位可直接拖动调整位置。", "Press and hold a seat to move it.")}
                      </span>
                      {state.seatLayout && <button className="ghost-btn seat-layout-btn" onClick={resetSeatLayout}>{text("恢复默认排布", "Reset layout")}</button>}
                    </div>
                    {state.phase === "team" && (
                    <>
                      <h4>{text(`第 ${state.rejectStreak + 1} 次组队 · ${leaderSeat === 1 ? "我" : `${leaderSeat}号`}队长`, `Proposal ${state.rejectStreak + 1} · ${leaderSeat === 1 ? "Me" : `Seat ${leaderSeat}`} leads`)}</h4>
                      <p>{text(`需选出 ${currentSize} 人组队，当前已选 ${state.pickedTeam.length} 人`, `Choose ${currentSize} players; ${state.pickedTeam.length} selected`)}</p>
                      <div className="seat-identity-stage">
                        <IdentityTagsPanel state={state} activeTags={displayedIdentityTags} selectedTag={selectedIdentityTag} onSelect={setSelectedIdentityTag} />
                        <SeatSvg tourTarget="seat-board" seatLayout={state.seatLayout} editing={editingSeats} onSeatMove={moveSeat} n={state.playerCount} leaderSeat={leaderSeat} teamSeats={state.pickedTeam} identityTags={displayedIdentityTags} onSeatClick={(seat) => handleSeatWithIdentityFallback(seat, toggleTeamSeat)} captionTop={text(`队长 ${leaderSeat === 1 ? "我" : `${leaderSeat}号`}`, `Leader: ${leaderSeat === 1 ? "Me" : `Seat ${leaderSeat}`}`)} captionBottom={text(`需上车 ${currentSize} 人`, `${currentSize} required`)} />
                      </div>
                      <button className="primary-btn" data-tour="mission-actions" style={{ width: "100%" }} disabled={state.pickedTeam.length !== currentSize} onClick={() => updateState((cur) => cur.rejectStreak >= 4 ? { ...cur, votes: allAgreeVotes(cur.playerCount), phase: "mission", missionFailVotes: 0 } : { ...cur, votes: allAgreeVotes(cur.playerCount), phase: "vote" })}>{state.rejectStreak >= 4 ? text("确认组队（强制出发）", "Confirm team (automatic)") : text("确认组队，进入投票", "Confirm team · Vote")}</button>
                    </>
                    )}
                    {state.phase === "vote" && (
                    <>
                      <h4>{text(`第 ${state.rejectStreak + 1} 次组队表决`, `Proposal ${state.rejectStreak + 1} vote`)}</h4>
                      <p>{text(`队伍：${state.pickedTeam.map((s) => s === 1 ? "我" : `${s}号`).join("、")}，请记录每位玩家的投票`, `Team: ${state.pickedTeam.map((s) => s === 1 ? "Me" : `Seat ${s}`).join(", ")}. Record every vote.`)}</p>
                      <div className="seat-identity-stage">
                        <IdentityTagsPanel state={state} activeTags={displayedIdentityTags} selectedTag={selectedIdentityTag} onSelect={setSelectedIdentityTag} />
                        <SeatSvg tourTarget="seat-board" seatLayout={state.seatLayout} editing={editingSeats} onSeatMove={moveSeat} n={state.playerCount} leaderSeat={leaderSeat} teamSeats={state.pickedTeam} voteMap={state.votes} identityTags={displayedIdentityTags} onSeatClick={(seat) => handleSeatWithIdentityFallback(seat, toggleVoteSeat)} captionTop={text(`队长 ${leaderSeat === 1 ? "我" : `${leaderSeat}号`}`, `Leader: ${leaderSeat === 1 ? "Me" : `Seat ${leaderSeat}`}`)} captionBottom={text(`上车 ${state.pickedTeam.map((s) => s === 1 ? "我" : s).join(",")}`, `Team: ${state.pickedTeam.map((s) => s === 1 ? "Me" : s).join(",")}`)} />
                      </div>
                      <div className="step-actions" data-tour="mission-actions">
                        <button className="ghost-btn" style={{ flex: 1 }} onClick={() => updateState((cur) => ({ ...cur, phase: "team", votes: {} }))}>{text("返回重选", "Change team")}</button>
                        <button className="primary-btn" style={{ flex: 1 }} disabled={Object.keys(state.votes).length !== state.playerCount} onClick={() => updateState((cur) => {
                          const agree = Object.values(cur.votes).filter((v) => v === "agree").length;
                          const reject = Object.values(cur.votes).filter((v) => v === "reject").length;
                          const passed = agree > reject;
                          const logged = logLaunch(cur, { passed });
                          return passed ? { ...logged, phase: "mission", missionFailVotes: 0, rejectStreak: 0 } : { ...logged, rejectStreak: logged.rejectStreak + 1, leaderIndex: (logged.leaderIndex + 1) % logged.playerCount, pickedTeam: [], votes: {}, phase: "team" };
                        })}>{text("结算投票", "Resolve vote")}</button>
                      </div>
                    </>
                    )}
                    {state.phase === "mission" && (
                    <>
                      <h4>{text("执行中", "Quest in progress")}</h4>
                      <p>{text(`上车 ${state.pickedTeam.length} 人暗中提交任务牌，请填写本次任务收到的失败票数量。`, `${state.pickedTeam.length} players secretly submit quest cards. Enter the number of Fail cards.`)}</p>
                      <div className="seat-identity-stage">
                        <IdentityTagsPanel state={state} activeTags={displayedIdentityTags} selectedTag={selectedIdentityTag} onSelect={setSelectedIdentityTag} />
                        <SeatSvg tourTarget="seat-board" seatLayout={state.seatLayout} editing={editingSeats} onSeatMove={moveSeat} n={state.playerCount} leaderSeat={leaderSeat} teamSeats={state.pickedTeam} identityTags={displayedIdentityTags} onSeatClick={selectedIdentityTag ? (seat) => toggleIdentityTag(seat, selectedIdentityTag) : undefined} captionTop={text("上车执行中", "Quest team active")} captionBottom={text(`需${failsNeeded(state.playerCount, state.currentMission)}张失败票才算失败`, `${failsNeeded(state.playerCount, state.currentMission)} Fail required`)} />
                      </div>
                      <div className="fail-vote-counter">
                        <button className="counter-btn" disabled={state.missionFailVotes <= 0} onClick={() => updateState((cur) => ({ ...cur, missionFailVotes: Math.max(0, cur.missionFailVotes - 1) }))}>－</button>
                        <div className="counter-display"><div className="counter-main"><strong>{state.missionFailVotes}</strong> {text("张失败票", "Fail card(s)")}</div><div className="counter-sub">{text(`成功票 ${state.pickedTeam.length - state.missionFailVotes} 张 · 共 ${state.pickedTeam.length} 人`, `${state.pickedTeam.length - state.missionFailVotes} Success · ${state.pickedTeam.length} players`)}</div></div>
                        <button className="counter-btn" disabled={state.missionFailVotes >= state.pickedTeam.length} onClick={() => updateState((cur) => ({ ...cur, missionFailVotes: Math.min(cur.pickedTeam.length, cur.missionFailVotes + 1) }))}>＋</button>
                      </div>
                      <button className="primary-btn" data-tour="mission-actions" style={{ width: "100%" }} onClick={() => updateState((cur) => {
                        const result = cur.missionFailVotes >= failsNeeded(cur.playerCount, cur.currentMission) ? "bad" : "good";
                        return finalizeMission(completeMissionLaunch(cur, result), result);
                      })}>{text("结算任务", "Resolve quest")}</button>
                    </>
                    )}
                  </div>
                ) : (
                  <MissionReview
                    state={state}
                    missionIndex={displayedMissionIndex}
                    onChangeRecord={changeMissionRecord}
                  />
                )}
                <LaunchHistory state={state} missionIndex={displayedMissionIndex} />
                {isLiveMissionView && (
                  <div className="quick-record-footer">
                    <button
                      className="quick-record-trigger"
                      data-tour="quick-record"
                      type="button"
                      aria-expanded={quickRecordOpen}
                      onClick={() => setQuickRecordOpen((open) => !open)}
                    >
                      {quickRecordOpen ? text("收起", "Collapse") : text("跳过详细记录", "Skip details")}
                    </button>
                    {quickRecordOpen && (
                      <div className="quick-record-panel" aria-label={text("只记录任务结果", "Record quest result only")}>
                        <button className="primary-btn" type="button" onClick={() => quickRecordMission("good")}>{text("仅记任务成功", "Record Success only")}</button>
                        <button className="primary-btn danger-primary" type="button" onClick={() => quickRecordMission("bad")}>{text("仅记任务失败", "Record Fail only")}</button>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {activeScreen === "notes" && state && (
              <section className="screen">
                <nav className="app-nav">
                  <button className="icon-btn" onClick={() => goTo("record")}>‹</button>
                  <div className="brand">{text("我的笔记", "My notes")}</div>
                  <span style={{ width: 36 }} />
                </nav>
                <textarea className="notes-area" placeholder={text("在这里记录身份推测、可疑发言、车次复盘……", "Record identity deductions, suspicious claims, and quest reviews…")} value={state.notes} onChange={(event) => updateState((cur) => ({ ...cur, notes: event.target.value }))} />
              </section>
            )}

            {activeScreen === "assassinate" && state && (
              <section className="screen">
                <nav className="app-nav"><span style={{ width: 36 }} /><div className="brand">{text("刺杀环节", "Assassination")}</div><span style={{ width: 36 }} /></nav>
                <div className="hero hero-red">
                  <h3>{text("蓝方完成三次任务", "Good completed three quests")}</h3>
                  <p>{text("场上有刺客，请刺客线下指认梅林，然后在此记录刺杀结果。", "The Assassin now names Merlin. Record whether the assassination succeeds.")}</p>
                </div>
                <div className="section-title"><h3>{text("任务回顾", "Quest review")}</h3></div>
                <MissionPager state={state} selectedMissionIndex={displayedMissionIndex} onSelect={setViewMissionIndex} />
                <MissionReview
                  state={state}
                  missionIndex={displayedMissionIndex}
                  onChangeRecord={changeMissionRecord}
                />
                <div className="step-actions">
                  <button className="primary-btn assassin-btn" style={{ flex: 1 }} onClick={() => updateState((cur) => resolveAssassination(cur, true))}>
                    <span>{text("刺杀成功", "Assassination succeeds")}</span>
                    <small>{text("红方胜", "Evil wins")}</small>
                  </button>
                  <button className="ghost-btn assassin-btn" style={{ flex: 1 }} onClick={() => updateState((cur) => resolveAssassination(cur, false))}>
                    <span>{text("刺杀失败", "Assassination fails")}</span>
                    <small>{text("蓝方胜", "Good wins")}</small>
                  </button>
                </div>
              </section>
            )}

            {activeScreen === "result" && state && (
              <section className="screen">
                <nav className="app-nav"><span style={{ width: 36 }} /><div className="brand">{text("本局结算", "Game result")}</div><span style={{ width: 36 }} /></nav>
                <div className={`hero ${state.winner === "blue" ? "hero-blue" : "hero-red"}`}>
                  <h3>{state.winner === "blue" ? text("蓝方胜利", "Good wins") : text("红方胜利", "Evil wins")}</h3>
                  <p>
                    {state.winner === "blue"
                      ? (state.roleToggle.assassin ? text("蓝方完成三次任务，且成功抵挡刺客刺杀，蓝方获胜。", "Good completed three quests and survived the assassination.") : text("蓝方率先完成三次任务，蓝方获胜。", "Good completed three quests first."))
                      : (state.missionResults.filter((r) => r === "bad").length >= 3 ? text("红方率先破坏三次任务，红方获胜。", "Evil sabotaged three quests first.") : text("刺客成功刺杀梅林，红方逆转获胜。", "The Assassin identified Merlin, giving Evil the win."))}
                  </p>
                </div>
                <div className="section-title"><h3>{text("任务回顾", "Quest review")}</h3></div>
                <MissionPager state={state} selectedMissionIndex={displayedMissionIndex} onSelect={setViewMissionIndex} />
                <MissionReview
                  state={state}
                  missionIndex={displayedMissionIndex}
                  onChangeRecord={changeMissionRecord}
                />
                <button className="primary-btn" style={{ width: "100%" }} onClick={() => goTo("home")}>{text("返回首页", "Back to home")}</button>
              </section>
            )}
        </div>
        <p className="footer-note">{text("阿瓦隆笔记本", "Avalon Notepad")} · Next.js App Router</p>
      </div>
      <TutorialGuide open={tourOpen && activeScreen === "record"} steps={tutorialSteps} onClose={closeTour} />
      <FeedbackWidget screen={screen} />
    </main>
  );
}
