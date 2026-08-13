"use client";

import { useI18n } from "@/lib/i18n";

function RuleList({ short = false }: { short?: boolean }) {
  const { locale } = useI18n();
  const zhItems = short ? [
    ["阵营与目标", "分为红蓝两方，蓝方完成三次任务获胜，红方靠破坏任务或事后刺杀梅林翻盘。"],
    ["组队与投票", "队长每轮指定出任务的人选，全员表决是否同意，多数同意才能出发执行任务。"],
    ["任务与结算", "上车玩家暗中提交成功或失败，五局任务里先赢三局的一方决定走向。"]
  ] : [
    ["蓝方角色能力", "梅林知道除了莫德雷德以外的红方牌；派西维尔知道梅林和莫甘娜；忠臣无特殊能力。"],
    ["红方角色能力", "莫德雷德不会被梅林看见，莫甘娜伪装梅林，奥伯伦不参与坏人互认，刺客负责终局刺杀。"],
    ["开局流程", "梅林看到红方，除奥伯伦外的坏人互认，派西维尔看到梅林和莫甘娜。"],
    ["任务轮次", "队长挑选出任务人选，全员表决，多数同意则出发，否则换下一位队长重新组队。"],
    ["任务结算规则", "出任务玩家暗中提交成功或失败。8-10人局第4局需2张失败票才算失败，其余1张即可。"]
  ];
  const enItems = short ? [
    ["Sides and goal", "Good wins by completing three quests. Evil wins by sabotaging quests or assassinating Merlin at the end."],
    ["Teams and voting", "The leader proposes a quest team. Everyone votes, and the team proceeds only with a strict majority."],
    ["Quest resolution", "Players on the quest secretly submit Success or Fail. The first side to win three of five quests determines the endgame."]
  ] : [
    ["Good roles", "Merlin sees all Evil players except Mordred. Percival sees Merlin and Morgana. Loyal Servants have no special ability."],
    ["Evil roles", "Mordred is hidden from Merlin, Morgana appears as Merlin, Oberon does not know the other Evil players, and the Assassin acts at the end."],
    ["Opening information", "Merlin sees Evil, Evil players except Oberon recognize each other, and Percival sees Merlin and Morgana."],
    ["Quest rounds", "The leader proposes a team and everyone votes. A strict majority sends the team; otherwise leadership passes and a new team is proposed."],
    ["Quest rules", "Quest members secretly submit Success or Fail. Quest 4 requires two Fails with 8–10 players; every other quest requires one."]
  ];
  const items = locale === "zh" ? zhItems : enItems;
  return <div className="rules">{items.map(([title, body], i) => <div className="rule-row" key={title}><span className="rule-index">{i + 1}</span><div><h4>{title}</h4><p>{body}</p></div></div>)}</div>;
}

export { RuleList };

export function RulesScreen({ onBack, full = false }: { onBack: () => void; full?: boolean }) {
  const { text } = useI18n();
  return (
    <section className="screen">
      <nav className="app-nav">
        <button className="icon-btn" onClick={onBack}>‹</button>
        <div className="brand">{text("规则介绍", "Rules")}</div>
        <span style={{ width: 36 }} />
      </nav>
      <RuleList short={!full} />
    </section>
  );
}
