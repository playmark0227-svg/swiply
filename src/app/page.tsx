"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
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

const BASE_PATH = process.env.NODE_ENV === "production" ? "/swiply" : "";

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
        ids.map((id) => all.find((j) => j.id === id)).filter((j): j is Job => !!j).slice(0, 8)
      );
      if (!p.onboarded) {
        // Slight delay to avoid jarring open on first paint.
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
    <div className="min-h-dvh bg-[#fbf8f3] pb-20">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[560px] md:min-h-[640px] lg:min-h-[720px]">
        <Image
          src={`${BASE_PATH}/cover.png`}
          alt="働く人たち"
          fill
          priority
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/92 via-gray-950/35 to-transparent md:bg-gradient-to-r md:from-gray-950/92 md:via-gray-950/50 md:to-transparent" />

        {/* Logo top-left (mobile only — desktop uses Header) */}
        <div className="absolute top-5 left-5 md:hidden flex items-center gap-2">
          <Logo size={32} radius={10} priority />
          <span className="text-white text-base font-black tracking-widest drop-shadow">SWIPLY</span>
        </div>

        {/* Top-right business shortcut (mobile only — desktop uses Header) */}
        <Link
          href="/business"
          className="md:hidden absolute top-5 right-5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-[10px] font-bold hover:bg-white/25 active:scale-95 transition"
        >
          <span>🏢</span>
          <span>企業の方へ</span>
        </Link>

        {/* Text content */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-9 md:px-12 md:pb-16 lg:px-20 lg:pb-24">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-[640px]">
              <p className="text-white/60 text-[10px] md:text-xs font-medium mb-3 italic tracking-wide">
                — a new way to find your next job.
              </p>
              <h1 className="text-[30px] md:text-[52px] lg:text-[68px] font-black leading-[1.15] md:leading-[1.05] text-white mb-3 md:mb-5 drop-shadow-lg">
                履歴書の前に、<br />
                <span className="relative inline-block">
                  <span className="relative z-10">スワイプ</span>
                  <span className="absolute inset-x-0 bottom-1 md:bottom-2 h-3 md:h-5 bg-yellow-300/80 -z-0"></span>
                </span>
                でいい。
              </h1>
              <p className="text-white/80 text-[13px] md:text-base leading-relaxed mb-6 md:mb-8 max-w-[22rem] md:max-w-[32rem]">
                スワイプひとつで、会いたい企業まで最短距離。<br />
                履歴書も、長文応募も、要らない。
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 md:gap-3 md:max-w-md">
                <Link
                  href="/swipe"
                  className="flex-1 py-3.5 md:py-4 px-6 bg-white text-gray-900 text-center font-black rounded-2xl text-sm md:text-base shadow-xl shadow-black/30 active:scale-[0.97] hover:scale-[1.02] transition-transform"
                >
                  スワイプをはじめる →
                </Link>
              </div>
              <div className="flex gap-4 md:gap-6 mt-3 md:mt-5 text-[11px] md:text-sm text-white/60">
                <Link href="/baito" className="underline underline-offset-4 hover:text-white transition">バイトを見る</Link>
                <Link href="/gig" className="underline underline-offset-4 hover:text-white transition">単発を見る</Link>
                <Link href="/career" className="underline underline-offset-4 hover:text-white transition">正社員を見る</Link>
              </div>

              {/* Hero — secondary B2B CTA pill (desktop). Tightly designed
                  so it never competes with the primary "スワイプをはじめる"
                  button, but is far more discoverable than a tiny grey link. */}
              <Link
                href="/business"
                className="hidden md:inline-flex items-center gap-2.5 mt-7 px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/25 text-white text-[12px] font-bold hover:bg-white/20 hover:border-white/40 active:scale-[0.98] transition"
              >
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-cyan-400/30 text-cyan-100 text-[11px]">
                  🏢
                </span>
                <span>採用ご担当の方へ</span>
                <span className="text-cyan-300 font-black">SWIPLY for Business →</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick stats strip ── */}
      <section className="relative border-y border-gray-900/10 bg-white">
        <div className="max-w-lg md:max-w-5xl mx-auto px-5 md:px-8 py-5 md:py-8 flex items-center justify-between">
          <div>
            <p className="text-[22px] md:text-[36px] font-black text-gray-900 leading-none tabular-nums">12,347</p>
            <p className="text-[10px] md:text-xs text-gray-500 mt-1 md:mt-2">いま掲載中の求人</p>
          </div>
          <div className="h-10 md:h-14 w-px bg-gray-200" />
          <div>
            <p className="text-[22px] md:text-[36px] font-black text-gray-900 leading-none tabular-nums">98,421</p>
            <p className="text-[10px] md:text-xs text-gray-500 mt-1 md:mt-2">登録者</p>
          </div>
          <div className="h-10 md:h-14 w-px bg-gray-200" />
          <div>
            <p className="text-[22px] md:text-[36px] font-black text-gray-900 leading-none tabular-nums">
              87.3<span className="text-sm md:text-xl">%</span>
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 mt-1 md:mt-2">満足度</p>
          </div>
        </div>
      </section>

      {/* ── NEW: Feature showcase ──
          Walks the user through what SWIPLY can actually do, end-to-end.
          Replaces the older "feature card" pattern with a magazine-style
          numbered list that matches the LP's existing tone. */}
      <FeatureShowcase />

      {/* ── Recommended jobs ── */}
      {recommended.length > 0 && (
        <section className="px-4 md:px-8 pt-8 pb-2 max-w-lg md:max-w-5xl lg:max-w-6xl mx-auto w-full">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-[10px] tracking-[0.2em] text-violet-500 font-bold mb-1">
                {profile?.name ? `${profile.name}さんに` : "あなたに"} OBSESSED
              </p>
              <h2 className="text-lg md:text-2xl font-extrabold text-gray-900">おすすめの求人</h2>
            </div>
            <Link href="/search" className="text-[11px] font-bold text-violet-600 hover:underline">
              もっと見る →
            </Link>
          </div>
          <HorizontalStrip jobs={recommended} />
        </section>
      )}

      {/* ── Recently viewed ── */}
      {recents.length > 0 && (
        <section className="px-4 md:px-8 py-4 max-w-lg md:max-w-5xl lg:max-w-6xl mx-auto w-full">
          <div className="flex items-end justify-between mb-3">
            <h2 className="text-lg md:text-2xl font-extrabold text-gray-900">最近見た求人</h2>
            <Link href="/likes" className="text-[11px] font-bold text-gray-500 hover:text-violet-600">
              LIKEを見る →
            </Link>
          </div>
          <HorizontalStrip jobs={recents} />
        </section>
      )}

      {/* ── Founder's note ── */}
      <section className="px-6 pt-10 md:pt-16 pb-6 max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto">
        <p className="text-[11px] md:text-xs text-gray-400 mb-3">— はじめに、少しだけ。</p>
        <p className="text-[15px] md:text-[17px] text-gray-800 leading-[1.9] font-medium">
          正直、<span className="bg-yellow-100 px-1">就活サイトってどれも似てる</span>と思ってた。
          長いプロフィール、終わらないスクロール、「あなたへのおすすめ」と言いながら全然刺さらない求人。
        </p>
        <p className="text-[15px] md:text-[17px] text-gray-800 leading-[1.9] font-medium mt-4">
          だから作った。<br />
          写真を見て、1秒で「いいな」って思える方を選ぶ。
          それだけで仕事って見つかるんじゃないか、っていう実験。
        </p>
        <p className="text-[15px] md:text-[17px] text-gray-800 leading-[1.9] font-medium mt-4">
          使ってみて、もし合わなかったらごめんなさい。
          でも、たぶん、思ってるより気楽に探せる。
        </p>
        <div className="mt-6 flex items-center gap-3">
          <div
            className="text-xl md:text-2xl text-gray-600"
            style={{ fontFamily: '"Caveat", "Segoe Script", cursive' }}
          >
            — SWIPLY 運営チーム
          </div>
        </div>
      </section>

      {/* ── Divider with ornament ── */}
      <div className="flex items-center gap-3 max-w-lg md:max-w-3xl lg:max-w-4xl mx-auto px-8 py-4">
        <div className="flex-1 h-px bg-gray-300/60" />
        <span className="text-gray-400 text-xs">✦</span>
        <div className="flex-1 h-px bg-gray-300/60" />
      </div>

      {/* ── Why swipe (text-heavy, no emoji cards) ── */}
      <section className="px-6 py-8 md:py-14 max-w-lg md:max-w-5xl lg:max-w-6xl mx-auto">
        <h2 className="text-[22px] md:text-[40px] lg:text-[48px] font-black text-gray-900 leading-tight mb-6 md:mb-10">
          スワイプ式の、<br />
          ちょっと真面目な話。
        </h2>

        <div className="space-y-7 md:space-y-0 md:grid md:grid-cols-3 md:gap-8">
          <div>
            <div className="flex items-baseline gap-3 mb-1.5">
              <span className="text-[11px] font-black text-violet-600 tabular-nums">01 /</span>
              <h3 className="text-[15px] font-bold text-gray-900">
                「読む」より「見る」ほうが早い
              </h3>
            </div>
            <p className="text-[13px] text-gray-600 leading-relaxed pl-8">
              長文の求人票を読み比べるより、写真とキャッチで直感的に判断するほうが、
              実は自分に合う職場を見つけやすい。心理学でもそう言われてる、らしい。
            </p>
          </div>

          <div>
            <div className="flex items-baseline gap-3 mb-1.5">
              <span className="text-[11px] font-black text-violet-600 tabular-nums">02 /</span>
              <h3 className="text-[15px] font-bold text-gray-900">
                履歴書、最初からはいらない
              </h3>
            </div>
            <p className="text-[13px] text-gray-600 leading-relaxed pl-8">
              気になった求人にLIKEを送るだけ。向こうも興味を持ってくれたら、
              そこからやりとりが始まる。最初の一歩を軽くしたかった。
            </p>
          </div>

          <div>
            <div className="flex items-baseline gap-3 mb-1.5">
              <span className="text-[11px] font-black text-violet-600 tabular-nums">03 /</span>
              <h3 className="text-[15px] font-bold text-gray-900">
                使うほど、精度が上がる
              </h3>
            </div>
            <p className="text-[13px] text-gray-600 leading-relaxed pl-8">
              スワイプは、言葉にできない好みを可視化する。左に流した理由、右に流した理由。
              積み重なるほど、次に出てくる求人があなたに近づいていく。
            </p>
          </div>
        </div>
      </section>

      {/* ── Dark product photo section — extended to 4 steps ── */}
      <section className="bg-gray-950 text-white my-6">
        <div className="max-w-lg md:max-w-3xl lg:max-w-4xl mx-auto px-6 py-10">
          <p className="text-[10px] tracking-[0.3em] text-violet-300 font-bold mb-3">HOW IT WORKS</p>
          <h2 className="text-[22px] md:text-[34px] font-black leading-tight mb-8">
            3分で、はじめられる。
          </h2>

          <ol className="space-y-6">
            <li className="flex gap-5">
              <div className="shrink-0 w-10 h-10 rounded-full border-2 border-violet-400 flex items-center justify-center text-violet-300 text-sm font-black">
                1
              </div>
              <div className="pt-1.5">
                <p className="font-bold text-[15px] mb-1">プロフィールをつくる</p>
                <p className="text-[12px] text-gray-400 leading-relaxed">
                  写真、ひとこと、希望のざっくりした方向性。&quot;書かない&quot;ことも選択肢。
                </p>
              </div>
            </li>
            <li className="flex gap-5">
              <div className="shrink-0 w-10 h-10 rounded-full border-2 border-violet-400 flex items-center justify-center text-violet-300 text-sm font-black">
                2
              </div>
              <div className="pt-1.5">
                <p className="font-bold text-[15px] mb-1">スワイプする</p>
                <p className="text-[12px] text-gray-400 leading-relaxed">
                  右でLIKE、左でパス、上にフリックで即応募。通勤中の3駅分でも結構進む。
                </p>
              </div>
            </li>
            <li className="flex gap-5">
              <div className="shrink-0 w-10 h-10 rounded-full border-2 border-violet-400 flex items-center justify-center text-violet-300 text-sm font-black">
                3
              </div>
              <div className="pt-1.5">
                <p className="font-bold text-[15px] mb-1">マッチしたら、メッセージ</p>
                <p className="text-[12px] text-gray-400 leading-relaxed">
                  お互いLIKEでマッチ成立。チャットで、雑談から面接日程まで。
                  通知はLINEにも届くから、見逃さない。
                </p>
              </div>
            </li>
            <li className="flex gap-5">
              <div className="shrink-0 w-10 h-10 rounded-full border-2 border-pink-400 flex items-center justify-center text-pink-300 text-sm font-black relative">
                4
                <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white text-[8px] font-black tracking-wider">
                  NEW
                </span>
              </div>
              <div className="pt-1.5">
                <p className="font-bold text-[15px] mb-1">ビデオ面接 + AI 振り返り</p>
                <p className="text-[12px] text-gray-400 leading-relaxed">
                  チャットからそのまま面接予約。アプリ内でビデオ通話して、
                  終了後に AI が振り返りレポートを作成。&quot;次に活かせる&quot;フィードバック付き。
                </p>
              </div>
            </li>
          </ol>

          <Link
            href="/swipe"
            className="mt-8 block text-center py-3.5 bg-white text-gray-900 font-black text-sm rounded-2xl active:scale-[0.98] transition"
          >
            試しにスワイプしてみる
          </Link>
        </div>
      </section>

      {/* ── Voices: magazine-style, asymmetric ── */}
      <section className="px-6 py-10 md:py-14 max-w-lg md:max-w-5xl lg:max-w-6xl mx-auto">
        <p className="text-[11px] md:text-xs text-gray-400 mb-1">使ってくれた人たち</p>
        <h2 className="text-[22px] md:text-[40px] lg:text-[48px] font-black text-gray-900 mb-6 md:mb-10">
          実際、どうだったか。
        </h2>

        <div className="md:grid md:grid-cols-3 md:gap-6">
          {/* Voice 1 — left aligned, with quote mark */}
          <div className="mb-8 md:mb-0 md:bg-white md:border md:border-gray-100 md:rounded-3xl md:p-6">
            <p className="text-4xl text-gray-300 font-serif leading-none mb-2">&ldquo;</p>
            <p className="text-[15px] md:text-[15px] text-gray-800 leading-[1.8] font-medium">
              月曜の授業サボって電車でスワイプしてたら、渋谷のカフェに受かってた。
              今はラテアート練習中です。店長、怒ってないといいな。
            </p>
            <p className="text-[11px] text-gray-500 mt-4">
              — さくらさん・大学3年（文学部）・埼玉
            </p>
          </div>

          <div className="h-px bg-gray-200 my-6 md:hidden" />

          {/* Voice 2 — indented right on mobile, card on desktop */}
          <div className="mb-8 md:mb-0 pl-6 md:pl-0 border-l-2 md:border-l-0 border-violet-300 md:bg-white md:border md:border-gray-100 md:rounded-3xl md:p-6 md:relative md:top-6">
            <p className="text-4xl text-gray-300 font-serif leading-none mb-2 hidden md:block">&ldquo;</p>
            <p className="text-[15px] text-gray-800 leading-[1.8] font-medium">
              転職サイト5つ登録して疲れた勢いでDLした。結果的にここ経由で決まった。
              写真が多いから「ここで働く自分」が想像できるのが大きい。
            </p>
            <p className="text-[11px] text-gray-500 mt-4">
              — けんたろうさん・28歳・前職Webデザイナー
            </p>
          </div>

          <div className="h-px bg-gray-200 my-6 md:hidden" />

          {/* Voice 3 */}
          <div className="md:bg-white md:border md:border-gray-100 md:rounded-3xl md:p-6">
            <p className="text-4xl text-gray-300 font-serif leading-none mb-2">&ldquo;</p>
            <p className="text-[15px] text-gray-800 leading-[1.8] font-medium">
              子育て中でもスキマ時間にサクサク見られる。週2OKの事務が見つかって、
              半年ぶりに自分の時間ができた気がする。
            </p>
            <p className="text-[11px] text-gray-500 mt-4">
              — ゆいさん・32歳・2児の母・千葉
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ-ish small text section ── */}
      <section className="px-6 py-8 md:py-14 max-w-lg md:max-w-5xl lg:max-w-6xl mx-auto bg-white border-y border-gray-900/5">
        <p className="text-[11px] md:text-xs text-gray-400 mb-4 md:mb-6">よく聞かれること</p>
        <dl className="space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-8 text-[13px] md:text-sm">
          <div>
            <dt className="font-bold text-gray-900 mb-1">Q. 本当に無料ですか？</dt>
            <dd className="text-gray-600 leading-relaxed">
              A. はい。求職者側は完全無料です。課金ポイントもありません。
            </dd>
          </div>
          <div>
            <dt className="font-bold text-gray-900 mb-1">Q. スワイプって軽く見られません？</dt>
            <dd className="text-gray-600 leading-relaxed">
              A. 企業側もちゃんと審査して掲載してます。&quot;軽く始められる&quot;だけで、中身は真剣です。
            </dd>
          </div>
          <div>
            <dt className="font-bold text-gray-900 mb-1">Q. 学生でも使えますか？</dt>
            <dd className="text-gray-600 leading-relaxed">
              A. むしろ学生ユーザーが半分以上。バイトから新卒まで。
            </dd>
          </div>
        </dl>
      </section>

      {/* ── NEW: For Business banner — visually distinct, can't be missed ── */}
      <BusinessBanner />

      {/* ── Final CTA: quiet, not shouty ── */}
      <section className="px-6 py-12 md:py-20 max-w-lg md:max-w-3xl lg:max-w-4xl mx-auto text-center">
        <p className="text-[11px] md:text-xs text-gray-400 mb-3">よかったら、はじめてみてください。</p>
        <h2 className="text-[22px] md:text-[44px] lg:text-[52px] font-black text-gray-900 leading-tight mb-6 md:mb-8">
          気になる企業に、<br />
          <span className="underline decoration-yellow-300 decoration-4 md:decoration-[6px] underline-offset-2">
            スワイプ しよう
          </span>
          。
        </h2>
        <Link
          href="/swipe"
          className="inline-block px-10 md:px-14 py-4 md:py-5 bg-gray-900 text-white font-black text-sm md:text-base rounded-full active:scale-[0.97] hover:scale-[1.02] transition"
        >
          スワイプをはじめる
        </Link>
        <p className="text-[10px] md:text-xs text-gray-400 mt-4">
          登録2分 ／ 履歴書不要 ／ いつでも退会OK
        </p>

        <div className="mt-10 flex flex-col items-center gap-2 text-[10px] text-gray-400">
          <Logo size={36} radius={10} className="opacity-90" />
          <p className="font-black tracking-[0.25em] bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent text-[11px]">
            SWIPLY
          </p>
          <p>
            Made with coffee in Tokyo.
            <br />© {new Date().getFullYear()} SWIPLY
          </p>
        </div>
      </section>

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

