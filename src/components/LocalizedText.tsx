"use client";

import { useEffect } from "react";
import type { Language } from "./LanguageToggle";

// Existing screens were written before localization existed. Keeping the copy in one
// catalogue lets legacy components participate without changing their game-state APIs.
const en: Record<string, string> = {
  "规则": "Rules", "新开一局": "New game", "玩家人数": "Players", "本局角色": "Roles",
  "任务人数配置": "Mission sizes", "按官方标准": "Official setup", "我的座位": "My seat",
  "座位图会标记“我”": "The board marks you", "座位名称": "Seat names", "首轮队长": "First leader",
  "谁先发车": "Who leads first", "生成座位 · 进入对局": "Create seats · Start game",
  "指引": "Guide", "笔记": "Notes", "保存并返回": "Save and return", "不保存": "Don't save",
  "继续记录": "Keep recording", "返回重选": "Back to team selection", "结算投票": "Resolve vote",
  "结算任务": "Resolve mission", "收起": "Collapse", "跳过详细记录": "Skip detailed recording",
  "仅记任务成功": "Record mission success", "仅记任务失败": "Record mission failure",
  "我的笔记": "My notes", "刺杀环节": "Assassination", "任务回顾": "Mission review",
  "刺杀成功": "Assassination succeeds", "刺杀失败": "Assassination fails", "红方胜": "Evil wins",
  "蓝方胜": "Good wins", "本局结算": "Game result", "蓝方胜利": "Good wins", "红方胜利": "Evil wins",
  "返回首页": "Back to home", "完成编辑": "Done editing", "编辑座位图": "Edit seat layout",
  "恢复默认排布": "Restore default layout", "执行中": "Mission in progress", "反馈": "Feedback",
  "反馈问题": "Report feedback", "关闭": "Close", "撤销": "Undo", "清空": "Clear",
  "提交反馈": "Send feedback", "提交": "Submit", "提交中…": "Submitting…", "提交成功": "Feedback sent",
  "方框": "Box", "箭头": "Arrow", "画笔": "Pen", "遮盖": "Redact"
};

const originals = new WeakMap<Text, string>();

function replaceText(node: Text, language: Language) {
  const current = node.nodeValue;
  if (!current) return;
  const source = originals.get(node) ?? current;
  originals.set(node, source);
  const translated = language === "en" ? en[source.trim()] : source.trim();
  node.nodeValue = source.replace(source.trim(), translated);
}

export function LocalizedText({ language }: { language: Language }) {
  useEffect(() => {
    const translate = (root: Node) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) replaceText(node as Text, language);
    };
    translate(document.body);
    const observer = new MutationObserver((records) => {
      for (const record of records) for (const node of record.addedNodes) translate(node);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);
  return null;
}
