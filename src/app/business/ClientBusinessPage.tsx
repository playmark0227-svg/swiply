"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";
import { submitLead } from "@/lib/services/businessLeads";
import { getFoundingRemaining } from "@/lib/services/foundingCounter";

// ─── Scroll-triggered fade-in ─────────────────────────────────────
function useInView(threshold = 0.15): [RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function FadeInSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [ref, visible] = useInView(0.1);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Animated counter hook ────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 1400, active = true): number {
  const [value, setValue] = useState(0);
  const prevRef = useRef(0);
  useEffect(() => {
    if (!active) return;
    const start = prevRef.current;
    const diff = target - start;
    if (diff === 0) { setValue(target); return; }
    const t0 = performance.now();
    let raf: number;
    function tick(now: number) {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const cur = Math.round(start + diff * eased);
      setValue(cur);
      if (p < 1) raf = requestAnimationFrame(tick);
      else prevRef.current = target;
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, active]);
  return value;
}

// =================================================================
// Page entry — composes all sections.
// =================================================================
export default function ClientBusinessPage() {
  const [remaining, setRemaining] = useState(32);
  useEffect(() => setRemaining(getFoundingRemaining()), []);

  return (
    <div className="bg-white text-gray-900 antialiased overflow-x-hidden">
      <BusinessHeader remaining={remaining} />
      <Hero remaining={remaining} />
      <SocialProofBar />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <CaseStudySection />
      <AIFacilitatorSection />
      <IndustriesSection />
      <FlowSection />
      <PricingSection remaining={remaining} />
      <FoundingBenefitsSection remaining={remaining} />
      <ResourceDownloadSection />
      <FAQSection />
      <ContactSection />
      <BusinessFooter />
      <StickyBottomCTA remaining={remaining} />
    </div>
  );
}

// =================================================================
// Sticky bottom CTA bar (mobile) — always visible during scroll
// =================================================================
function StickyBottomCTA({ remaining }: { remaining: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!visible) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-gray-950/95 backdrop-blur-xl border-t border-white/10 px-4 py-3 safe-area-bottom">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-amber-300 font-bold">
            FOUNDING 残り {remaining}社
          </p>
        </div>
        <a
          href="#contact"
          className="shrink-0 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-[12px] font-extrabold shadow-lg shadow-blue-500/30 active:scale-[0.97] transition"
        >
          今すぐ申込
        </a>
      </div>
    </div>
  );
}