// ─── Sub-sections ─────────────────────────────────────────────────────

/**
 * Walks through SWIPLY's four core features end-to-end. Designed to
 * answer "what can this app actually do?" without reading the FAQ.
 *
 * Layout:
 *   - mobile: vertical stack of cards
 *   - desktop: 4-up grid, with feature 03 (video interview) accented as
 *     "NEW" so the marquee feature is impossible to miss.
 */
function FeatureShowcase() {
  return (
    <section className="px-4 md:px-8 pt-12 pb-4 max-w-lg md:max-w-6xl mx-auto w-full">
      <div className="mb-7 md:mb-10">
        <p className="text-[10px] tracking-[0.3em] text-violet-500 font-black mb-2">
          WHAT&apos;S INSIDE
        </p>
        <h2 className="text-[22px] md:text-[36px] lg:text-[42px] font-black text-gray-900 leading-tight">
          スワイプから、面接の<br className="md:hidden" />振り返りまで。
        </h2>
        <p className="mt-3 text-[12px] md:text-sm text-gray-500 max-w-md md:max-w-xl leading-relaxed">
          求人を探すだけのアプリじゃない。マッチ後のメッセージ、ビデオ面接、AI 振り返りまで、
          就職活動のひと通りをアプリ１つで。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <FeatureCard
          step="01"
          title="スワイプで求人選び"
          body="写真とキャッチで直感判断。右でLIKE、左でパス、上で即応募。通勤の3駅分でちゃんと進む。"
          accent="violet"
          icon={
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3zm-7 9a7 7 0 0014 0h-2a5 5 0 01-10 0H5zm6 9.93V19h2v1.93A8 8 0 0019.93 13H22a10 10 0 01-9 9.93V20.93z" />
            </svg>
          }
          href="/swipe"
          cta="スワイプを試す →"
        />
        <FeatureCard
          step="02"
          title="マッチでメッセージ開始"
          body="お互いLIKEでマッチ成立 → トーク開始。日程調整も雑談も、温度感そのままで。"
          accent="fuchsia"
          icon={
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2zM7 9h10v2H7zm6 5H7v-2h6z" />
            </svg>
          }
          href="/messages"
          cta="メッセージを見る →"
        />
        <FeatureCard
          step="03"
          title="ビデオ面接 + AI 振り返り"
          body="トーク画面から面接予約 → アプリ内ビデオ通話。終了後 AI が振り返りレポートを作成。"
          accent="pink"
          badge="NEW"
          icon={
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z" />
            </svg>
          }
          href="/messages"
          cta="使ってみる →"
        />
        <FeatureCard
          step="04"
          title="LINE で通知"
          body="マッチ成立、メッセージ、面接リマインドまで LINE のトークに自動配信。アプリを開いてなくても気づける。"
          accent="emerald"
          icon={
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 5.94 2 10.78c0 3.13 2.04 5.88 5.13 7.42-.21.78-.77 2.85-.88 3.29-.14.55.2.54.42.39.17-.11 2.71-1.84 3.81-2.59.5.07 1 .11 1.52.11 5.52 0 10-3.94 10-8.78S17.52 2 12 2z" />
            </svg>
          }
          href="/profile"
          cta="連携する →"
        />
      </div>
    </section>
  );
}

