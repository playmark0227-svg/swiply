"use client";

import Image from "next/image";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

const stats = [
  { value: "12,400+", label: "掲載求人数" },
  { value: "98,000+", label: "登録ユーザー数" },
  { value: "87%", label: "マッチング満足度" },
  { value: "3.2万", label: "成立マッチング数" },
];

const reasons = [
  {
    emoji: "👆",
    title: "直感で選べる",
    body: "気になる求人はスワイプ右、合わないと思ったら左。履歴書を書く前に、まず感覚を大事に。",
  },
  {
    emoji: "⚡",
    title: "最短3秒で応募完了",
    body: "プロフィールを一度登録するだけ。あとはスワイプするだけで企業にアピールできます。",
  },
  {
    emoji: "🎯",
    title: "AIがあなたに合う求人を厳選",
    body: "スワイプの履歴からあなたの好みを学習。見るたびに精度が上がる、パーソナルな求人フィードを提供。",
  },
];

const steps = [
  { num: "01", title: "プロフィール登録", body: "写真・自己紹介・希望条件を入力するだけ。3分で完了。" },
  { num: "02", title: "求人をスワイプ", body: "右スワイプでLIKE、左でスキップ。直感的に求人を探せます。" },
  { num: "03", title: "企業とマッチング", body: "企業側もあなたをLIKEしたら成立！チャットで話を進めましょう。" },
];

const voices = [
  {
    name: "田中 さくら",
    age: "大学3年生",
    body: "就活サイトって難しそうで敬遠してたけど、SWIPLYはアプリみたいで使いやすい。気づいたら内定もらえてた！",
    tag: "正社員 内定",
  },
  {
    name: "鈴木 けんた",
    age: "フリーター 23歳",
    body: "スワイプしてたら自分が本当に行きたい職場のイメージがわかってきた。今は週4で働いてます。",
    tag: "アルバイト 採用",
  },
  {
    name: "山田 ゆい",
    age: "転職活動中 28歳",
    body: "他のサイトより求人の写真が多くてリアルなイメージが持てる。通勤中にサクッとチェックできるのも◎",
    tag: "正社員 転職",
  },
];