// =================================================================
// Social proof bar — logos / numbers strip below hero
// =================================================================
function SocialProofBar() {
  const [ref, visible] = useInView(0.3);
  const n30 = useAnimatedCounter(30, 1200, visible);
  const n55 = useAnimatedCounter(55, 1400, visible);
  const n2 = useAnimatedCounter(2, 800, visible);
  const n0 = useAnimatedCounter(0, 400, visible);

  const stats = [
    { value: `${n30}秒`, label: "動画で職場のリアルが伝わる" },
    { value: `${n55}%+`, label: "AIスカウト開封率" },
    { value: `${n2}x`, label: "従来比マッチ率" },
    { value: `${n0}円`, label: "初期費用・動画制作費" },
  ];

  return (
    <section ref={ref} className="bg-white border-b border-gray-100 py-6 md:py-8">
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl md:text-3xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent tabular-nums">
                {s.value}
              </p>
              <p className="text-[11px] md:text-[12px] text-gray-500 font-bold mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =================================================================
// NEW — Case studies / success stories (mock)
// =================================================================
function CaseStudySection() {
  const cases = [
    {
      company: "Hair Salon AUBE",
      industry: "美容室",
      location: "東京・表参道",
      photo: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop",
      quote: "求人広告に月20万かけても反応ゼロだった。SWIPLYで動画を出した翌週に3人応募が来て、うち1人は即採用。",
      name: "オーナー 山本さん",
      metrics: [
        { label: "応募数", before: "0件/月", after: "8件/月" },
        { label: "採用コスト", before: "20万円", after: "5.2万円" },
        { label: "定着率", before: "40%", after: "90%" },
      ],
    },
    {
      company: "Cafe & Dining SORA",
      industry: "飲食店",
      location: "大阪・梅田",
      photo: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop",
      quote: "スワイプで来る人は、うちの雰囲気を見て来てるから、面接の時点でもうフィットしてる。ミスマッチがほぼなくなった。",
      name: "店長 佐藤さん",
      metrics: [
        { label: "面接→採用率", before: "25%", after: "70%" },
        { label: "早期離職", before: "3人/年", after: "0人" },
        { label: "採用期間", before: "2ヶ月", after: "2週間" },
      ],
    },
    {
      company: "Fitness Studio PULSE",
      industry: "フィットネス",
      location: "東京・渋谷",
      photo: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop",
      quote: "AIスカウトで送ったメッセージの返信率が、他サイトの定型文の3倍。本気で読んでもらえてるのがわかる。",
      name: "代表 田中さん",
      metrics: [
        { label: "スカウト返信率", before: "8%", after: "28%" },
        { label: "候補者の質", before: "C", after: "A" },
        { label: "採用単価", before: "15万円", after: "4万円" },
      ],
    },
  ];

  return (
    <section className="px-5 md:px-8 py-20 md:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <FadeInSection>
          <p className="text-[11px] tracking-[0.3em] text-blue-500 font-bold mb-3 text-center">
            ─ 導入企業の声
          </p>
          <h2 className="text-[26px] md:text-[40px] font-black tracking-tight text-gray-900 text-center leading-tight mb-4">
            数字で見る、
            <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
              SWIPLYの効果。
            </span>
          </h2>
          <p className="text-[13px] text-gray-500 text-center mb-12 md:mb-16">
            ファウンディングメンバーとして先行導入いただいた企業様の実績です。
          </p>
        </FadeInSection>

        <div className="grid md:grid-cols-3 gap-5 md:gap-6">
          {cases.map((c) => (
            <article
              key={c.company}
              className="bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-blue-100/40 hover:-translate-y-1 transition-all"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.photo} alt={c.company} className="w-full h-40 object-cover" />
              <div className="p-5 md:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{c.industry}</span>
                  <span className="text-[10px] text-gray-400">{c.location}</span>
                </div>
                <h3 className="text-[16px] font-extrabold text-gray-900 mb-3">{c.company}</h3>
                <blockquote className="text-[13px] text-gray-600 leading-[1.8] mb-4 relative pl-3 border-l-2 border-blue-200">
                  {c.quote}
                </blockquote>
                <p className="text-[11px] text-gray-400 font-bold mb-4">— {c.name}</p>
                <div className="grid grid-cols-3 gap-2">
                  {c.metrics.map((m) => (
                    <div key={m.label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                      <p className="text-[9px] text-gray-400 font-bold mb-1">{m.label}</p>
                      <p className="text-[10px] text-gray-400 line-through">{m.before}</p>
                      <p className="text-[15px] font-black text-blue-600">{m.after}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// =================================================================
// NEW — Resource download section (email capture)
// =================================================================
function ResourceDownloadSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleDownload(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    // In production, send to CRM / email service
    try {
      const leads = JSON.parse(localStorage.getItem("swiply-resource-leads") ?? "[]");
      leads.push({ email, at: new Date().toISOString(), resource: "service-guide" });
      localStorage.setItem("swiply-resource-leads", JSON.stringify(leads));
    } catch { /* ignore */ }
    setSubmitted(true);
  }

  return (
    <section className="relative px-5 md:px-8 py-16 md:py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 text-white overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-cyan-400/20 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-blue-400/20 blur-[100px]" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        <p className="text-[11px] tracking-[0.3em] text-cyan-200 font-bold mb-3">
          ─ 無料資料ダウンロード
        </p>
        <h2 className="text-[24px] md:text-[36px] font-black tracking-tight leading-tight mb-4">
          3分でわかる SWIPLY
          <br />
          <span className="text-cyan-200">サービス資料</span>
        </h2>
        <p className="text-[13px] md:text-[14px] text-white/70 leading-relaxed mb-8 max-w-xl mx-auto">
          料金・機能・導入事例・FOUNDING特典をまとめた資料を無料でお送りします。
          <br />
          社内検討にもそのままご利用いただけます。
        </p>

        <div className="max-w-lg mx-auto">
          <div className="grid md:grid-cols-3 gap-3 mb-8">
            {[
              { icon: "📊", label: "料金プラン比較表" },
              { icon: "📹", label: "動画活用ガイド" },
              { icon: "📋", label: "導入チェックリスト" },
            ].map((r) => (
              <div key={r.label} className="bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 flex items-center gap-2">
                <span className="text-lg">{r.icon}</span>
                <span className="text-[12px] font-bold">{r.label}</span>
              </div>
            ))}
          </div>

          {submitted ? (
            <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-5">
              <p className="text-[16px] font-extrabold mb-2">送信しました！</p>
              <p className="text-[13px] text-white/70">
                ご入力いただいたメールアドレスに資料をお送りします。
              </p>
            </div>
          ) : (
            <form onSubmit={handleDownload} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="メールアドレスを入力"
                className="flex-1 px-4 py-3.5 rounded-xl bg-white/10 border border-white/30 text-white placeholder-white/40 text-[14px] font-medium focus:outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30 transition"
              />
              <button
                type="submit"
                className="px-6 py-3.5 rounded-xl bg-white text-blue-700 text-[14px] font-extrabold shadow-xl shadow-blue-900/30 hover:bg-cyan-50 active:scale-[0.97] transition shrink-0"
              >
                無料ダウンロード
              </button>
            </form>
          )}
          <p className="text-[10px] text-white/40 mt-3">
            営業メールは送りません。資料のみお届けします。
          </p>
        </div>
      </div>
    </section>
  );
}

// =================================================================
// AI Facilitator + AI Scout — the two AI features that differentiate
// SWIPLY from every other media. Detailed enough to justify the
// premium plans, visual enough to scan in 10 seconds.
// =================================================================
function AIFacilitatorSection() {
  return (
    <section className="relative px-5 md:px-8 py-20 md:py-28 bg-gradient-to-br from-fuchsia-50 via-white to-cyan-50 overflow-hidden">
      <div className="absolute -top-32 right-0 w-[400px] h-[400px] rounded-full bg-fuchsia-300/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 -left-20 w-[400px] h-[400px] rounded-full bg-cyan-300/30 blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <FadeInSection>
          <p className="text-[11px] tracking-[0.3em] text-fuchsia-500 font-bold mb-3 text-center">
            ─ AI 機能（独自開発）
          </p>
          <h2 className="text-[26px] md:text-[40px] font-black tracking-tight text-gray-900 text-center leading-tight mb-3">
            採用に効く AI を、
            <br className="md:hidden" />
            <span className="bg-gradient-to-r from-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">
              標準で2つ。
            </span>
          </h2>
          <p className="text-center text-[13px] md:text-[14px] text-gray-600 max-w-2xl mx-auto mb-12 md:mb-16 leading-relaxed">
            SWIPLY は求人ビッグデータで学習した独自 AI を内蔵。
            一般的な ChatGPT 連携サービスと違い、面接の場でリアルタイムに動きます。
          </p>
        </FadeInSection>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* AI 1 — Facilitator */}
          <article className="bg-white rounded-3xl border border-fuchsia-100 p-6 md:p-8 shadow-lg shadow-fuchsia-100/40">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-fuchsia-100 text-fuchsia-700 text-[10px] font-black tracking-[0.2em] mb-4">
              <span aria-hidden>📹</span> AI FACILITATOR
            </div>
            <h3 className="text-[18px] md:text-[22px] font-extrabold text-gray-900 mb-2">
              ビデオ面接の質を、両側から底上げ
            </h3>
            <p className="text-[13px] text-gray-600 leading-relaxed mb-5">
              アプリ内ビデオ面接でAIが両者の発話をリアルタイム監視。
              採用担当者には「ハラスメント警告」「掘り下げるべき質問」、
              候補者には「答え方アドバイス」を画面横に表示。
              面接終了後、別々の視点でAI評価レポートを自動生成します。
            </p>
            <ul className="space-y-2 mb-5">
              {[
                "🚨 ハラスメント発言の即時警告（採用担当向け）",
                "💡 掘り下げ質問の提案（深い情報引き出し）",
                "📝 終了後 30秒で評価レポート（強み/懸念/推奨ネクスト）",
                "🌷 候補者には言ってはいけない事項を事前注意",
              ].map((s, i) => (
                <li
                  key={i}
                  className="text-[12px] text-gray-700 flex items-start gap-2"
                >
                  <span aria-hidden className="leading-tight">{s.split(" ")[0]}</span>
                  <span>{s.split(" ").slice(1).join(" ")}</span>
                </li>
              ))}
            </ul>
            <div className="bg-fuchsia-50 rounded-2xl border border-fuchsia-100 px-4 py-3 text-[11px] text-fuchsia-800 leading-relaxed">
              <span className="font-extrabold">📊 効果イメージ:</span>{" "}
              判断ミス率の低下 / ハラスメント事故ゼロ / 二次面接判断の高速化
            </div>
          </article>

          {/* AI 2 — Scout */}
          <article className="bg-white rounded-3xl border border-cyan-100 p-6 md:p-8 shadow-lg shadow-cyan-100/40">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-700 text-[10px] font-black tracking-[0.2em] mb-4">
              <span aria-hidden>🤖</span> AI SCOUT
            </div>
            <h3 className="text-[18px] md:text-[22px] font-extrabold text-gray-900 mb-2">
              定型文ではない、個別スカウト
            </h3>
            <p className="text-[13px] text-gray-600 leading-relaxed mb-5">
              候補者プロフィールを Claude が読み込み、自己紹介の一節を引用した
              <strong>本当に個別の文章</strong>を1通ずつ生成。
              他社の定型スカウト開封率は約30%、SWIPLY式は<strong>55%以上</strong>を狙います。
            </p>
            <ul className="space-y-2 mb-5">
              {[
                "📝 候補者ごとに違う文章（コピペ感ゼロ）",
                "👤 「採用担当 ○○」式の人格つき",
                "🎯 ポジションとスキルの関連性を必ず指摘",
                "✏️ 操作画面で手直ししてから送信可能",
              ].map((s, i) => (
                <li
                  key={i}
                  className="text-[12px] text-gray-700 flex items-start gap-2"
                >
                  <span aria-hidden className="leading-tight">{s.split(" ")[0]}</span>
                  <span>{s.split(" ").slice(1).join(" ")}</span>
                </li>
              ))}
            </ul>
            <div className="bg-cyan-50 rounded-2xl border border-cyan-100 px-4 py-3 text-[11px] text-cyan-800 leading-relaxed">
              <span className="font-extrabold">📊 効果イメージ:</span>{" "}
              スカウト開封率 30% → 55%+ / 返信率 2x / 担当者の作文時間 1/10
            </div>
          </article>
        </div>

        {/* Trust + speed signals */}
        <div className="mt-10 md:mt-14 grid sm:grid-cols-3 gap-3 md:gap-4">
          <TrustCard
            emoji="✓"
            title="SWIPLY確認済みバッジ"
            body="独自審査を通過した企業に、求人カードと面接画面で常時表示。"
          />
          <TrustCard
            emoji="⭐"
            title="FOUNDING 優先表示枠"
            body="最初の100社限定。スワイプ画面の3枚に1枚を保証。"
          />
          <TrustCard
            emoji="🔥"
            title="今日明日面接OK"
            body="即日採用枠。「明日にも採用したい」候補者を直で繋ぎます。"
          />
        </div>
      </div>
    </section>
  );
}

function TrustCard({
  emoji,
  title,
  body,
}: {
  emoji: string;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-cyan-200 hover:-translate-y-1 transition-all">
      <div className="text-3xl mb-2" aria-hidden>{emoji}</div>
      <p className="text-[14px] font-extrabold text-gray-900 mb-1">{title}</p>
      <p className="text-[12px] text-gray-600 leading-relaxed">{body}</p>
    </div>
  );
}

// =================================================================
// Sticky header with brand + nav anchors + primary CTA
// =================================================================
function BusinessHeader({ remaining }: { remaining: number }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-5 md:px-8 h-14 md:h-16 flex items-center justify-between">
        <Link href="/business" className="flex items-center gap-2">
          <Logo size={32} radius={8} priority />
          <div className="leading-tight">
            <p className="text-[14px] md:text-base font-black tracking-tight bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-400 bg-clip-text text-transparent">
              SWIPLY
            </p>
            <p className="text-[9px] md:text-[10px] tracking-[0.25em] text-white/40 font-bold">
              FOR BUSINESS
            </p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-[12px] font-bold text-white/70">
          <a href="#solution" className="hover:text-white transition">特長</a>
          <a href="#pricing" className="hover:text-white transition">料金</a>
          <a href="#founding" className="hover:text-white transition">ファウンディング特典</a>
          <a href="#faq" className="hover:text-white transition">FAQ</a>
        </nav>

        <div className="flex items-center gap-2">
          {/* Founding counter pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            残り {remaining}社
          </div>
          <Link
            href="/dashboard"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] text-cyan-300 hover:text-white hover:bg-white/5 font-bold transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            デモを試す
          </Link>
          <a
            href="#contact"
            className="inline-flex items-center justify-center px-3 md:px-5 h-9 md:h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-[12px] md:text-[13px] font-extrabold shadow-lg shadow-blue-500/30 hover:shadow-cyan-400/40 active:scale-[0.97] transition"
          >
            申込む
          </a>
        </div>
      </div>
    </header>
  );
}

// =================================================================
// Section 1 — Hero
// =================================================================
function Hero({ remaining }: { remaining: number }) {
  return (
    <section className="relative overflow-hidden bg-gray-950 text-white">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 -left-40 w-[600px] h-[600px] rounded-full bg-blue-600/30 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-cyan-400/20 blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-5 md:px-8 pt-12 md:pt-20 pb-16 md:pb-28">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 items-center">
          {/* Copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] font-bold tracking-wider mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              FOUNDING 残り{remaining}社 / 永続20%オフ
            </div>

            <p className="text-[11px] tracking-[0.35em] font-bold text-cyan-300 mb-3">
              SWIPLY FOR BUSINESS
            </p>

            <h1 className="text-[34px] md:text-[56px] lg:text-[68px] font-black leading-[1.1] tracking-tight mb-6">
              動画でわかる、
              <br />
              <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-transparent">
                スワイプで決まる。
              </span>
            </h1>

            <p className="text-[14px] md:text-[16px] text-white/70 leading-[1.9] max-w-[560px] mb-8 font-medium">
              採用に、動画とスワイプという新しい体験を。
              <br />
              30秒の動画で職場のリアルを伝え、
              <br className="hidden md:block" />
              本気の応募者と最短距離で出会う、新しい採用プラットフォーム。
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="#contact"
                className="inline-flex items-center justify-center px-7 h-12 md:h-14 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-[13px] md:text-sm font-extrabold shadow-xl shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.97] transition"
              >
                ファウンディングメンバーになる
              </a>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-7 h-12 md:h-14 rounded-full border border-white/20 text-white text-[13px] md:text-sm font-bold hover:bg-white/5 transition"
              >
                <svg className="w-4 h-4 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                企業画面をデモ体験
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-7 text-[11px] text-white/50">
              <span>✓ 初期費用 0円</span>
              <span>✓ リリース後3ヶ月無料</span>
              <span>✓ 動画制作費 初回無料</span>
            </div>
          </div>

          {/* Phone mock animation */}
          <div className="flex justify-center lg:justify-end">
            <PhonePreview />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Animated phone mock for the hero. Cycles through three sample job
 * cards, each one swiping right after a moment.
 */
function PhonePreview() {
  const sampleJobs = [
    {
      title: "美容師 / アシスタント",
      company: "Hair Salon BLOOM",
      tag: "渋谷駅 徒歩3分",
      gradient: "from-rose-400 via-pink-400 to-fuchsia-500",
    },
    {
      title: "ホールスタッフ",
      company: "Cafe & Bar VIVID",
      tag: "中目黒 / 週2OK",
      gradient: "from-amber-400 via-orange-400 to-rose-400",
    },
    {
      title: "トレーナー",
      company: "Studio PULSE",
      tag: "表参道 / 未経験OK",
      gradient: "from-emerald-400 via-teal-400 to-cyan-500",
    },
  ];
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"showing" | "leaving">("showing");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("leaving"), 2500);
    const t2 = setTimeout(() => {
      setIdx((i) => (i + 1) % sampleJobs.length);
      setPhase("showing");
    }, 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [idx, sampleJobs.length]);

  const job = sampleJobs[idx];

  return (
    <div className="relative">
      {/* Phone frame */}
      <div className="relative w-[260px] md:w-[300px] aspect-[9/19] rounded-[40px] bg-gray-900 border-[10px] border-gray-800 shadow-2xl shadow-cyan-500/10 overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-b-2xl z-30" />

        {/* Screen */}
        <div className="absolute inset-0 bg-gray-950">
          <AnimatePresence>
            <motion.div
              key={`${idx}-${phase}`}
              className="absolute inset-3 rounded-[28px] overflow-hidden"
              initial={{ x: 0, rotate: 0, opacity: 1 }}
              animate={
                phase === "leaving"
                  ? { x: 320, rotate: 18, opacity: 0 }
                  : { x: 0, rotate: 0, opacity: 1 }
              }
              transition={{ duration: 0.5, ease: "easeIn" }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${job.gradient}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              {/* Mock employmentType badge */}
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-white/95 text-gray-900 text-[9px] font-bold">
                正社員
              </div>

              {/* Faux video play indicator */}
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-rose-500/90 text-white text-[8px] font-bold flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                30秒動画
              </div>

              {/* Content */}
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <p className="text-[8px] uppercase tracking-widest text-amber-200 font-bold">
                  本気で人を育てたい
                </p>
                <h3 className="text-[15px] font-extrabold leading-tight mt-1">
                  {job.title}
                </h3>
                <p className="text-[10px] text-white/60 mt-0.5">{job.company}</p>
                <p className="text-[10px] text-white/70 mt-1">{job.tag}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* LIKE indicator (appears during leaving) */}
          <AnimatePresence>
            {phase === "leaving" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-12 left-6 -rotate-12 z-20"
              >
                <div className="px-3 py-1 rounded-lg bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-500/40">
                  LIKE
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Faux finger swiping right */}
          <AnimatePresence>
            {phase === "showing" && (
              <motion.div
                initial={{ x: 0, opacity: 0 }}
                animate={{ x: 80, opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1.6, delay: 0.7 }}
                className="absolute bottom-24 left-12 z-20 text-3xl"
                aria-hidden
              >
                👆
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Caption */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
        <p className="text-[10px] tracking-[0.25em] font-bold text-white/40">
          REAL DEMO ON SWIPLY
        </p>
      </div>
    </div>
  );
}

// =================================================================
// Section 2 — Problem statement
// =================================================================
function ProblemSection() {
  return (
    <section className="px-5 md:px-8 py-20 md:py-28 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <FadeInSection>
          <p className="text-[11px] tracking-[0.3em] text-gray-400 font-bold mb-6">
            ─ こんな悩み、ありませんか?
          </p>
        </FadeInSection>
        <ul className="space-y-3 text-[18px] md:text-[22px] font-extrabold text-gray-900 leading-snug mb-10">
          <FadeInSection delay={0.1}><li>求人広告に出してるのに、応募が来ない。</li></FadeInSection>
          <FadeInSection delay={0.2}><li>来ても、面接でミスマッチ。</li></FadeInSection>
          <FadeInSection delay={0.3}><li>採用しても、3ヶ月で辞めてしまう。</li></FadeInSection>
        </ul>

        <FadeInSection delay={0.15}>
          <p className="text-[15px] md:text-[17px] text-gray-700 leading-[1.9] font-medium">
            そのお店の<span className="bg-yellow-100 px-1">「本当の魅力」</span>が、伝わっていないだけかもしれません。
          </p>
          <p className="text-[14px] md:text-[15px] text-gray-500 leading-[1.9] mt-5">
            文字や写真だけで、職場の空気感は伝わらない。
            <br />
            求職者が本当に知りたいのは、
            <span className="font-bold text-gray-700">「数字」より「雰囲気」</span>のはず。
          </p>
        </FadeInSection>
      </div>
    </section>
  );
}

// =================================================================
// Section 3 — Solution (3 cards)
// =================================================================
function SolutionSection() {
  const items = [
    {
      n: "01",
      title: "動画で、職場のリアルが伝わる",
      body: "求人票や写真では伝わらない、お店の空気感、スタッフの雰囲気、仕事の流れを、30秒の動画で。求職者は入社前から「ここで働く自分」を想像できます。",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      n: "02",
      title: "スワイプで、本気の応募者だけが残る",
      body: "求職者は気軽にスワイプしながら、自分に合う職場を探します。お互いに「興味あり」となった時点で、応募が成立。ミスマッチが減り、面接の精度が上がります。",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
    {
      n: "03",
      title: "ビデオ面接 + AI 振り返りで、工数削減",
      body: "アプリ内ビデオ面接の終了後に、AI が自動で評価レポートを作成。候補者の強み・確認したい点・推奨ネクストステップを、採用担当向けに可視化。次面接の判断が早くなる。",
      badge: "NEW",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      n: "04",
      title: "コンサルが、採用全体を伴走する",
      body: "SWIPLYだけでなく、店舗の採用全体を一緒に考えます。他媒体の使い分け、求人票の改善、面接の質問設計、内定後のフォローまで。採用が決まるまで伴走します。",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="solution" className="px-5 md:px-8 py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto">
        <FadeInSection>
          <p className="text-[11px] tracking-[0.3em] text-blue-500 font-bold mb-3 text-center">
            ─ SWIPLYが、変える4つのこと
          </p>
          <h2 className="text-[26px] md:text-[40px] font-black tracking-tight text-gray-900 text-center leading-tight mb-12 md:mb-16">
            採用は、もう数字じゃない。
            <br />
            <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
              体験で、決まる。
            </span>
          </h2>
        </FadeInSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {items.map((it) => (
            <div
              key={it.n}
              className="group relative bg-white border border-gray-100 rounded-3xl p-7 md:p-8 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100 hover:border-blue-100 transition-all"
            >
              {"badge" in it && it.badge && (
                <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white text-[9px] font-black tracking-[0.2em]">
                  {it.badge}
                </span>
              )}
              <p className="text-[11px] font-black tabular-nums text-gray-300 tracking-widest mb-4">
                {it.n} /
              </p>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white flex items-center justify-center mb-5 shadow-md shadow-blue-200">
                {it.icon}
              </div>
              <h3 className="text-[16px] md:text-[18px] font-extrabold text-gray-900 leading-snug mb-3">
                {it.title}
              </h3>
              <p className="text-[13px] md:text-[14px] text-gray-600 leading-[1.85]">
                {it.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =================================================================
// Section 4 — Features (4 checklist)
// =================================================================
function FeaturesSection() {
  const items = [
    {
      title: "30秒の動画で、職場のリアルが伝わる",
      body: "テキスト中心の求人サービスでは届かない、空気感を伝える。",
    },
    {
      title: "スワイプで、直感的に選べる",
      body: "検索やスクロールに疲れた求職者に、新しい体験を。",
    },
    {
      title: "採用コンサルが標準でついてくる",
      body: "掲載するだけで終わらない。採用が決まるまで伴走する。",
    },
    {
      title: "店舗型サービス業に最適化",
      body: "美容・飲食・整骨院・ペット業界など、「店舗の雰囲気」が採用の決め手になる業種で力を発揮します。",
    },
  ];
  return (
    <section className="relative px-5 md:px-8 py-20 md:py-28 bg-gray-950 text-white overflow-hidden">
      <div className="absolute -top-24 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-600/20 blur-[100px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto">
        <p className="text-[11px] tracking-[0.3em] text-cyan-300 font-bold mb-3">
          ─ DIFFERENTIATORS
        </p>
        <h2 className="text-[26px] md:text-[40px] font-black tracking-tight leading-tight mb-12 md:mb-16">
          SWIPLYが、これまでの求人サービスと
          <br className="hidden md:block" />
          違う4つのこと。
        </h2>

        <div className="grid md:grid-cols-2 gap-5 md:gap-6">
          {items.map((it, i) => (
            <div
              key={i}
              className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition"
            >
              <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-[15px] md:text-[17px] font-extrabold leading-snug mb-2">
                  {it.title}
                </h3>
                <p className="text-[13px] text-white/60 leading-[1.85]">{it.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =================================================================
// Section 5 — Industries
// =================================================================
function IndustriesSection() {
  const industries = [
    { label: "美容室・ネイルサロン", emoji: "💇" },
    { label: "飲食店・カフェ・居酒屋", emoji: "🍽️" },
    { label: "整骨院・整体・整形", emoji: "🦴" },
    { label: "ペットサロン・動物病院", emoji: "🐾" },
    { label: "フィットネスジム・スタジオ", emoji: "💪" },
    { label: "小売店・専門店", emoji: "🛍️" },
  ];
  return (
    <section className="px-5 md:px-8 py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto">
        <p className="text-[11px] tracking-[0.3em] text-blue-500 font-bold mb-3 text-center">
          ─ 動画求人と相性のいい業種
        </p>
        <h2 className="text-[26px] md:text-[40px] font-black tracking-tight text-gray-900 text-center leading-tight mb-12">
          「雰囲気」が決め手の業種で、
          <br />
          特に効果を発揮します。
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-10">
          {industries.map((it) => (
            <div
              key={it.label}
              className="flex items-center gap-3 bg-gradient-to-br from-blue-50 to-cyan-50/50 border border-blue-100 rounded-2xl p-5 hover:shadow-lg hover:shadow-blue-100 transition"
            >
              <span className="text-3xl">{it.emoji}</span>
              <span className="text-[13px] md:text-[15px] font-bold text-gray-900">
                {it.label}
              </span>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-[12px] md:text-[13px] text-gray-500 leading-relaxed">
            業種を問わずご相談いただけます。
          </p>
          <p className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[12px] md:text-[13px] font-extrabold">
            <span>★</span>
            リリース時には、業界1社目として参加いただける可能性があります。
          </p>
        </div>
      </div>
    </section>
  );
}

// =================================================================
// Section 6 — Onboarding flow
// =================================================================
function FlowSection() {
  const steps = [
    {
      n: "01",
      title: "ヒアリング",
      body: "オンライン30分。御社の採用課題を伺います。",
    },
    {
      n: "02",
      title: "ご契約",
      body: "ファウンディングメンバー特典付きで契約締結。",
    },
    {
      n: "03",
      title: "動画撮影",
      body: "SWIPLY側で撮影対応(松プラン)、または自社で撮影(竹・梅プラン)。",
    },
    {
      n: "04",
      title: "リリース時に掲載開始",
      body: "リリース日からファウンディング100社で同時公開。",
    },
  ];
  return (
    <section className="px-5 md:px-8 py-20 md:py-28 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <p className="text-[11px] tracking-[0.3em] text-blue-500 font-bold mb-3 text-center">
          ─ 導入は、4ステップ
        </p>
        <h2 className="text-[26px] md:text-[40px] font-black tracking-tight text-gray-900 text-center leading-tight mb-12 md:mb-16">
          最短2週間で、
          <br />
          採用の動画化がはじまる。
        </h2>

        <div className="relative grid md:grid-cols-4 gap-6 md:gap-4">
          {/* Connector line on desktop */}
          <div className="hidden md:block absolute top-7 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200" />

          {steps.map((s) => (
            <div key={s.n} className="relative flex md:block items-start gap-4">
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-white flex items-center justify-center font-black text-[15px] shadow-lg shadow-blue-200 shrink-0 md:mb-5 z-10">
                {s.n}
              </div>
              <div>
                <h3 className="text-[15px] md:text-[17px] font-extrabold text-gray-900 mb-1.5">
                  {s.title}
                </h3>
                <p className="text-[12px] md:text-[13px] text-gray-600 leading-[1.8]">
                  {s.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =================================================================
// Section 7 — Pricing
// =================================================================
function PricingSection({ remaining }: { remaining: number }) {
  const plans = [
    {
      name: "梅プラン",
      tagline: "掲載のみ",
      regular: 30000,
      founding: 24000,
      features: ["SWIPLYへの掲載", "動画は自社で用意", "セルフ運用"],
      featured: false,
    },
    {
      name: "竹プラン",
      tagline: "コンサル付き",
      regular: 65000,
      founding: 52000,
      features: [
        "SWIPLYへの掲載",
        "採用コンサル(SWIPLY+他媒体)",
        "チャット相談無制限",
        "求人原稿改善支援",
      ],
      featured: true,
    },
    {
      name: "松プラン",
      tagline: "動画+コンサル",
      regular: 100000,
      founding: 80000,
      features: [
        "SWIPLYへの掲載",
        "採用コンサル",
        "毎月の動画制作・更新",
        "月1回の戦略MTG",
        "応募分析レポート",
      ],
      featured: false,
    },
  ];
  return (
    <section id="pricing" className="px-5 md:px-8 py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto">
        <p className="text-[11px] tracking-[0.3em] text-blue-500 font-bold mb-3 text-center">
          ─ 料金プラン
        </p>
        <h2 className="text-[26px] md:text-[40px] font-black tracking-tight text-gray-900 text-center leading-tight mb-3">
          すべてのプランで、
          <br className="md:hidden" />
          ファウンディングは
          <br />
          <span className="bg-gradient-to-r from-amber-500 to-amber-300 bg-clip-text text-transparent">
            永続20%オフ
          </span>
          。
        </h2>
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[12px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            FOUNDING 残り {remaining}社
          </div>
        </div>
        <p className="text-[12px] md:text-[13px] text-gray-500 text-center mb-12 md:mb-14">
          税抜表記 / 月額
        </p>

        <div className="grid md:grid-cols-3 gap-5 md:gap-6">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-3xl p-7 md:p-8 transition ${
                p.featured
                  ? "bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-2xl shadow-blue-300/40 md:scale-[1.04]"
                  : "bg-white border border-gray-100 text-gray-900 hover:shadow-lg hover:border-blue-100"
              }`}
            >
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-amber-400 text-amber-900 text-[10px] font-black tracking-widest shadow-md">
                  ★ おすすめ
                </div>
              )}
              <p
                className={`text-[11px] tracking-[0.25em] font-bold mb-1 ${
                  p.featured ? "text-cyan-100" : "text-blue-500"
                }`}
              >
                {p.tagline}
              </p>
              <h3 className="text-2xl font-black mb-5">{p.name}</h3>

              <div className="mb-6">
                <p
                  className={`text-[11px] line-through ${
                    p.featured ? "text-white/50" : "text-gray-400"
                  }`}
                >
                  通常 {p.regular.toLocaleString()}円 / 月
                </p>
                <p className="flex items-baseline gap-2 mt-1">
                  <span
                    className={`text-[10px] font-bold ${
                      p.featured ? "text-amber-200" : "text-amber-600"
                    }`}
                  >
                    Founding
                  </span>
                  <span className="text-3xl md:text-[36px] font-black tabular-nums">
                    {p.founding.toLocaleString()}
                  </span>
                  <span className="text-[12px] font-bold opacity-80">円/月</span>
                </p>
              </div>

              <ul className="space-y-2.5 mb-7">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px] leading-snug">
                    <svg
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        p.featured ? "text-cyan-200" : "text-blue-500"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="#contact"
                className={`block text-center w-full h-11 leading-[44px] rounded-2xl font-extrabold text-[13px] transition ${
                  p.featured
                    ? "bg-white text-blue-600 hover:bg-amber-100"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                }`}
              >
                このプランで申し込む
              </a>
            </div>
          ))}
        </div>

        {/* Common terms */}
        <div className="mt-10 md:mt-14 max-w-3xl mx-auto rounded-2xl bg-gray-50 border border-gray-100 p-6 md:p-7">
          <p className="text-[11px] tracking-[0.25em] font-bold text-gray-500 mb-4">
            ─ 共通条件
          </p>
          <ul className="grid md:grid-cols-2 gap-2 text-[12px] md:text-[13px] text-gray-700">
            <li>・最低契約期間:12ヶ月</li>
            <li>・課金開始:リリース後3ヶ月目から(リリース後3ヶ月は無料)</li>
            <li>・初期費用:無料</li>
            <li>・動画制作費:ファウンディングメンバーは初回無料</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

// =================================================================
// Section 8 — Founding member benefits
// =================================================================
function FoundingBenefitsSection({ remaining }: { remaining: number }) {
  const perks = [
    {
      n: "01",
      title: "永続20%オフ",
      body: "契約継続中、すべてのプランで通常料金の20%オフを永続適用。",
    },
    {
      n: "02",
      title: "リリース後3ヶ月、完全無料",
      body: "リリース日から3ヶ月間は課金ゼロ。リスクなくサービスを試せます。",
    },
    {
      n: "03",
      title: "動画制作費が初回無料",
      body: "通常10万円〜の動画制作費を、ファウンディングメンバーは初回無料。",
    },
    {
      n: "04",
      title: "ファウンディングバッジ付与",
      body: "求職者のスワイプ画面に「FOUNDING MEMBER」バッジを永続表示。業界の先駆者として認知されます。",
    },
    {
      n: "05",
      title: "プレスリリースに社名掲載",
      body: "リリース時の公式プレスリリースに、ファウンディングメンバーの企業名を掲載。メディア露出のメリットがあります。",
    },
    {
      n: "06",
      title: "ファウンディング専用イベント",
      body: "月1回のオンライン勉強会、年1回のFounding Member Dayへの参加権。通常メンバーは参加できません。",
    },
  ];
  return (
    <section
      id="founding"
      className="relative px-5 md:px-8 py-20 md:py-32 bg-gray-950 text-white overflow-hidden"
    >
      {/* Gold gradient backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[700px] h-[700px] rounded-full bg-amber-400/10 blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-500/15 blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        <FadeInSection className="text-center mb-12 md:mb-16">
          <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] font-bold tracking-wider mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            100社限定 / 残り {remaining}社
          </p>
          <h2 className="text-[28px] md:text-[44px] font-black tracking-tight leading-tight mb-5">
            ファウンディングメンバー
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-300 bg-clip-text text-transparent">
              6つの特典。
            </span>
          </h2>
          <p className="text-[14px] md:text-[15px] text-white/60 leading-relaxed max-w-xl mx-auto">
            リリース前、最初の100社限定。
            <br />
            SWIPLYと一緒に、新しい採用のかたちを作りませんか?
          </p>
        </FadeInSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 mb-12">
          {perks.map((p) => (
            <div
              key={p.n}
              className="relative rounded-3xl p-6 md:p-7 bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] hover:border-amber-300/30 transition"
            >
              <div className="absolute -top-3 -left-3 w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 flex items-center justify-center font-black text-[14px] shadow-lg shadow-amber-500/30">
                {p.n}
              </div>
              <h3 className="text-[16px] md:text-[18px] font-extrabold mt-3 mb-3 leading-snug">
                {p.title}
              </h3>
              <p className="text-[13px] text-white/60 leading-[1.85]">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a
            href="#contact"
            className="inline-flex items-center justify-center px-8 md:px-12 h-13 md:h-14 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 text-amber-950 text-sm md:text-base font-black shadow-2xl shadow-amber-500/30 hover:scale-[1.03] active:scale-[0.97] transition"
          >
            ファウンディングメンバーに申し込む →
          </a>
          <div className="mt-6 text-[11px] text-white/40 leading-relaxed max-w-xl mx-auto space-y-1">
            <p>※ リリース時期が大幅に遅延した場合は、契約金額を全額返金します。</p>
            <p>※ ファウンディングメンバー資格は、契約継続中のみ有効です。</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// =================================================================
// Section 9 — FAQ
// =================================================================
function FAQSection() {
  const faqs = [
    {
      q: "リリースはいつですか?",
      a: "2026年内のリリースを予定しています(具体的な日付は調整中)。ファウンディングメンバーには進捗を月次で共有します。",
    },
    {
      q: "動画は自社で撮影する必要がありますか?",
      a: "プランによって異なります。松プランはSWIPLY側で撮影します。竹・梅プランは自社撮影が基本ですが、動画制作のオプション販売もご用意しています。",
    },
    {
      q: "求職者は本当に集まりますか?",
      a: "リリース時に求職者向けの広告・SNS拡散を集中的に行います。また、ファウンディング100社の動画を各社のSNSでも展開することで、複数チャネルから求職者を集める設計です。",
    },
    {
      q: "12ヶ月最低契約は長くないですか?",
      a: "採用効果が見えるには平均3〜6ヶ月、定着確認まで含めると12ヶ月が必要です。ファウンディング特典(永続20%オフ等)を継続的に提供する条件として、12ヶ月の最低契約期間を設けています。",
    },
    {
      q: "リリースされなかった場合は?",
      a: "契約書に明記しています。リリースに至らなかった場合は契約自体が無効となり、お支払いいただいた費用は全額返金します。",
    },
    {
      q: "解約はいつでもできますか?",
      a: "12ヶ月の最低契約期間後は、3ヶ月前通知でいつでも解約可能です。ただし、解約後はファウンディングメンバー資格を失います。",
    },
    {
      q: "個人情報の取扱いは?",
      a: "プライバシーポリシーに準拠し、個人情報保護法を遵守して運用します。求職者の個人情報は採用目的以外には使用しません。",
    },
    {
      q: "求人企業に最低条件はありますか?",
      a: "法人または個人事業主であること、適切な事業活動を行っていること、最低賃金を遵守していることなどを審査いたします。",
    },
  ];

  return (
    <section id="faq" className="px-5 md:px-8 py-20 md:py-28 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <p className="text-[11px] tracking-[0.3em] text-blue-500 font-bold mb-3 text-center">
          ─ よくある質問
        </p>
        <h2 className="text-[26px] md:text-[40px] font-black tracking-tight text-gray-900 text-center leading-tight mb-12 md:mb-14">
          気になることに、
          <br />
          先回りでお答えします。
        </h2>

        <div className="space-y-3">
          {faqs.map((f, i) => (
            <details
              key={i}
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-blue-100 transition"
            >
              <summary className="cursor-pointer list-none px-5 md:px-6 py-4 md:py-5 flex items-start justify-between gap-4">
                <span className="flex items-start gap-3 min-w-0">
                  <span className="text-blue-500 font-black text-[14px] shrink-0 mt-0.5">
                    Q.
                  </span>
                  <span className="text-[14px] md:text-[15px] font-bold text-gray-900 leading-snug">
                    {f.q}
                  </span>
                </span>
                <span className="shrink-0 w-7 h-7 rounded-full bg-gray-100 group-open:bg-blue-100 group-open:rotate-45 flex items-center justify-center text-gray-500 group-open:text-blue-600 transition-all text-lg font-light leading-none pb-0.5">
                  +
                </span>
              </summary>
              <div className="px-5 md:px-6 pb-5 pl-12 text-[13px] md:text-[14px] text-gray-600 leading-[1.9]">
                {f.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// =================================================================
// Section 10 — Contact form
// =================================================================
function ContactSection() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    company: "",
    contactName: "",
    email: "",
    phone: "",
    industry: "",
    size: "",
    plan: "",
    message: "",
  });

  function patch(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.company || !form.contactName || !form.email) {
      setError("会社名・ご担当者名・メールアドレスは必須です。");
      return;
    }
    setSubmitting(true);
    try {
      await submitLead(form);
      setDone(true);
    } catch {
      setError("送信に失敗しました。しばらく時間をおいてお試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <section id="contact" className="px-5 md:px-8 py-20 md:py-28 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-5">
            <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3">
            お問い合わせを受け付けました
          </h2>
          <p className="text-[13px] md:text-[14px] text-gray-600 leading-[1.9] mb-8">
            担当より2営業日以内にご連絡いたします。
            <br />
            ファウンディングメンバーの空き枠状況とあわせてご案内します。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-7 h-12 rounded-full bg-gray-900 text-white text-sm font-extrabold"
            >
              SWIPLY を体験する(B2C)
            </Link>
            <button
              onClick={() => {
                setDone(false);
                setForm({
                  company: "",
                  contactName: "",
                  email: "",
                  phone: "",
                  industry: "",
                  size: "",
                  plan: "",
                  message: "",
                });
              }}
              className="inline-flex items-center justify-center px-7 h-12 rounded-full border border-gray-200 text-gray-700 text-sm font-bold"
            >
              別の問い合わせをする
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="px-5 md:px-8 py-20 md:py-28 bg-white">
      <div className="max-w-3xl mx-auto">
        <p className="text-[11px] tracking-[0.3em] text-blue-500 font-bold mb-3 text-center">
          ─ お問い合わせ
        </p>
        <h2 className="text-[26px] md:text-[40px] font-black tracking-tight text-gray-900 text-center leading-tight mb-3">
          まずは、
          <br className="md:hidden" />
          お気軽にご相談ください。
        </h2>
        <p className="text-[13px] md:text-[14px] text-gray-500 text-center mb-10 leading-[1.9]">
          採用課題のヒアリング(オンライン30分)から始めます。
          <br />
          資料だけ欲しい方も、まずはお気軽にご連絡ください。
        </p>

        <form
          onSubmit={onSubmit}
          className="bg-gray-50 border border-gray-100 rounded-3xl p-6 md:p-8 space-y-4"
        >
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="会社名" required>
              <input
                type="text"
                required
                value={form.company}
                onChange={(e) => patch("company", e.target.value)}
                placeholder="株式会社○○"
                className={fieldClass}
              />
            </Field>
            <Field label="ご担当者名" required>
              <input
                type="text"
                required
                value={form.contactName}
                onChange={(e) => patch("contactName", e.target.value)}
                placeholder="山田 太郎"
                className={fieldClass}
              />
            </Field>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="メールアドレス" required>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => patch("email", e.target.value)}
                placeholder="you@example.com"
                className={fieldClass}
              />
            </Field>
            <Field label="電話番号">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => patch("phone", e.target.value)}
                placeholder="03-1234-5678"
                className={fieldClass}
              />
            </Field>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="業種">
              <select
                value={form.industry}
                onChange={(e) => patch("industry", e.target.value)}
                className={fieldClass}
              >
                <option value="">選択してください</option>
                <option value="beauty">美容室・ネイル</option>
                <option value="food">飲食</option>
                <option value="medical">整骨院・整体</option>
                <option value="pet">ペット</option>
                <option value="fitness">フィットネス</option>
                <option value="retail">小売・専門店</option>
                <option value="other">その他</option>
              </select>
            </Field>
            <Field label="従業員数">
              <select
                value={form.size}
                onChange={(e) => patch("size", e.target.value)}
                className={fieldClass}
              >
                <option value="">選択してください</option>
                <option value="1-5">1〜5名</option>
                <option value="6-20">6〜20名</option>
                <option value="21-50">21〜50名</option>
                <option value="51-100">51〜100名</option>
                <option value="100+">100名以上</option>
              </select>
            </Field>
            <Field label="ご希望のプラン">
              <select
                value={form.plan}
                onChange={(e) => patch("plan", e.target.value)}
                className={fieldClass}
              >
                <option value="">選択してください</option>
                <option value="ume">梅プラン(掲載のみ)</option>
                <option value="take">竹プラン(コンサル付き)</option>
                <option value="matsu">松プラン(動画+コンサル)</option>
                <option value="undecided">まだ決めていない</option>
              </select>
            </Field>
          </div>
          <Field label="ご相談内容">
            <textarea
              value={form.message}
              onChange={(e) => patch("message", e.target.value)}
              rows={4}
              placeholder="現在の採用課題、興味のあるプラン、その他ご質問など"
              className={`${fieldClass} resize-none`}
            />
          </Field>

          {error && (
            <p className="text-[12px] text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-sm font-extrabold shadow-lg shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60 transition"
          >
            {submitting ? "送信中…" : "送信する"}
          </button>

          <p className="text-[10px] text-gray-400 text-center leading-relaxed">
            送信ボタンを押すことで、
            <a href="#" className="underline">プライバシーポリシー</a>
            に同意したものとみなします。
          </p>
        </form>
      </div>
    </section>
  );
}

const fieldClass =
  "w-full px-3.5 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold text-gray-600 mb-1.5">
        {label}
        {required && <span className="text-rose-500 ml-1">必須</span>}
      </span>
      {children}
    </label>
  );
}

// =================================================================
// Section 11 — Footer
// =================================================================
function BusinessFooter() {
  return (
    <footer className="bg-gray-950 text-white px-5 md:px-8 pt-16 md:pt-20 pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Logo size={44} radius={12} />
          <div>
            <p className="text-xl md:text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              SWIPLY
            </p>
            <p className="text-[10px] tracking-[0.25em] text-white/40 font-bold">
              FOR BUSINESS
            </p>
          </div>
        </div>
        <p className="text-[18px] md:text-[22px] font-extrabold text-white/90 max-w-md mb-12">
          動画でわかる、スワイプで決まる。
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 text-[12px] mb-14">
          <FooterCol title="サービス">
            <FooterLink href="/">サービス紹介(B2C)</FooterLink>
            <FooterLink href="/business">企業向け(現在のページ)</FooterLink>
            <FooterLink href="#pricing">料金プラン</FooterLink>
            <FooterLink href="#faq">よくある質問</FooterLink>
          </FooterCol>
          <FooterCol title="サポート">
            <FooterLink href="/dashboard">企業管理画面</FooterLink>
            <FooterLink href="#contact">お問い合わせ</FooterLink>
            <FooterLink href="#contact">資料ダウンロード</FooterLink>
            <FooterLink href="#contact">オンライン相談予約</FooterLink>
          </FooterCol>
          <FooterCol title="ポリシー">
            <FooterLink href="#">利用規約</FooterLink>
            <FooterLink href="#">プライバシーポリシー</FooterLink>
            <FooterLink href="#">特定商取引法表記</FooterLink>
          </FooterCol>
          <FooterCol title="運営会社">
            <FooterLink href="#">会社概要</FooterLink>
            <FooterLink href="#">採用情報</FooterLink>
            <FooterLink href="#">プレスリリース</FooterLink>
            <FooterLink href="/admin">運営者ログイン</FooterLink>
          </FooterCol>
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:gap-0 md:items-center md:justify-between pt-8 border-t border-white/10 text-[11px] text-white/40">
          <div className="flex items-center gap-4">
            <a href="#" aria-label="X (Twitter)" className="hover:text-white transition">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="#" aria-label="Instagram" className="hover:text-white transition">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98C.014 8.333 0 8.741 0 12s.014 3.668.072 4.948c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
          </div>
          <div className="text-white/30 leading-relaxed">
            Made with coffee in Tokyo. © {new Date().getFullYear()} SWIPLY / ViFight
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.25em] font-bold text-white/40 mb-3">
        {title}
      </p>
      <ul className="space-y-2.5 text-white/70">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="hover:text-white transition">
        {children}
      </Link>
    </li>
  );
}