interface FeatureCardProps {
  step: string;
  title: string;
  body: string;
  accent: "violet" | "fuchsia" | "pink" | "emerald";
  icon: React.ReactNode;
  href: string;
  cta: string;
  badge?: string;
}

function FeatureCard({
  step,
  title,
  body,
  accent,
  icon,
  href,
  cta,
  badge,
}: FeatureCardProps) {
  const accentClasses = {
    violet: {
      bg: "bg-violet-50",
      text: "text-violet-700",
      icon: "from-violet-500 to-fuchsia-500",
      border: "hover:border-violet-200",
    },
    fuchsia: {
      bg: "bg-fuchsia-50",
      text: "text-fuchsia-700",
      icon: "from-fuchsia-500 to-pink-500",
      border: "hover:border-fuchsia-200",
    },
    pink: {
      bg: "bg-pink-50",
      text: "text-pink-700",
      icon: "from-pink-500 to-rose-500",
      border: "hover:border-pink-200",
    },
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      icon: "from-emerald-500 to-teal-500",
      border: "hover:border-emerald-200",
    },
  }[accent];

  return (
    <Link
      href={href}
      className={`group relative bg-white rounded-3xl border border-gray-100 ${accentClasses.border} p-5 md:p-6 flex flex-col transition-all hover:shadow-lg hover:shadow-gray-200/40 active:scale-[0.99]`}
    >
      {badge && (
        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white text-[9px] font-black tracking-[0.2em]">
          {badge}
        </span>
      )}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${accentClasses.icon} text-white flex items-center justify-center shadow-sm`}
        >
          {icon}
        </div>
        <span className={`text-[10px] tracking-[0.25em] font-black ${accentClasses.text} tabular-nums`}>
          STEP {step}
        </span>
      </div>
      <h3 className="text-[15px] md:text-[16px] font-extrabold text-gray-900 leading-snug mb-1.5">
        {title}
      </h3>
      <p className="text-[12px] md:text-[13px] text-gray-600 leading-relaxed flex-1">{body}</p>
      <span
        className={`inline-flex items-center gap-1 mt-4 text-[11px] font-bold ${accentClasses.text} group-hover:gap-2 transition-all`}
      >
        {cta}
      </span>
    </Link>
  );
}

/**
 * Big, hard-to-miss SWIPLY for Business CTA banner.
 * Lives between the FAQ and the final CTA so candidates scrolling to
 * the bottom can't help but notice it. Visually distinct from every
 * other section (dark gradient + cyan accents) so it reads as a
 * different audience without any extra heading.
 */
function BusinessBanner() {
  return (
    <section className="px-4 md:px-6 py-10 md:py-14 max-w-lg md:max-w-6xl mx-auto">
      <div className="relative overflow-hidden rounded-3xl md:rounded-[2rem] bg-gradient-to-br from-gray-950 via-violet-950 to-gray-950 text-white px-6 md:px-12 py-10 md:py-14 shadow-2xl shadow-violet-900/20">
        {/* Decorative gradient orbs */}
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-72 h-72 rounded-full bg-fuchsia-500/20 blur-3xl pointer-events-none" />

        <div className="relative md:flex md:items-center md:gap-10">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-400/15 border border-cyan-300/30 text-cyan-200 text-[10px] font-black tracking-[0.2em] mb-4">
              FOR BUSINESS
            </div>
            <h2 className="text-[24px] md:text-[40px] lg:text-[48px] font-black leading-[1.15] mb-4">
              採用担当者の方へ。<br />
              <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">
                動画とスワイプで、
              </span>
              <br />
              採用を変える。
            </h2>
            <p className="text-white/70 text-[13px] md:text-[15px] leading-relaxed mb-6 md:mb-7 max-w-xl">
              履歴書では伝わらない雰囲気を、動画で。会いたい人だけと会う、効率的なマッチング。
              ビデオ面接 + AI 振り返りまで、採用フロー丸ごとアプリで完結。
            </p>

            {/* Value props — terse, scannable */}
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-7">
              <BizValueProp
                title="動画で求人を伝える"
                body="写真+30秒動画でスクロール率が桁違い。"
              />
              <BizValueProp
                title="マッチ精度の高い候補"
                body="LIKE×LIKEの両思いだけが面談に進む。"
              />
              <BizValueProp
                title="面接まで丸ごとアプリ"
                body="ビデオ面接 + AI 振り返りで工数削減。"
              />
            </ul>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/business"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-gray-900 font-black text-sm md:text-base rounded-2xl shadow-xl shadow-black/40 hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                <span>SWIPLY for Business を見る</span>
                <span>→</span>
              </Link>
              <Link
                href="/business#contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/5 backdrop-blur-md border border-white/20 text-white font-bold text-sm rounded-2xl hover:bg-white/10 transition"
              >
                資料請求・お問い合わせ
              </Link>
            </div>
            <p className="text-[10px] md:text-[11px] text-white/40 mt-4">
              ファウンディングメンバー募集中（最初の100社限定 / 永続20%オフ）
            </p>
          </div>

          {/* Decorative glyph on desktop */}
          <div className="hidden md:flex shrink-0 w-44 lg:w-56 aspect-square rounded-3xl bg-gradient-to-br from-violet-500/30 via-fuchsia-500/20 to-cyan-400/30 items-center justify-center border border-white/10">
            <div className="text-7xl lg:text-8xl">📹</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BizValueProp({ title, body }: { title: string; body: string }) {
  return (
    <li className="border-l-2 border-cyan-400/50 pl-3">
      <p className="text-[12px] md:text-[13px] font-extrabold text-white mb-0.5">{title}</p>
      <p className="text-[10px] md:text-[11px] text-white/60 leading-relaxed">{body}</p>
    </li>
  );
}

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
