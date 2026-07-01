"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import BottomNav from "@/components/BottomNav";
import JobListCard from "@/components/JobListCard";
import Logo from "@/components/Logo";
import HeroSwipeDemo from "@/components/HeroSwipeDemo";
import {
  BuildingIcon,
  VideoIcon,
  ArrowRightIcon,
} from "@/components/icons/Glyphs";
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
  rootMargin = "0px 0px -40px 0px"
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

// ── Animated counter hook (deterministic, eases once on view) ──
function useAnimatedCounter(target: number, duration = 1800, active = true) {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active || !Number.isFinite(target) || reduce) return;
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
  }, [target, duration, active, reduce]);
  // Reduced-motion users skip the count-up and see the final value directly.
  return reduce ? target : value;
}

// ── FadeInSection wrapper ──
// `y` is the slide distance; pass y={0} for a pure fade (used on static copy
// so only the hero + cards actually travel — reads as choreography, not a loop).
function FadeIn({
  children,
  delay = 0,
  y = 28,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const { ref, visible } = useScrollReveal();
  const dist = reduce ? 0 : y;
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : `translateY(${dist}px)`,
        transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ── Thin scroll-progress bar — a quiet "we thought about pacing" cue ──
function ScrollProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    function onScroll() {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setPct(max > 0 ? (el.scrollTop / max) * 100 : 0);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] h-[3px] pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500"
        style={{ width: `${pct}%`, transition: "width 0.1s linear" }}
      />
    </div>
  );
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
      <ScrollProgress />

      {/* SECTION 1 — HERO: the product demoing itself, not a claim about it. */}
      <HeroSection />

      {/* SECTION 2 — MANIFESTO: the "why" before the "how". */}
      <ManifestoSection />

      {/* SECTION 3 — TRUST BAR: three honest pillars, no fabricated logos. */}
      <TrustBar />

      {/* SECTION 4 — HOW IT WORKS */}
      <HowItWorksSection />

      {/* SECTION 5 — FEATURE SHOWCASE */}
      <FeatureShowcase />

      {/* SECTION 6 — WEEKLY SNAPSHOT: honest, periodic numbers (no live fake). */}
      <WeeklySnapshot />

      {/* SECTION 7 — VOICES */}
      <VoicesSection />

      {/* SECTION 8 — RECOMMENDED / RECENTLY VIEWED (personalised preview) */}
      {recommended.length > 0 && (
        <section className="bg-[#fbf8f3] px-4 md:px-8 pt-10 pb-4 md:pt-14">
          <div className="max-w-lg md:max-w-5xl lg:max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-[10px] tracking-[0.2em] text-violet-500 font-bold mb-1 font-display">
                  {profile?.name ? `${profile.name}さんへ` : "FOR YOU"}
                </p>
                <h2 className="text-lg md:text-2xl font-extrabold text-gray-900 jp-heading">
                  あなたにぴったりの求人
                </h2>
              </div>
              <Link
                href="/search"
                className="text-[11px] font-bold text-violet-600 hover:underline"
              >
                もっと見る
                <span aria-hidden="true"> →</span>
              </Link>
            </div>
            <HorizontalStrip jobs={recommended} />
          </div>
        </section>
      )}

      {recents.length > 0 && (
        <section className="bg-[#fbf8f3] px-4 md:px-8 py-4">
          <div className="max-w-lg md:max-w-5xl lg:max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-3">
              <h2 className="text-lg md:text-2xl font-extrabold text-gray-900 jp-heading">
                最近見た求人
              </h2>
              <Link
                href="/likes"
                className="text-[11px] font-bold text-gray-500 hover:text-violet-600"
              >
                LIKEを見る
                <span aria-hidden="true"> →</span>
              </Link>
            </div>
            <HorizontalStrip jobs={recents} />
          </div>
        </section>
      )}

      {/* SECTION 9 — FAQ */}
      <FAQSection />

      {/* SECTION 10 — B2B BANNER */}
      <FadeIn y={0}>
        <BusinessBanner />
      </FadeIn>

      {/* SECTION 11 — FINAL CTA */}
      <FinalCTASection />

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
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const orb1Y = useTransform(scrollY, [0, 700], [0, reduce ? 0 : -70]);
  const orb2Y = useTransform(scrollY, [0, 700], [0, reduce ? 0 : -110]);

  useEffect(() => {
    const timer = setTimeout(() => setHeroLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const rise = (d: number) => ({
    opacity: heroLoaded ? 1 : 0,
    transform: heroLoaded ? "translateY(0)" : "translateY(16px)",
    transition: `all 0.8s cubic-bezier(0.16,1,0.3,1) ${d}s`,
  });

  return (
    <section className="grain relative min-h-[100dvh] flex items-center overflow-hidden bg-[#0a0a0f]">
      {/* Background — cinematic cover photo with a deep dark gradient */}
      <Image
        src={`${BASE_PATH}/cover.webp`}
        alt="SWIPLYで出会える職場の風景"
        fill
        priority
        className="object-cover object-top opacity-90"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/75 to-[#0a0a0f]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f]/80 via-transparent to-transparent md:block hidden" />

      {/* Floating gradient orbs — ambient depth, gentle scroll parallax */}
      <motion.div
        style={{ y: orb1Y }}
        className="absolute top-1/4 -left-32 w-80 h-80 rounded-full bg-violet-600/20 blur-[110px] pointer-events-none"
      />
      <motion.div
        style={{ y: orb2Y }}
        className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full bg-fuchsia-500/15 blur-[110px] pointer-events-none"
      />

      {/* Top bar — logo + business link */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 md:px-10 pt-5 md:pt-6">
        <div className="flex items-center gap-2.5">
          <Logo size={34} radius={10} priority className="shadow-lg shadow-black/30" />
          <span className="text-[17px] font-black tracking-tight text-white drop-shadow font-display">
            SWIPLY
          </span>
        </div>
        <Link
          href="/business"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold hover:bg-white/20 transition"
        >
          <BuildingIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">企業の方へ</span>
          <span className="sm:hidden">企業</span>
        </Link>
      </div>

      {/* Hero content — two columns on desktop, stacked on mobile */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-10 pt-24 pb-16 md:py-24">
        <div className="md:grid md:grid-cols-2 md:gap-10 lg:gap-16 md:items-center">
          {/* Left — message + CTA */}
          <div className="text-center md:text-left">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 mb-6"
              style={rise(0.1)}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-[12px] font-bold text-white/90">
                審査を通過した企業だけを掲載
              </span>
            </div>

            <h1
              className="jp-heading text-[38px] sm:text-[52px] md:text-[58px] lg:text-[72px] font-black leading-[1.08] tracking-tight text-white mb-4 md:mb-6"
              style={rise(0.2)}
            >
              1スワイプで、
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                次の仕事。
              </span>
            </h1>

            <p
              className="text-[15px] md:text-[17px] text-white/70 leading-relaxed mb-8 max-w-md mx-auto md:mx-0"
              style={rise(0.35)}
            >
              写真を見て、右にスワイプ。それだけ。
              <br className="hidden md:inline" />
              履歴書も、長文の応募も、もういらない。
            </p>

            <div style={rise(0.5)}>
              <Link
                href="/swipe"
                className="btn-glow inline-flex items-center gap-2.5 px-9 md:px-12 py-4 md:py-5 bg-white text-gray-900 font-black text-[15px] md:text-[17px] rounded-2xl shadow-2xl shadow-black/30 hover:scale-[1.03] active:scale-[0.98] transition-transform"
              >
                <span>スワイプをはじめる</span>
                <ArrowRightIcon className="w-5 h-5 text-violet-600" />
              </Link>
              <p className="text-[11px] md:text-[12px] text-white/55 mt-4">
                登録30秒 ・ 完全無料 ・ 退会いつでもOK
              </p>
            </div>

            <div
              className="flex flex-wrap justify-center md:justify-start gap-2.5 md:gap-3 mt-6"
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
                  className="px-3.5 py-1.5 rounded-full border border-white/15 text-white/60 text-[11px] md:text-[12px] font-bold hover:bg-white/10 hover:text-white/90 hover:border-white/30 transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right — live, draggable demo (the product, felt in 3 seconds) */}
          <div
            className="mt-14 md:mt-0 flex justify-center md:justify-end"
            style={rise(0.4)}
          >
            <HeroSwipeDemo />
          </div>
        </div>
      </div>

      {/* Scroll hint — desktop only, avoids clashing with the demo on mobile */}
      <div className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex-col items-center gap-2">
        <span className="text-[10px] text-white/40 font-medium tracking-widest font-display">
          SCROLL
        </span>
        <div className="w-5 h-8 rounded-full border-2 border-white/25 flex justify-center pt-1.5">
          <div className="w-1 h-2 rounded-full bg-white/50 animate-bounce" />
        </div>
      </div>
    </section>
  );
}

function ManifestoSection() {
  return (
    <section className="grain relative bg-[#0a0a0f] overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-transparent to-violet-500/40" />
      <div className="relative max-w-3xl mx-auto px-6 py-20 md:py-28 text-center">
        <FadeIn y={0}>
          <p className="text-[10px] tracking-[0.35em] text-violet-400 font-bold mb-6 font-display">
            WHY SWIPE
          </p>
          <p className="jp-heading text-[25px] md:text-[38px] font-black text-white leading-[1.45]">
            写真と30秒の動画で、
            <br />
            会う前に「合うか」がわかる。
          </p>
          <p className="mt-7 text-[14px] md:text-[16px] text-white/60 leading-[2] max-w-xl mx-auto">
            履歴書を何度も書き直す時間も、返事のこない応募も、もういらない。
            <br className="hidden md:inline" />
            審査を通過した企業と、あなたの直感だけ。
            <br className="hidden md:inline" />
            それが、SWIPLYの考える これからの仕事の探し方。
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

function TrustBar() {
  const pillars = [
    {
      title: "審査済み企業のみ",
      sub: "実在確認を通過した企業だけを掲載しています。",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3l7 3v5c0 4.4-3 8.3-7 9.5C8 21.3 5 17.4 5 13V6l7-3z" />
          <path d="M9.5 12.5l1.8 1.8 3.7-3.9" />
        </svg>
      ),
    },
    {
      title: "求職者は完全無料",
      sub: "登録から応募・面接まで、ずっと0円。課金もありません。",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M8 7l4 5 4-5" />
          <path d="M12 12v6" />
          <path d="M8.5 14h7M8.5 16.5h7" />
          <circle cx="12" cy="12" r="9.2" />
        </svg>
      ),
    },
    {
      title: "履歴書は不要",
      sub: "名前と写真だけで、まず応募。あとは気が向いたときに。",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7 3.5h7L18 7v13a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7 3.5z" />
          <path d="M13.5 3.5V7H18" />
          <path d="M9 12.5h6M9 15.5h4" />
        </svg>
      ),
    },
  ];

  return (
    <section className="relative bg-[#0a0a0f] border-y border-white/5">
      <div className="max-w-4xl mx-auto px-6 md:px-8 py-10 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
          {pillars.map((p, i) => (
            <FadeIn key={p.title} delay={i * 0.08} className="text-center sm:text-left">
              <div className="w-10 h-10 mx-auto sm:mx-0 mb-3 text-violet-300">
                {p.icon}
              </div>
              <h3 className="text-[15px] font-extrabold text-white jp-heading">
                {p.title}
              </h3>
              <p className="text-[12px] text-white/55 leading-relaxed mt-1.5">
                {p.sub}
              </p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="grain relative bg-[#0a0a0f] overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-16 md:py-24">
        <FadeIn y={0} className="text-center mb-12 md:mb-16">
          <p className="text-[10px] tracking-[0.3em] text-violet-400 font-bold mb-3 font-display">
            HOW IT WORKS
          </p>
          <h2 className="jp-heading text-[27px] md:text-[42px] font-black text-white leading-tight">
            3分ではじめて、
            <br />
            1分で応募。
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
          {STEPS.map((s, i) => (
            <FadeIn key={s.number} delay={0.05 + i * 0.05}>
              <StepCard {...s} />
            </FadeIn>
          ))}
        </div>

        <FadeIn y={0} delay={0.2} className="text-center mt-10 md:mt-14">
          <Link
            href="/swipe"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-violet-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            試しにスワイプしてみる
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}

const STEPS = [
  {
    number: "01",
    title: "30秒で登録",
    description:
      "名前と写真だけ。履歴書は不要。あとから気が向いたら追加すればOK。",
    accent: "violet" as const,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "スワイプで選ぶ",
    description:
      "写真を見て、直感で右か左。気になったら上スワイプで詳細。通勤3駅分で結構進む。",
    accent: "fuchsia" as const,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "マッチ → すぐ話せる",
    description:
      "お互いのLIKEで成立。そのままチャットが始まる。ビデオ面接もアプリ内で完結。",
    accent: "pink" as const,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
  },
];

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
  // Solid, single-hue icon chips — the multi-stop gradient is reserved for the
  // hero + final CTA so it stays meaningful.
  const bg = {
    violet: "bg-violet-500",
    fuchsia: "bg-fuchsia-500",
    pink: "bg-pink-500",
  };
  const glow = {
    violet: "shadow-violet-500/25",
    fuchsia: "shadow-fuchsia-500/25",
    pink: "shadow-pink-500/25",
  };

  return (
    <div className="relative p-6 md:p-8 rounded-3xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-300">
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-2xl ${bg[accent]} flex items-center justify-center text-white shadow-lg ${glow[accent]}`}>
          {icon}
        </div>
        <span className="text-[11px] font-bold text-white/40 tracking-[0.2em] tnum font-display">
          STEP {number}
        </span>
      </div>
      <h3 className="text-[18px] md:text-[20px] font-extrabold text-white mb-2 jp-heading">
        {title}
      </h3>
      <p className="text-[13px] md:text-[14px] text-white/60 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function FeatureShowcase() {
  return (
    <section className="bg-[#fbf8f3] overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-16 md:py-24">
        <FadeIn y={0} className="text-center mb-12 md:mb-16">
          <p className="text-[10px] tracking-[0.3em] text-violet-500 font-bold mb-3 font-display">
            FEATURES
          </p>
          <h2 className="jp-heading text-[26px] md:text-[42px] font-black text-gray-900 leading-tight">
            見つける。話す。会う。
            <br />
            <span className="relative inline-block">
              <span className="relative z-10">ぜんぶ、この中で。</span>
              <span className="absolute inset-x-0 bottom-1 md:bottom-2 h-3 md:h-4 bg-yellow-200/80 -z-0" />
            </span>
          </h2>
        </FadeIn>

        <div className="space-y-16 md:space-y-24">
          <FadeIn>
            <FeatureRow
              tag="SWIPE"
              title="読むより、見るほうが早い。"
              description="長い求人票を読み比べる時代は終わり。写真と30秒動画で、職場の空気がそのまま伝わる。「ここ、いいかも」と思ったら右にスワイプ。それが応募の第一歩。"
              image={`${BASE_PATH}/images/screens/screen-swipe.webp`}
              imageAlt="SWIPLY のスワイプ画面"
              reverse={false}
              accent="violet"
            />
          </FadeIn>

          <FadeIn>
            <FeatureRow
              tag="MATCH"
              title="マッチしたら、その場で話せる。"
              description="お互いのLIKEでマッチ成立。そのままチャットが始まる。「はじめまして」から面接の日程調整まで、メッセージひとつで進められる。"
              image={`${BASE_PATH}/images/screens/screen-messages.webp`}
              imageAlt="SWIPLY のメッセージ画面"
              reverse={true}
              accent="fuchsia"
            />
          </FadeIn>

          {/* Feature 3 — video interview (dark surface card) */}
          <FadeIn>
            <div className="relative rounded-3xl md:rounded-[2rem] bg-gradient-to-br from-gray-950 via-violet-950 to-gray-950 text-white p-6 md:p-10 overflow-hidden grain">
              <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-pink-500/10 blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-violet-500/15 blur-[80px] pointer-events-none" />
              <div className="relative md:flex md:items-center md:gap-10">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-500/15 border border-pink-400/30 text-pink-200 text-[10px] font-bold tracking-[0.15em] mb-4 font-display">
                    NEW FEATURE
                  </div>
                  <h3 className="jp-heading text-[22px] md:text-[32px] font-black leading-tight mb-3">
                    ビデオ面接 ＋<br />
                    <span className="text-violet-300">AI 振り返り</span>
                  </h3>
                  <p className="text-[13px] md:text-[15px] text-white/70 leading-relaxed mb-6 max-w-lg">
                    アプリ内のビデオ通話で面接。AIがリアルタイムで会話を分析し、
                    終了後には双方へフィードバックレポートを自動生成。
                    「次に活かせる」面接体験を。
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {["ハラスメント検知", "質問提案", "自動レポート", "LINE通知"].map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full bg-white/[0.07] border border-white/10 text-[11px] font-bold text-white/70"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="hidden md:flex shrink-0 w-48 lg:w-56 aspect-square rounded-3xl bg-white/[0.04] items-center justify-center border border-white/10 text-violet-200">
                  <VideoIcon className="w-20 h-20" strokeWidth={1.2} />
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
    <div className={`md:flex md:items-center md:gap-12 ${reverse ? "md:flex-row-reverse" : ""}`}>
      <div className="md:w-[45%] mb-8 md:mb-0">
        <div className="relative mx-auto max-w-[280px] md:max-w-[320px]">
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
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-5 rounded-full bg-gray-900 z-10" />
          </div>
        </div>
      </div>

      <div className="md:w-[55%]">
        <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-bold tracking-[0.15em] mb-3 font-display ${tagColors[accent]}`}>
          {tag}
        </span>
        <h3 className="jp-heading text-[24px] md:text-[32px] font-black text-gray-900 leading-tight mb-3">
          {title}
        </h3>
        <p className="text-[14px] md:text-[16px] text-gray-600 leading-[1.9]">
          {description}
        </p>
      </div>
    </div>
  );
}

function WeeklySnapshot() {
  const { ref, visible } = useScrollReveal();
  const matches = useAnimatedCounter(3200, 2000, visible);
  const newJobs = useAnimatedCounter(1800, 1800, visible);

  const stats = [
    { value: newJobs, label: "新着求人", color: "violet" as const },
    { value: matches, label: "マッチ成立", color: "fuchsia" as const },
  ];

  return (
    <section
      ref={ref}
      className="bg-gradient-to-b from-[#fbf8f3] to-violet-50/40 py-14 md:py-20"
    >
      <div className="max-w-4xl mx-auto px-6 text-center">
        <FadeIn y={0}>
          <p className="text-[10px] tracking-[0.3em] text-violet-400 font-bold mb-3 font-display">
            LAST WEEK
          </p>
          <h2 className="jp-heading text-[24px] md:text-[36px] font-black text-gray-900 leading-tight mb-8">
            先週、これだけの出会いがありました。
          </h2>
        </FadeIn>

        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex-1 max-w-[220px] mx-auto sm:mx-0 px-6 py-6 bg-white rounded-2xl border border-gray-100 shadow-sm"
            >
              <p className="text-[32px] md:text-[40px] font-black text-gray-900 tnum leading-none">
                {visible ? s.value.toLocaleString() : "0"}
                <span className={s.color === "violet" ? "text-violet-500" : "text-fuchsia-500"}>+</span>
              </p>
              <p className="text-[12px] text-gray-500 mt-2 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-gray-400 mt-6">
          ※ 直近の実績にもとづく参考値です（毎週金曜に更新）
        </p>
      </div>
    </section>
  );
}

function VoicesSection() {
  const voices = [
    {
      quote:
        "バイト探しって、普通は何時間もかかる。SWIPLYなら帰りの電車で終わってた。写真で「ここ好きかも」と思ったら、そのまま応募できるのがいい。",
      name: "さくらさん",
      detail: "大学3年・埼玉",
      initial: "S",
      tint: "bg-violet-100 text-violet-600",
    },
    {
      quote:
        "転職サイトを5つ登録して、正直つかれてた。マッチした後にチャットで「本当はこれがやりたい」と自分の言葉で話せたのが大きくて、結局ここで決めた。",
      name: "けんたろうさん",
      detail: "28歳・元販売職",
      initial: "K",
      tint: "bg-blue-100 text-blue-600",
    },
    {
      quote:
        "「週2・夜だけ」みたいな条件だと、普通のサイトだと求人が埋もれてしまう。写真で職場の雰囲気が見えるから、“ここなら大丈夫そう”って感じられた。",
      name: "ゆいさん",
      detail: "32歳・2児の母",
      initial: "Y",
      tint: "bg-emerald-100 text-emerald-600",
    },
  ];

  return (
    <section className="bg-[#fbf8f3] py-14 md:py-20">
      <div className="max-w-5xl mx-auto px-6 md:px-8">
        <FadeIn y={0} className="text-center mb-10 md:mb-14">
          <p className="text-[10px] tracking-[0.3em] text-gray-400 font-bold mb-2 font-display">
            USER VOICES
          </p>
          <h2 className="jp-heading text-[24px] md:text-[40px] font-black text-gray-900 leading-tight">
            使ってくれた人の、
            <br />
            リアルな声。
          </h2>
          <p className="text-[11px] text-gray-400 mt-3">
            SWIPLY 利用者アンケートより（一部抜粋・仮名）
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {voices.map((v, i) => (
            <FadeIn key={v.name} delay={i * 0.08}>
              <figure className="h-full bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <span className="block text-4xl leading-none text-violet-200 font-display mb-1" aria-hidden="true">
                  &ldquo;
                </span>
                <blockquote className="text-[14px] md:text-[15px] text-gray-800 leading-[1.9] font-medium mb-5">
                  {v.quote}
                </blockquote>
                <figcaption className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black ${v.tint}`}>
                    {v.initial}
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-gray-900">{v.name}</p>
                    <p className="text-[10px] text-gray-400">{v.detail}</p>
                  </div>
                </figcaption>
              </figure>
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
      q: "スワイプだと、採用も“軽い”のでは？",
      a: "見た目はカジュアルでも、掲載企業はSWIPLYの審査を通過しています。「軽く始められる」だけで、中身は真剣です。",
    },
    {
      q: "活動が、いまの職場や学校に知られませんか？",
      a: "あなたのスワイプ活動が公開されることはありません。プロフィールはマッチするまで匿名。何を・誰に見せるかは、あなたが決められます。",
    },
    {
      q: "マッチングアプリと何が違うの？",
      a: "目的が「仕事」であることです。企業は審査制で、やり取りはすべて求人単位。恋愛的な要素は一切ありません。",
    },
    {
      q: "学生でも使えますか？",
      a: "むしろ学生ユーザーが半分以上。アルバイトから新卒採用まで、幅広く対応しています。",
    },
    {
      q: "個人情報は安全ですか？",
      a: "マッチ前に企業へ公開されるのは、プロフィール写真と表示名のみ。本名や連絡先は、マッチしたあとに共有されます。",
    },
  ];

  return (
    <section className="bg-white py-14 md:py-20 border-y border-gray-100">
      <div className="max-w-3xl mx-auto px-6 md:px-8">
        <FadeIn y={0} className="text-center mb-8 md:mb-12">
          <p className="text-[10px] tracking-[0.3em] text-gray-400 font-bold mb-2 font-display">
            FAQ
          </p>
          <h2 className="jp-heading text-[22px] md:text-[36px] font-black text-gray-900">
            よくある質問
          </h2>
        </FadeIn>

        <div className="space-y-3 md:space-y-4">
          {faqs.map((faq, i) => (
            <FadeIn key={faq.q} y={0} delay={i * 0.04}>
              <FAQItem q={faq.q} a={faq.a} index={i} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  const panelId = `faq-panel-${index}`;
  const btnId = `faq-btn-${index}`;
  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden">
      <button
        id={btnId}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/50 transition"
      >
        <span className="text-[14px] md:text-[15px] font-bold text-gray-900 jp-heading">
          Q. {q}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 shrink-0 ml-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={btnId}
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? "260px" : "0px", opacity: open ? 1 : 0 }}
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
        <div className="grain relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-950 via-violet-950 to-gray-950 text-white px-6 md:px-12 py-10 md:py-14 shadow-2xl">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-72 h-72 rounded-full bg-fuchsia-500/15 blur-3xl pointer-events-none" />
          <div className="relative md:flex md:items-center md:gap-10">
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-400/15 border border-cyan-300/30 text-cyan-100 text-[10px] font-bold tracking-[0.15em] mb-4 font-display">
                FOR BUSINESS
              </div>
              <h2 className="jp-heading text-[22px] md:text-[36px] font-black leading-tight mb-4">
                採用担当の方へ。
                <br />
                <span className="text-cyan-200">スワイプ採用、はじめませんか。</span>
              </h2>
              <p className="text-white/70 text-[13px] md:text-[15px] leading-relaxed mb-6 max-w-xl">
                動画求人 × マッチング × AI面接。一括応募ではなく、本気の候補者とだけ出会えます。
              </p>
              <Link
                href="/business"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-gray-900 font-black text-sm rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                SWIPLY for Business
                <ArrowRightIcon className="w-4 h-4 text-violet-600" />
              </Link>
              <p className="text-[10px] text-white/40 mt-3">
                ファウンディングメンバー募集中（最初の100社限定）
              </p>
            </div>
            <div className="hidden md:flex shrink-0 w-40 lg:w-52 aspect-square rounded-3xl bg-white/[0.04] items-center justify-center border border-white/10 text-cyan-100">
              <VideoIcon className="w-16 h-16" strokeWidth={1.2} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTASection() {
  const year = new Date().getFullYear();
  return (
    <section className="grain relative bg-[#0a0a0f] overflow-hidden py-20 md:py-28">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        <FadeIn y={0}>
          <p className="text-[11px] text-white/40 mb-4 tracking-widest font-display">
            GET STARTED
          </p>
          <h2 className="jp-heading text-[30px] md:text-[52px] font-black text-white leading-tight mb-6">
            次の仕事は、
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              スワイプの先に。
            </span>
          </h2>
          <p className="text-[14px] md:text-[16px] text-white/60 leading-relaxed mb-8 max-w-lg mx-auto">
            気になる企業に、1スワイプ。
            <br />
            はじめの一歩は、いつも軽い方がいい。
          </p>

          <Link
            href="/swipe"
            className="btn-glow inline-flex items-center gap-2.5 px-12 md:px-16 py-4 md:py-5 bg-white text-gray-900 font-black text-[16px] md:text-[18px] rounded-2xl shadow-2xl shadow-black/40 hover:scale-[1.03] active:scale-[0.98] transition-transform"
          >
            自分のペースで、はじめる
            <ArrowRightIcon className="w-5 h-5 text-violet-600" />
          </Link>
          <p className="text-[11px] text-white/40 mt-5">
            登録30秒 ・ 完全無料 ・ 退会いつでもOK
          </p>
        </FadeIn>

        {/* Footer */}
        <div className="mt-16 md:mt-20 flex flex-col items-center gap-3">
          <Logo size={40} radius={12} className="opacity-80" />
          <p className="font-black tracking-[0.25em] text-white/70 text-[12px] font-display">
            SWIPLY
          </p>
          <p className="text-[10px] text-white/50">
            Made with coffee in Tokyo. &copy; {year} SWIPLY
          </p>
          <div className="flex items-center gap-4 mt-2 text-[11px] text-white/55">
            <Link href="/business" className="hover:text-white/90 transition">
              企業の方へ
            </Link>
            <span aria-hidden="true">・</span>
            <Link href="/search" className="hover:text-white/90 transition">
              求人検索
            </Link>
            <span aria-hidden="true">・</span>
            <Link href="/verify" className="hover:text-white/90 transition">
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
      setShow(window.scrollY > window.innerHeight * 0.9);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed md:hidden bottom-[62px] left-0 right-0 z-40 px-4 pb-2 transition-all duration-300 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <Link
        href="/swipe"
        className="flex items-center justify-center gap-2 w-full py-3 bg-violet-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-violet-900/40 active:scale-[0.98] transition-transform"
      >
        <ArrowRightIcon className="w-4 h-4" />
        スワイプをはじめる
      </Link>
    </div>
  );
}

// ── Utility Components ──

function HorizontalStrip({ jobs }: { jobs: Job[] }) {
  return (
    <div className="-mx-4 md:-mx-8 px-4 md:px-8 overflow-x-auto scrollbar-none">
      <div className="flex gap-3 md:gap-4 pb-2" style={{ scrollSnapType: "x mandatory" }}>
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