export default function Home() {
  return (
    <div className="min-h-dvh bg-white pb-20">
      {/* ── Hero ── */}
      <section>
        {/* Photo — faces visible, no text overlap */}
        <div className="relative w-full" style={{ height: "340px" }}>
          <Image
            src="/cover.png"
            alt="様々な職種で働く人たち"
            fill
            priority
            className="object-cover"
            style={{ objectPosition: "center 15%" }}
          />
          {/* subtle bottom fade into the text section */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-violet-700 to-transparent" />
          {/* Logo */}
          <div className="absolute top-5 left-5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white text-sm font-black">S</span>
            </div>
            <span className="text-white text-base font-black tracking-widest drop-shadow">SWIPLY</span>
          </div>
        </div>

        {/* Text + CTA — separate from photo, no face overlap */}
        <div className="bg-gradient-to-b from-violet-700 to-fuchsia-600 px-6 pt-5 pb-8 text-white">
          <p className="text-white/70 text-[10px] font-bold tracking-widest uppercase mb-2">
            Japan&apos;s #1 Swipe Job Platform
          </p>
          <h1 className="text-[26px] font-black leading-tight mb-2">
            求人を<span className="text-yellow-300">&quot;探す&quot;</span>から<br />
            <span className="text-yellow-300">&quot;出会う&quot;</span>へ。
          </h1>
          <p className="text-white/80 text-xs leading-relaxed mb-6">
            スワイプするだけで、あなたにぴったりの仕事が見つかる。<br />
            履歴書不要・最短当日応募。
          </p>
          <div className="flex gap-3">
            <Link
              href="/baito"
              className="flex-1 py-3.5 bg-white text-violet-700 text-center font-black rounded-2xl text-sm shadow-xl shadow-black/20 active:scale-[0.97] transition-transform"
            >
              アルバイト
            </Link>
            <Link
              href="/career"
              className="flex-1 py-3.5 bg-white/20 border border-white/30 text-white text-center font-bold rounded-2xl text-sm active:scale-[0.97] transition-transform"
            >
              正社員
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="px-5 py-8 max-w-lg mx-auto">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-violet-600 mb-0.5">{s.value}</p>
              <p className="text-[11px] text-gray-500 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Story ── */}
      <section className="px-5 py-6 max-w-lg mx-auto">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white">
          <p className="text-[10px] font-bold tracking-widest text-violet-400 uppercase mb-3">Our Story</p>
          <h2 className="text-xl font-black leading-snug mb-4">
            「いい求人があっても、<br />見つけるのが大変すぎる」
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            従来の求人サイトは情報が多すぎて、どれを選べばいいかわからない。
            長い文章を読んで、比較して、応募して…そのプロセスに疲れていませんか？
          </p>
          <div className="my-4 border-t border-white/10" />
          <p className="text-gray-300 text-sm leading-relaxed">
            SWIPLYは「好き・嫌い」の直感を大切にしました。
            写真とキャッチコピーで求人を表現し、スワイプで気持ちを伝える。
            まるでアプリを使う感覚で、就活・転職・アルバイト探しができます。
          </p>
        </div>
      </section>

      {/* ── Why Swipe ── */}
      <section className="px-5 py-6 max-w-lg mx-auto">
        <p className="text-[10px] font-bold tracking-widest text-violet-500 uppercase mb-1">Why Swipe?</p>
        <h2 className="text-xl font-black text-gray-900 mb-5">なぜスワイプ式なのか</h2>
        <div className="space-y-3">
          {reasons.map((r) => (
            <div key={r.title} className="flex gap-4 bg-gray-50 border border-gray-100 rounded-2xl p-4">
              <span className="text-2xl mt-0.5 shrink-0">{r.emoji}</span>
              <div>
                <p className="text-sm font-bold text-gray-900 mb-1">{r.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{r.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-5 py-6 max-w-lg mx-auto">
        <p className="text-[10px] font-bold tracking-widest text-violet-500 uppercase mb-1">How it works</p>
        <h2 className="text-xl font-black text-gray-900 mb-5">使い方はかんたん3ステップ</h2>
        <div className="space-y-3">
          {steps.map((s, i) => (
            <div key={s.num} className="flex gap-4 items-start">
              {/* connector */}
              <div className="flex flex-col items-center shrink-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-black">
                  {s.num}
                </div>
                {i < steps.length - 1 && (
                  <div className="w-0.5 h-6 bg-gradient-to-b from-violet-200 to-transparent mt-1" />
                )}
              </div>
              <div className="pt-1.5">
                <p className="text-sm font-bold text-gray-900 mb-0.5">{s.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Voices ── */}
      <section className="px-5 py-6 max-w-lg mx-auto">
        <p className="text-[10px] font-bold tracking-widest text-violet-500 uppercase mb-1">Voices</p>
        <h2 className="text-xl font-black text-gray-900 mb-5">使ってみた声</h2>
        <div className="space-y-3">
          {voices.map((v) => (
            <div key={v.name} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-200 to-fuchsia-200 flex items-center justify-center text-violet-700 font-black text-sm">
                  {v.name[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{v.name}</p>
                  <p className="text-[10px] text-gray-400">{v.age}</p>
                </div>
                <span className="ml-auto text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                  {v.tag}
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-5 py-8 max-w-lg mx-auto">
        <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-3xl p-6 text-center text-white">
          <p className="text-xs font-semibold text-white/70 mb-2">さあ、はじめよう</p>
          <h2 className="text-xl font-black mb-1">あなたの理想の仕事、<br />スワイプして見つけよう。</h2>
          <p className="text-white/70 text-xs mb-6">無料・登録2分・履歴書不要</p>
          <div className="flex gap-3">
            <Link href="/baito" className="flex-1 py-3.5 bg-white text-violet-600 font-black text-sm rounded-2xl active:scale-95 transition-transform">
              バイト
            </Link>
            <Link href="/career" className="flex-1 py-3.5 bg-white/20 border border-white/30 text-white font-black text-sm rounded-2xl active:scale-95 transition-transform">
              正社員
            </Link>
          </div>
        </div>
      </section>

      <BottomNav />
    </div>
  );
}
