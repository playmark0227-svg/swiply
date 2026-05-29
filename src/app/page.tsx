"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import BottomNav from "@/components/BottomNav";
import JobListCard from "@/components/JobListCard";
import Logo from "@/components/Logo";
import dynamic from "next/dynamic";
const OnboardingModal = dynamic(() => import("@/components/OnboardingModal"), {
  ssr: false,
});
import { getAllJobs } from "@/lib/services/jobs";
import { getProfile } from "@/lib/services/profile";
import { getRecentlyViewedIds } from "@/lib/services/recentlyViewed";
import { scoreJobs } from "@/lib/services/recommendations";
import type { Job } from "@/types/job";
import type { UserProfile } from "@/types/profile";
import { BASE_PATH, SITE_URL, SITE_DESCRIPTION } from "@/lib/site";

// Organization + WebSite structured data — helps search engines and AI
// surface SWIPLY with rich results (and wires up the sitelinks search box).
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "SWIPLY",
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/icon-512.png`,
      description: SITE_DESCRIPTION,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "SWIPLY",
      url: `${SITE_URL}/`,
      inLanguage: "ja",
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/search/?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

// ── Scroll-triggered IntersectionObserver hook ──
function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.12,
  rootMargin = "0px 0px -30px 0px"
) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin]);
  return { ref, visible };
}

// ── Animated counter hook ──
function useAnimatedCounter(target: number, duration = 1800, active = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active || !Number.isFinite(target)) return;
    const start = performance.now();
    let raf: number;
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.max(0, Math.round(eased * target)));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, active]);
  return value;
}

// ── FadeInSection wrapper ──
function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ── Live-ish counter for FOMO ──
function useLiveCounter(base: number) {
  const [value, setValue] = useState(Number.isFinite(base) ? base : 0);
  useEffect(() => {
    const iv = setInterval(() => {
      setValue((v) => v + Math.floor(Math.random() * 3));
    }, 4000 + Math.random() * 3000);
    return () => clearInterval(iv);
  }, []);
  return value;
}

export default function Home() {
  const [recommended, setRecommended] = useState<Job[]>([]);
  const [recents, setRecents] = useState<Job[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [onboardOpen, setOnboardOpen] = useState(false);

  useEffect(() => {
    Promise.all([getAllJobs(), getProfile()]).then(([all, p]) => {
      setProfile(p);
      setAllJobs(all);
      const scored = scoreJobs(all, p).slice(0, 8).map((s) => s.job);
      setRecommended(scored);
      const ids = getRecentlyViewedIds();
      setRecents(
        ids
          .map((id) => all.find((j) => j.id === id))
          .filter((j): j is Job => !!j)
          .slice(0, 8)
      );
      if (!p.onboarded) {
        setTimeout(() => setOnboardOpen(true), 600);
      }
    });
  }, []);

  function handleOnboardSaved(p: UserProfile) {
    setProfile(p);
    if (allJobs.length > 0) {
      setRecommended(scoreJobs(allJobs, p).slice(0, 8).map((s) => s.job));
    }
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c"),
        }}
      />
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 1: HERO — THE 3-SECOND HOOK
          Dark, cinematic, single CTA. No nav bar.
          Pattern: Tinder/Linear/Timee hero structure.
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <HeroSection />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 2: SOCIAL PROOF STRIP — IMMEDIATE TRUST
          Numbers + employer logos directly after hero.
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <SocialProofStrip />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 3: HOW IT WORKS — 3 STEPS
          JP standard. Minimal, visual, benefit-oriented.
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <HowItWorksSection />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 4: FEATURE SHOWCASE — WHY SWIPLY
          Benefit-first cards with product screenshots.
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <FeatureShowcase />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 5: LIVE FOMO — DYNAMIC URGENCY
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <LiveFomoSection />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 6: VOICES — SOCIAL VALIDATION
          Testimonials that feel real.
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <VoicesSection />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 7: RECOMMENDED JOBS — PREVIEW CONTENT
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {recommended.length > 0 && (
        <section className="bg-[#fbf8f3] px-4 md:px-8 pt-10 pb-4 md:pt-14">
          <div className="max-w-lg md:max-w-5xl lg:max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-[10px] tracking-[0.2em] text-violet-500 font-bold mb-1">
                  {profile?.name ? `${profile.name}さんへ` : "あなたへ"}
                </p>
                <h2 className="text-lg md:text-2xl font-extrabold text-gray-900">
                  おすすめの求人
                </h2>
              </div>
              <Link
                href="/search"
                className="text-[11px] font-bold text-violet-600 hover:underline"
              >
                もっと見る →
              </Link>
            </div>
            <HorizontalStrip jobs={recommended} />
          </div>
        </section>
      )}

      {/* Recently viewed */}
      {recents.length > 0 && (
        <section className="bg-[#fbf8f3] px-4 md:px-8 py-4">
          <div className="max-w-lg md:max-w-5xl lg:max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-3">
              <h2 className="text-lg md:text-2xl font-extrabold text-gray-900">
                最近見た求人
              </h2>
              <Link
                href="/likes"
                className="text-[11px] font-bold text-gray-500 hover:text-violet-600"
              >
                LIKEを見る →
              </Link>
            </div>
            <HorizontalStrip jobs={recents} />
          </div>
        </section>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 8: FAQ
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <FAQSection />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 9: B2B BANNER
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <FadeIn>
        <BusinessBanner />
      </FadeIn>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 10: FINAL CTA — THE CLOSE
          Single, powerful CTA. No distractions.
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <FinalCTASection />

      {/* ── Sticky mobile CTA bar ── */}
      <StickyMobileCTA />

      <BottomNav />

      {profile && (
        <OnboardingModal
          open={onboardOpen}
          profile={profile}
          onClose={() => setOnboardOpen(false)}
          onSaved={handleOnboardSaved}
        />
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION COMPONENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function HeroSection() {
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHeroLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-[100dvh] md:min-h-[90dvh] flex flex-col items-center justify-center overflow-hidden">
      {/* Background — cinematic cover photo with dark overlay */}
      <Image
        src={`${BASE_PATH}/cover.webp`}
        alt=""
        fill
        priority
        className="object-cover object-top"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-[#0a0a0f]" />

      {/* Floating gradient orbs — ambient movement */}
      <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full bg-violet-600/20 blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full bg-fuchsia-500/15 blur-[100px] pointer-events-none animate-pulse" />

      {/* Minimal top bar — logo + business link only */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 md:px-10 pt-5 md:pt-6">
        <div className="flex items-center gap-2.5">
          <Logo size={34} radius={10} priority className="shadow-lg shadow-black/30" />
          <span className="text-[17px] font-black tracking-tight text-white drop-shadow">
            SWIPLY
          </span>
        </div>
        <Link
          href="/business"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold hover:bg-white/20 transition"
        >
          <span>🏢</span>
          <span className="hidden sm:inline">企業の方へ</span>
          <span className="sm:hidden">企業</span>
        </Link>
      </div>

      {/* Hero content */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        {/* Proof point chip — above headline */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 mb-6 md:mb-8"
          style={{
            opacity: heroLoaded ? 1 : 0,
            transform: heroLoaded ? "translateY(0)" : "translateY(12px)",
            transition: "all 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s",
          }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-[12px] font-bold text-white/90">
            98,000+ 人が利用中
          </span>
        </div>

        {/* Headline — outcome + speed formula */}
        <h1
          className="text-[36px] sm:text-[48px] md:text-[64px] lg:text-[76px] font-black leading-[1.08] tracking-tight text-white mb-4 md:mb-6"
          style={{
            opacity: heroLoaded ? 1 : 0,
            transform: heroLoaded ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s",
          }}
        >
          1スワイプで、
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            次の仕事。
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className="text-[15px] md:text-[18px] text-white/60 leading-relaxed mb-8 md:mb-10 max-w-md mx-auto"
          style={{
            opacity: heroLoaded ? 1 : 0,
            transform: heroLoaded ? "translateY(0)" : "translateY(16px)",
            transition: "all 0.8s cubic-bezier(0.16,1,0.3,1) 0.35s",
          }}
        >
          写真を見て、右にスワイプ。それだけ。
          <br className="hidden md:inline" />
          履歴書も長文応募も、いらない。
        </p>

        {/* CTA — single, high-contrast */}
        <div
          style={{
            opacity: heroLoaded ? 1 : 0,
            transform: heroLoaded ? "translateY(0)" : "translateY(16px)",
            transition: "all 0.8s cubic-bezier(0.16,1,0.3,1) 0.5s",
          }}
        >
          <Link
            href="/swipe"
            className="inline-flex items-center gap-2.5 px-10 md:px-14 py-4 md:py-5 bg-white text-gray-900 font-black text-[15px] md:text-[17px] rounded-2xl shadow-2xl shadow-white/20 hover:shadow-white/30 hover:scale-[1.03] active:scale-[0.98] transition-all pulse-glow"
          >
            <span>スワイプをはじめる</span>
            <svg
              className="w-5 h-5 text-violet-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
          <p className="text-[11px] md:text-[12px] text-white/40 mt-4">
            登録30秒 ・ 完全無料 ・ 退会いつでもOK
          </p>
        </div>

        {/* Quick category links */}
        <div
          className="flex justify-center gap-3 md:gap-4 mt-6 md:mt-8"
          style={{
            opacity: heroLoaded ? 1 : 0,
            transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1) 0.7s",
          }}
        >
          {[
            { href: "/baito", label: "バイト" },
            { href: "/gig", label: "単発" },
            { href: "/career", label: "正社員" },
            { href: "/search", label: "検索" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3.5 py-1.5 rounded-full border border-white/15 text-white/50 text-[11px] md:text-[12px] font-bold hover:bg-white/10 hover:text-white/80 hover:border-white/30 transition-all"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <span className="text-[10px] text-white/30 font-medium tracking-widest">
          SCROLL
        </span>
        <div className="w-5 h-8 rounded-full border-2 border-white/20 flex justify-center pt-1.5">
          <div className="w-1 h-2 rounded-full bg-white/40 animate-bounce" />
        </div>
      </div>
    </section>
  );
}

function SocialProofStrip() {
  const { ref, visible } = useScrollReveal();
  const matchCount = useAnimatedCounter(24853, 2200, visible);
  const todayJobs = useAnimatedCounter(342, 1600, visible);

  // Simulated employer logo names
  const employers = [
    "楽天グループ",
    "サイバーエージェント",
    "LINE",
    "メルカリ",
    "SmartHR",
    "Wantedly",
    "freee",
    "ZOZO",
  ];

  return (
    <section
      ref={ref}
      className="relative bg-[#0a0a0f] border-y border-white/5 overflow-hidden"
    >
      <div className="max-w-5xl mx-auto px-5 md:px-8 py-8 md:py-12">
        {/* Numbers row */}
        <div className="grid grid-cols-3 gap-4 mb-8 md:mb-10">
          <div className="text-center">
            <p className="text-[28px] md:text-[42px] font-black text-white leading-none tabular-nums">
              {visible ? matchCount.toLocaleString() : "0"}
            </p>
            <p className="text-[10px] md:text-xs text-white/40 mt-1.5 font-medium">
              マッチ成立
            </p>
          </div>
          <div className="text-center border-x border-white/10">
            <p className="text-[28px] md:text-[42px] font-black text-white leading-none tabular-nums">
              {visible ? todayJobs.toLocaleString() : "0"}
              <span className="text-[16px] md:text-xl text-white/50">件</span>
            </p>
            <p className="text-[10px] md:text-xs text-white/40 mt-1.5 font-medium">
              今日の新着求人
            </p>
          </div>
          <div className="text-center">
            <p className="text-[28px] md:text-[42px] font-black text-white leading-none tabular-nums">
              4.8
              <span className="text-[16px] md:text-xl text-amber-400">
                ★
              </span>
            </p>
            <p className="text-[10px] md:text-xs text-white/40 mt-1.5 font-medium">
              ユーザー満足度
            </p>
          </div>
        </div>

        {/* Employer logos — scrolling marquee */}
        <div className="relative">
          <p className="text-[10px] text-white/25 font-bold tracking-[0.25em] text-center mb-3">
            TRUSTED BY
          </p>
          <div className="flex items-center justify-center gap-6 md:gap-10 flex-wrap">
            {employers.map((name) => (
              <span
                key={name}
                className="text-[12px] md:text-[14px] font-bold text-white/20 hover:text-white/40 transition-colors whitespace-nowrap"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="relative bg-[#0a0a0f] overflow-hidden">
      {/* Accent line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-transparent to-violet-500/30" />

      <div className="max-w-5xl mx-auto px-6 md:px-8 py-16 md:py-24">
        <FadeIn className="text-center mb-12 md:mb-16">
          <p className="text-[10px] tracking-[0.3em] text-violet-400 font-bold mb-3">
            HOW IT WORKS
          </p>
          <h2 className="text-[28px] md:text-[44px] font-black text-white leading-tight">
            3分ではじめて、
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              1分で応募。
            </span>
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
          <FadeIn delay={0.1}>
            <StepCard
              number="01"
              title="30秒で登録"
              description="名前と写真だけ。履歴書は不要。あとから気が向いたら追加すればOK。"
              icon={
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              }
              accent="violet"
            />
          </FadeIn>
          <FadeIn delay={0.2}>
            <StepCard
              number="02"
              title="スワイプで選ぶ"
              description="写真を見て、直感で右か左。気になったら上スワイプで詳細。通勤3駅分で結構進む。"
              icon={
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                  />
                </svg>
              }
              accent="fuchsia"
            />
          </FadeIn>
          <FadeIn delay={0.3}>
            <StepCard
              number="03"
              title="マッチ → 即メッセージ"
              description="お互いLIKEで成立。チャットではじまる。ビデオ面接もアプリ内で完結。"
              icon={
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
                  />
                </svg>
              }
              accent="pink"
            />
          </FadeIn>
        </div>

        {/* CTA after steps */}
        <FadeIn delay={0.4} className="text-center mt-10 md:mt-14">
          <Link
            href="/swipe"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            試しにスワイプしてみる
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}

function StepCard({
  number,
  title,
  description,
  icon,
  accent,
}: {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accent: "violet" | "fuchsia" | "pink";
}) {
  const gradients = {
    violet: "from-violet-500 to-violet-600",
    fuchsia: "from-fuchsia-500 to-pink-500",
    pink: "from-pink-500 to-rose-500",
  };
  const glows = {
    violet: "shadow-violet-500/20",
    fuchsia: "shadow-fuchsia-500/20",
    pink: "shadow-pink-500/20",
  };

  return (
    <div className="relative group">
      <div className="relative p-6 md:p-8 rounded-3xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-300">
        <div className="flex items-center gap-4 mb-4">
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradients[accent]} flex items-center justify-center text-white shadow-lg ${glows[accent]}`}
          >
            {icon}
          </div>
          <span className="text-[11px] font-black text-white/20 tracking-[0.2em] tabular-nums">
            STEP {number}
          </span>
        </div>
        <h3 className="text-[18px] md:text-[20px] font-extrabold text-white mb-2">
          {title}
        </h3>
        <p className="text-[13px] md:text-[14px] text-white/50 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function FeatureShowcase() {
  return (
    <section className="bg-[#fbf8f3] overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-16 md:py-24">
        <FadeIn className="text-center mb-12 md:mb-16">
          <p className="text-[10px] tracking-[0.3em] text-violet-500 font-black mb-3">
            WHY SWIPLY
          </p>
          <h2 className="text-[26px] md:text-[42px] font-black text-gray-900 leading-tight">
            他の求人サイトとは、
            <br />
            <span className="relative inline-block">
              <span className="relative z-10">ちょっと違う。</span>
              <span className="absolute inset-x-0 bottom-1 md:bottom-2 h-3 md:h-4 bg-yellow-200/80 -z-0" />
            </span>
          </h2>
        </FadeIn>

        <div className="space-y-16 md:space-y-24">
          {/* Feature 1: Swipe */}
          <FadeIn>
            <FeatureRow
              tag="CORE"
              title="読む前に、見て決める。"
              description="長文の求人票を読み比べる時代は終わり。写真と30秒動画で職場の雰囲気が伝わる。直感で右にスワイプ。それが応募の第一歩。"
              image={`${BASE_PATH}/images/screens/screen-swipe.webp`}
              imageAlt="SWIPLY のスワイプ画面"
              reverse={false}
              accent="violet"
            />
          </FadeIn>

          {/* Feature 2: Messages */}
          <FadeIn>
            <FeatureRow
              tag="MATCH"
              title="マッチしたら、すぐ話せる。"
              description="お互いLIKEでマッチ成立。その場でチャット開始。「よろしくお願いします」から面接日程まで、メッセージひとつで進められる。"
              image={`${BASE_PATH}/images/screens/screen-messages.webp`}
              imageAlt="SWIPLY のメッセージ画面"
              reverse={true}
              accent="fuchsia"
            />
          </FadeIn>

          {/* Feature 3: Video Interview */}
          <FadeIn>
            <div className="relative rounded-3xl md:rounded-[2rem] bg-gradient-to-br from-gray-950 via-violet-950 to-gray-950 text-white p-6 md:p-10 overflow-hidden">
              <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-pink-500/10 blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-violet-500/15 blur-[80px] pointer-events-none" />
              <div className="relative md:flex md:items-center md:gap-10">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-500/15 border border-pink-400/30 text-pink-300 text-[10px] font-black tracking-[0.15em] mb-4">
                    NEW FEATURE
                  </div>
                  <h3 className="text-[22px] md:text-[32px] font-black leading-tight mb-3">
                    ビデオ面接 +<br />
                    <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                      AI 振り返り
                    </span>
                  </h3>
                  <p className="text-[13px] md:text-[15px] text-white/60 leading-relaxed mb-6 max-w-lg">
                    アプリ内ビデオ通話で面接。AIがリアルタイムで会話を分析し、
                    終了後に双方へフィードバックレポートを自動生成。
                    「次に活かせる」面接体験を。
                  </p>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {[
                      "ハラスメント検知",
                      "質問提案",
                      "自動レポート",
                      "LINE通知",
                    ].map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-white/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="hidden md:flex shrink-0 w-48 lg:w-56 aspect-square rounded-3xl bg-gradient-to-br from-violet-500/20 via-fuchsia-500/15 to-pink-400/20 items-center justify-center border border-white/10">
                  <div className="text-7xl lg:text-8xl">📹</div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

function FeatureRow({
  tag,
  title,
  description,
  image,
  imageAlt,
  reverse,
  accent,
}: {
  tag: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  reverse: boolean;
  accent: "violet" | "fuchsia";
}) {
  const tagColors = {
    violet: "text-violet-600 bg-violet-50 border-violet-100",
    fuchsia: "text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100",
  };

  return (
    <div
      className={`md:flex md:items-center md:gap-12 ${
        reverse ? "md:flex-row-reverse" : ""
      }`}
    >
      {/* Phone mockup */}
      <div className="md:w-[45%] mb-8 md:mb-0">
        <div className="relative mx-auto max-w-[280px] md:max-w-[320px]">
          {/* Phone frame */}
          <div className="relative rounded-[2.5rem] bg-gray-900 p-2.5 shadow-2xl shadow-gray-900/30 ring-1 ring-gray-800">
            <div className="rounded-[2rem] overflow-hidden bg-gray-100 aspect-[9/16]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={imageAlt}
                className="w-full h-full object-cover object-top"
                loading="lazy"
              />
            </div>
            {/* Notch */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-5 rounded-full bg-gray-900 z-10" />
          </div>
        </div>
      </div>

      {/* Text */}
      <div className="md:w-[55%]">
        <span
          className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-black tracking-[0.15em] mb-3 ${tagColors[accent]}`}
        >
          {tag}
        </span>
        <h3 className="text-[24px] md:text-[32px] font-black text-gray-900 leading-tight mb-3">
          {title}
        </h3>
        <p className="text-[14px] md:text-[16px] text-gray-600 leading-[1.8]">
          {description}
        </p>
      </div>
    </div>
  );
}

function LiveFomoSection() {
  const todayNew = useLiveCounter(342);
  const swipingNow = useLiveCounter(47);

  return (
    <FadeIn>
      <section className="bg-gradient-to-b from-[#fbf8f3] to-violet-50/50 py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[10px] tracking-[0.3em] text-violet-400 font-bold mb-3">
            RIGHT NOW
          </p>
          <h2 className="text-[24px] md:text-[36px] font-black text-gray-900 leading-tight mb-8">
            今、この瞬間も。
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
            <div className="flex items-center gap-3 px-6 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
              </div>
              <div className="text-left">
                <p className="text-[22px] font-black text-gray-900 tabular-nums leading-none">
                  {todayNew.toLocaleString()}件
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  今日の新着求人
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500" />
              </div>
              <div className="text-left">
                <p className="text-[22px] font-black text-gray-900 tabular-nums leading-none">
                  {swipingNow}人
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  今スワイプ中
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl shadow-lg shadow-violet-200/50">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <div className="text-left">
                <p className="text-[22px] font-black text-white tabular-nums leading-none">
                  87.3%
                </p>
                <p className="text-[11px] text-white/70 mt-0.5">
                  ユーザー満足度
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </FadeIn>
  );
}

function VoicesSection() {
  const voices = [
    {
      quote:
        "月曜の授業サボって電車でスワイプしてたら、渋谷のカフェに受かってた。今はラテアート練習中。",
      name: "さくらさん",
      detail: "大学3年・埼玉",
      initial: "S",
      gradient: "from-pink-300 to-violet-300",
      textColor: "text-violet-600",
    },
    {
      quote:
        "転職サイト5つ登録して疲弊してた。SWIPLYは写真で「ここで働く自分」が想像できるのが大きい。結局ここで決まった。",
      name: "けんたろうさん",
      detail: "28歳・元デザイナー",
      initial: "K",
      gradient: "from-blue-300 to-cyan-300",
      textColor: "text-blue-600",
    },
    {
      quote:
        "子育て中でもスキマ時間にサクサク。週2OKの事務が見つかって、半年ぶりに自分の時間ができた。",
      name: "ゆいさん",
      detail: "32歳・2児の母",
      initial: "Y",
      gradient: "from-emerald-300 to-teal-300",
      textColor: "text-emerald-600",
    },
  ];

  return (
    <section className="bg-[#fbf8f3] py-14 md:py-20">
      <div className="max-w-5xl mx-auto px-6 md:px-8">
        <FadeIn className="text-center mb-10 md:mb-14">
          <p className="text-[10px] tracking-[0.3em] text-gray-400 font-bold mb-2">
            USER VOICES
          </p>
          <h2 className="text-[24px] md:text-[40px] font-black text-gray-900 leading-tight">
            使ってくれた人の、
            <br />
            リアルな声。
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {voices.map((v, i) => (
            <FadeIn key={v.name} delay={i * 0.1}>
              <div className="bg-white rounded-3xl border border-gray-100 p-5 md:p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                {/* Stars */}
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <svg
                      key={j}
                      className="w-4 h-4 text-amber-400"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="text-[14px] md:text-[15px] text-gray-800 leading-[1.8] font-medium mb-4">
                  {v.quote}
                </p>
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${v.gradient} flex items-center justify-center text-[11px] font-black ${v.textColor}`}
                  >
                    {v.initial}
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-gray-900">
                      {v.name}
                    </p>
                    <p className="text-[10px] text-gray-400">{v.detail}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    {
      q: "本当に無料ですか？",
      a: "はい、求職者は完全無料です。課金ポイントもありません。企業側の掲載料で運営しています。",
    },
    {
      q: "スワイプって軽く見られません？",
      a: "企業側もSWIPLY審査を通過した上で掲載しています。「軽く始められる」だけで、中身は真剣です。",
    },
    {
      q: "学生でも使えますか？",
      a: "むしろ学生ユーザーが半分以上。アルバイトから新卒採用まで幅広く対応しています。",
    },
    {
      q: "個人情報は安全ですか？",
      a: "マッチ前に企業に公開されるのはプロフィール写真と表示名のみ。本名や連絡先はマッチ後に共有されます。",
    },
  ];

  return (
    <section className="bg-white py-14 md:py-20 border-y border-gray-100">
      <div className="max-w-3xl mx-auto px-6 md:px-8">
        <FadeIn className="text-center mb-8 md:mb-12">
          <p className="text-[10px] tracking-[0.3em] text-gray-400 font-bold mb-2">
            FAQ
          </p>
          <h2 className="text-[22px] md:text-[36px] font-black text-gray-900">
            よくある質問
          </h2>
        </FadeIn>

        <div className="space-y-3 md:space-y-4">
          {faqs.map((faq, i) => (
            <FadeIn key={faq.q} delay={i * 0.05}>
              <FAQItem q={faq.q} a={faq.a} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/50 transition"
      >
        <span className="text-[14px] md:text-[15px] font-bold text-gray-900">
          Q. {q}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 shrink-0 ml-4 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{
          maxHeight: open ? "200px" : "0px",
          opacity: open ? 1 : 0,
        }}
      >
        <p className="px-5 pb-4 text-[13px] md:text-[14px] text-gray-600 leading-relaxed">
          A. {a}
        </p>
      </div>
    </div>
  );
}

function BusinessBanner() {
  return (
    <section className="bg-[#fbf8f3] px-4 md:px-6 py-10 md:py-14">
      <div className="max-w-5xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-950 via-violet-950 to-gray-950 text-white px-6 md:px-12 py-10 md:py-14 shadow-2xl">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-72 h-72 rounded-full bg-fuchsia-500/15 blur-3xl pointer-events-none" />
          <div className="relative md:flex md:items-center md:gap-10">
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-400/15 border border-cyan-300/30 text-cyan-200 text-[10px] font-black tracking-[0.15em] mb-4">
                FOR BUSINESS
              </div>
              <h2 className="text-[22px] md:text-[36px] font-black leading-tight mb-4">
                採用担当の方へ。
                <br />
                <span className="bg-gradient-to-r from-cyan-300 to-fuchsia-300 bg-clip-text text-transparent">
                  スワイプ採用、はじめませんか。
                </span>
              </h2>
              <p className="text-white/60 text-[13px] md:text-[15px] leading-relaxed mb-6 max-w-xl">
                動画求人 × マッチング × AI面接。一括応募ではなく、本気の候補者だけ。
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/business"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-gray-900 font-black text-sm rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
                >
                  SWIPLY for Business →
                </Link>
              </div>
              <p className="text-[10px] text-white/30 mt-3">
                ファウンディングメンバー募集中（最初の100社限定）
              </p>
            </div>
            <div className="hidden md:flex shrink-0 w-40 lg:w-52 aspect-square rounded-3xl bg-gradient-to-br from-violet-500/20 via-fuchsia-500/15 to-cyan-400/20 items-center justify-center border border-white/10">
              <div className="text-6xl lg:text-7xl">📹</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTASection() {
  return (
    <section className="relative bg-[#0a0a0f] overflow-hidden py-20 md:py-28">
      {/* Gradient background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        <FadeIn>
          <p className="text-[11px] text-white/30 mb-4 tracking-widest">
            GET STARTED
          </p>
          <h2 className="text-[30px] md:text-[52px] font-black text-white leading-tight mb-6">
            次の仕事は、
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              スワイプの先に。
            </span>
          </h2>
          <p className="text-[14px] md:text-[16px] text-white/50 leading-relaxed mb-8 max-w-lg mx-auto">
            気になる企業に、1スワイプ。
            <br />
            はじめの一歩は、いつも軽い方がいい。
          </p>

          <Link
            href="/swipe"
            className="inline-flex items-center gap-2.5 px-12 md:px-16 py-4.5 md:py-5 bg-white text-gray-900 font-black text-[16px] md:text-[18px] rounded-2xl shadow-2xl shadow-white/15 hover:shadow-white/25 hover:scale-[1.03] active:scale-[0.98] transition-all"
          >
            スワイプをはじめる
            <svg
              className="w-5 h-5 text-violet-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
          <p className="text-[11px] text-white/30 mt-5">
            登録30秒 ・ 完全無料 ・ 退会いつでもOK
          </p>
        </FadeIn>

        {/* Footer */}
        <div className="mt-16 md:mt-20 flex flex-col items-center gap-3">
          <Logo size={40} radius={12} className="opacity-80" />
          <p className="font-black tracking-[0.25em] bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent text-[12px]">
            SWIPLY
          </p>
          <p className="text-[10px] text-white/20">
            Made with coffee in Tokyo. &copy; {new Date().getFullYear()} SWIPLY
          </p>
          <div className="flex items-center gap-4 mt-2 text-[11px] text-white/20">
            <Link href="/business" className="hover:text-white/40 transition">
              企業の方へ
            </Link>
            <span>・</span>
            <Link href="/search" className="hover:text-white/40 transition">
              求人検索
            </Link>
            <span>・</span>
            <Link href="/verify" className="hover:text-white/40 transition">
              本人確認
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Sticky bottom CTA on mobile — appears after scrolling past hero */
function StickyMobileCTA() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShow(window.scrollY > window.innerHeight * 0.8);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed md:hidden bottom-[62px] left-0 right-0 z-40 px-4 pb-2 transition-all duration-300 ${
        show
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <Link
        href="/swipe"
        className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-violet-500/30 active:scale-[0.98] transition-transform"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
        スワイプをはじめる
      </Link>
    </div>
  );
}

// ── Utility Components ──

function HorizontalStrip({ jobs }: { jobs: Job[] }) {
  return (
    <div className="-mx-4 md:-mx-8 px-4 md:px-8 overflow-x-auto scrollbar-none">
      <div
        className="flex gap-3 md:gap-4 pb-2"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {jobs.map((job) => (
          <div
            key={job.id}
            className="w-44 md:w-56 shrink-0"
            style={{ scrollSnapAlign: "start" }}
          >
            <JobListCard job={job} />
          </div>
        ))}
      </div>
    </div>
  );
}
