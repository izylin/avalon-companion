"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { AnnotationCanvas, type AnnotationHandle, type AnnotationTool } from "./AnnotationCanvas";
import { useI18n } from "@/lib/i18n";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string };

const TOOLS: { id: AnnotationTool; label: string; enLabel: string; hint: string; enHint: string }[] = [
  { id: "rect", label: "方框", enLabel: "Box", hint: "框出问题区域", enHint: "Outline the problem" },
  { id: "arrow", label: "箭头", enLabel: "Arrow", hint: "指向问题位置", enHint: "Point to the problem" },
  { id: "pen", label: "画笔", enLabel: "Pen", hint: "自由圈画", enHint: "Draw freely" },
  { id: "mask", label: "遮盖", enLabel: "Mask", hint: "涂掉不想上传的内容", enHint: "Hide sensitive content" }
];

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("截图解码失败"));
    img.src = dataUrl;
  });
}

export function FeedbackWidget({ screen }: { screen: string }) {
  const { locale, text } = useI18n();
  const [open, setOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [shot, setShot] = useState<HTMLImageElement | null>(null);
  const [shotError, setShotError] = useState<string | null>(null);
  const [tool, setTool] = useState<AnnotationTool>("rect");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const annotation = useRef<AnnotationHandle>(null);

  async function capture() {
    setCapturing(true);
    setShotError(null);
    // html-to-image copies computed styles (animation-* included) onto its clone, and the clone is
    // rasterised at t=0. Anything mid-animation — or animating from opacity 0, like .screen's fadeIn —
    // would otherwise be captured blank. Pin everything to its settled state for the duration.
    const freeze = document.createElement("style");
    freeze.textContent = "*, *::before, *::after { animation: none !important; transition: none !important; }";
    try {
      document.head.appendChild(freeze);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const dataUrl = await toPng(document.body, {
        // The widget must not appear inside the screenshot of the page it is reporting on.
        filter: (node) => !(node instanceof HTMLElement && node.dataset.feedbackRoot === "true"),
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        backgroundColor: getComputedStyle(document.body).backgroundColor
      });
      setShot(await loadImage(dataUrl));
    } catch {
      setShotError(text("截图失败，你仍然可以只提交文字描述。", "The screenshot failed. You can still submit text feedback."));
      setShot(null);
    } finally {
      freeze.remove();
      setCapturing(false);
    }
  }

  async function openPanel() {
    setStatus({ kind: "idle" });
    await capture();
    setOpen(true);
  }

  function closePanel() {
    setOpen(false);
    setShot(null);
    setShotError(null);
    setMessage("");
    setContact("");
    setTool("rect");
    setStatus({ kind: "idle" });
  }

  async function submit() {
    if (!message.trim()) return;
    setStatus({ kind: "sending" });
    try {
      const image = shot ? await annotation.current?.export() : null;
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          contact: contact.trim() || null,
          screenshot: image?.dataUrl ?? null,
          screenshotType: image?.mimeType ?? null,
          context: {
            screen,
            path: window.location.pathname,
            theme: document.documentElement.dataset.theme ?? "dark",
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            userAgent: navigator.userAgent,
            version: process.env.NEXT_PUBLIC_COMMIT_SHA ?? "dev",
            at: new Date().toISOString()
          }
        })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? text(`提交失败（${res.status}）`, `Submission failed (${res.status})`));
      }
      setStatus({ kind: "sent" });
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : text("提交失败，请重试。", "Submission failed. Please try again.") });
    }
  }

  return (
    <div data-feedback-root="true">
      {!open && (
        <button className="fb-fab" onClick={openPanel} disabled={capturing} aria-label={text("反馈问题", "Send feedback")}>
          {capturing ? "…" : text("反馈", "Feedback")}
        </button>
      )}

      {open && (
        <div className="fb-overlay" role="dialog" aria-modal="true" aria-label={text("提交反馈", "Submit feedback")}>
          <div className="fb-panel">
            <div className="fb-head">
              <h3>{text("反馈问题", "Send feedback")}</h3>
              <button className="fb-close" onClick={closePanel} aria-label={text("关闭", "Close")}>✕</button>
            </div>

            {status.kind === "sent" ? (
              <div className="fb-done">
                <strong>{text("反馈已收到", "Feedback received")}</strong>
                <p>{text("谢谢，我们会尽快看。", "Thank you. We'll take a look soon.")}</p>
                <button className="fb-primary" onClick={closePanel}>{text("关闭", "Close")}</button>
              </div>
            ) : (
              <>
                <div className="fb-body">
                  {shot && (
                    <>
                      <div className="fb-tools">
                        {TOOLS.map((t) => (
                          <button
                            key={t.id}
                            className={`fb-tool${tool === t.id ? " is-on" : ""}`}
                            onClick={() => setTool(t.id)}
                            title={locale === "zh" ? t.hint : t.enHint}
                          >
                            {locale === "zh" ? t.label : t.enLabel}
                          </button>
                        ))}
                        <span className="fb-tools-gap" />
                        <button className="fb-tool" onClick={() => annotation.current?.undo()}>{text("撤销", "Undo")}</button>
                        <button className="fb-tool" onClick={() => annotation.current?.clear()}>{text("清空", "Clear")}</button>
                      </div>
                      <div className="fb-shot">
                        <AnnotationCanvas image={shot} tool={tool} handleRef={annotation} />
                      </div>
                      <p className="fb-note">{text("在截图上圈出问题。用「遮盖」抹掉你不想上传的内容。", "Mark the issue on the screenshot. Use Mask to hide anything you do not want to upload.")}</p>
                    </>
                  )}

                  {shotError && <p className="fb-warn">{shotError}</p>}

                  <label className="fb-label" htmlFor="fb-message">{text("问题描述", "Description")}</label>
                  <textarea
                    id="fb-message"
                    className="fb-input"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={text("遇到了什么问题？或者你希望我们做什么？", "What went wrong, or what would you like us to add?")}
                  />

                  <label className="fb-label" htmlFor="fb-contact">{text("联系方式（选填）", "Contact (optional)")}</label>
                  <input
                    id="fb-contact"
                    className="fb-input"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder={text("微信 / 邮箱，方便我们追问", "Email or another way to follow up")}
                  />

                  <p className="fb-note">
                    {text(`将随反馈一起上传：${shot ? "你标注后的截图、" : ""}当前页面、浏览器与屏幕信息、主题、时间。不会上传玩家昵称与身份。`, `This feedback includes ${shot ? "your annotated screenshot, " : ""}the current page, browser and screen details, theme, and time. Player names and identities are not uploaded.`)}
                  </p>
                </div>

                <div className="fb-foot">
                  {status.kind === "error" && <span className="fb-error">{status.message}</span>}
                  <button className="fb-ghost" onClick={closePanel}>{text("取消", "Cancel")}</button>
                  <button
                    className="fb-primary"
                    onClick={submit}
                    disabled={!message.trim() || status.kind === "sending"}
                  >
                    {status.kind === "sending" ? text("提交中…", "Submitting…") : status.kind === "error" ? text("重试", "Retry") : text("提交", "Submit")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
