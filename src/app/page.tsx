"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import JobListCard from "@/components/JobListCard";
import Logo from "@/components/Logo";
import OnboardingModal from "@/components/OnboardingModal";
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
      <section className="relative overflow-hidden min-h-[540px] md:min-h-[640px] lg:min-h-[720px]">
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

        <div className="absolute top-6 right-5 md:top-8 md:right-8">
          <span className="text-[10px] md:text-xs text-white/60 font-medium tracking-wider">est. 2024 — Tokyo</span>
        </div>

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
              <Link
                href="/business"
                className="inline-flex items-center gap-1.5 mt-4 md:mt-6 text-[10px] md:text-[11px] text-white/40 hover:text-white/80 transition"
              >
                <span>採用ご担当の方はこちら</span>
                <span className="text-cyan-300">SWIPLY for Business →</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick stats strip ── */}
      <section className="relative border-y border-gray-900/10 bg-white">
        <div className="absolute top-2 right-3 md:top-3 md:right-5 flex items-center gap-1 opacity-70">
          <Logo size={14} radius={4} />
          <span className="text-[8px] md:text-[9px] font-black tracking-[0.2em] text-gray-400">
            SWIPLY
          </span>
        </div>
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

      {/* ── Dark product photo section ── */}
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
                <p className="font-bold text-[15px] mb-1">話してみる</p>
                <p className="text-[12px] text-gray-400 leading-relaxed">
                  お互いLIKEでマッチ成立。メッセージから、面接でも、雑談でも、好きな温度で。
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
