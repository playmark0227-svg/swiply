"use client";

import Image from "next/image";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

const BASE_PATH = process.env.NODE_ENV === "production" ? "/swiply" : "";

export default function Home() {
  return (
    <div className="min-h-dvh bg-[#fbf8f3] pb-20">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ minHeight: "540px" }}>
        <Image
          src={`${BASE_PATH}/cover.png`}
          alt="働く人たち"
          fill
          priority
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/92 via-gray-950/35 to-transparent" />

        {/* Logo top-left */}
        <div className="absolute top-5 left-5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white text-sm font-black">S</span>
          </div>
          <span className="text-white text-base font-black tracking-widest drop-shadow">SWIPLY</span>
        </div>

        {/* top-right tiny badge */}
        <div className="absolute top-6 right-5">
          <span className="text-[10px] text-white/60 font-medium">est. 2024 — Tokyo</span>
        </div>

        {/* Text content at bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-9">
          <p className="text-white/60 text-[10px] font-medium mb-3 italic">
            — a new way to find your next job.
          </p>
          <h1 className="text-[30px] font-black leading-[1.15] text-white mb-3 drop-shadow-lg">
            履歴書の前に、<br />
            <span className="relative inline-block">
              <span className="relative z-10">スワイプ</span>
              <span className="absolute inset-x-0 bottom-1 h-3 bg-yellow-300/80 -z-0"></span>
            </span>
            でいい。
          </h1>
          <p className="text-white/80 text-[13px] leading-relaxed mb-6 max-w-[22rem]">
            気になるかどうか、最初の1秒で決めていいと思う。<br />
            1万件以上の求人を、アプリみたいにめくって探せる場所。
          </p>
          <div className="flex gap-2.5">
            <Link
              href="/swipe"
              className="flex-1 py-3.5 bg-white text-gray-900 text-center font-black rounded-2xl text-sm shadow-xl shadow-black/30 active:scale-[0.97] transition-transform"
            >
              スワイプをはじめる →
            </Link>
          </div>
          <div className="flex gap-4 mt-3 text-[11px] text-white/60">
            <Link href="/baito" className="underline underline-offset-4">バイトを見る</Link>
            <Link href="/career" className="underline underline-offset-4">正社員を見る</Link>
          </div>
        </div>
      </section>

      {/* ── Quick stats strip (asymmetric) ── */}
      <section className="border-y border-gray-900/10 bg-white">
        <div className="max-w-lg mx-auto px-5 py-5 flex items-center justify-between">
          <div>
            <p className="text-[22px] font-black text-gray-900 leading-none">12,347</p>
            <p className="text-[10px] text-gray-500 mt-1">いま掲載中の求人</p>
          </div>
          <div className="h-10 w-px bg-gray-200" />
          <div>
            <p className="text-[22px] font-black text-gray-900 leading-none">98,421</p>
            <p className="text-[10px] text-gray-500 mt-1">登録者</p>
          </div>
          <div className="h-10 w-px bg-gray-200" />
          <div>
            <p className="text-[22px] font-black text-gray-900 leading-none">
              87.3<span className="text-sm">%</span>
            </p>
            <p className="text-[10px] text-gray-500 mt-1">満足度</p>
          </div>
        </div>
      </section>

      {/* ── Founder's note ── */}
      <section className="px-6 pt-10 pb-6 max-w-lg mx-auto">
        <p className="text-[11px] text-gray-400 mb-3">— はじめに、少しだけ。</p>
        <p className="text-[15px] text-gray-800 leading-[1.9] font-medium">
          正直、<span className="bg-yellow-100 px-1">就活サイトってどれも似てる</span>と思ってた。
          長いプロフィール、終わらないスクロール、「あなたへのおすすめ」と言いながら全然刺さらない求人。
        </p>
        <p className="text-[15px] text-gray-800 leading-[1.9] font-medium mt-4">
          だから作った。<br />
          写真を見て、1秒で「いいな」って思える方を選ぶ。
          それだけで仕事って見つかるんじゃないか、っていう実験。
        </p>
        <p className="text-[15px] text-gray-800 leading-[1.9] font-medium mt-4">
          使ってみて、もし合わなかったらごめんなさい。
          でも、たぶん、思ってるより気楽に探せる。
        </p>
        <div className="mt-6 flex items-center gap-3">
          <div
            className="text-xl text-gray-600"
            style={{ fontFamily: '"Caveat", "Segoe Script", cursive' }}
          >
            — SWIPLY 運営チーム
          </div>
        </div>
      </section>

      {/* ── Divider with ornament ── */}
      <div className="flex items-center gap-3 max-w-lg mx-auto px-8 py-4">
        <div className="flex-1 h-px bg-gray-300/60" />
        <span className="text-gray-400 text-xs">✦</span>
        <div className="flex-1 h-px bg-gray-300/60" />
      </div>

      {/* ── Why swipe (text-heavy, no emoji cards) ── */}
      <section className="px-6 py-8 max-w-lg mx-auto">
        <h2 className="text-[22px] font-black text-gray-900 leading-tight mb-6">
          スワイプ式の、<br />
          ちょっと真面目な話。
        </h2>

        <div className="space-y-7">
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
        <div className="max-w-lg mx-auto px-6 py-10">
          <p className="text-[10px] tracking-[0.3em] text-violet-300 font-bold mb-3">HOW IT WORKS</p>
          <h2 className="text-[22px] font-black leading-tight mb-8">
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
      <section className="px-6 py-10 max-w-lg mx-auto">
        <p className="text-[11px] text-gray-400 mb-1">使ってくれた人たち</p>
        <h2 className="text-[22px] font-black text-gray-900 mb-6">
          実際、どうだったか。
        </h2>

        {/* Voice 1 — left aligned, with quote mark */}
        <div className="mb-8">
          <p className="text-4xl text-gray-300 font-serif leading-none mb-2">&ldquo;</p>
          <p className="text-[15px] text-gray-800 leading-[1.8] font-medium">
            月曜の授業サボって電車でスワイプしてたら、渋谷のカフェに受かってた。
            今はラテアート練習中です。店長、怒ってないといいな。
          </p>
          <p className="text-[11px] text-gray-500 mt-4">
            — さくらさん・大学3年（文学部）・埼玉
          </p>
        </div>

        <div className="h-px bg-gray-200 my-6" />

        {/* Voice 2 — indented right, different rhythm */}
        <div className="mb-8 pl-6 border-l-2 border-violet-300">
          <p className="text-[15px] text-gray-800 leading-[1.8] font-medium">
            転職サイト5つ登録して疲れた勢いでDLした。結果的にここ経由で決まった。
            写真が多いから「ここで働く自分」が想像できるのが大きい。
          </p>
          <p className="text-[11px] text-gray-500 mt-4">
            — けんたろうさん・28歳・前職Webデザイナー
          </p>
        </div>

        <div className="h-px bg-gray-200 my-6" />

        {/* Voice 3 */}
        <div>
          <p className="text-4xl text-gray-300 font-serif leading-none mb-2">&ldquo;</p>
          <p className="text-[15px] text-gray-800 leading-[1.8] font-medium">
            子育て中でもスキマ時間にサクサク見られる。週2OKの事務が見つかって、
            半年ぶりに自分の時間ができた気がする。
          </p>
          <p className="text-[11px] text-gray-500 mt-4">
            — ゆいさん・32歳・2児の母・千葉
          </p>
        </div>
      </section>

      {/* ── FAQ-ish small text section ── */}
      <section className="px-6 py-8 max-w-lg mx-auto bg-white border-y border-gray-900/5">
        <p className="text-[11px] text-gray-400 mb-4">よく聞かれること</p>
        <dl className="space-y-4 text-[13px]">
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
      <section className="px-6 py-12 max-w-lg mx-auto text-center">
        <p className="text-[11px] text-gray-400 mb-3">よかったら、はじめてみてください。</p>
        <h2 className="text-[22px] font-black text-gray-900 leading-tight mb-6">
          次の仕事、<br />
          <span className="underline decoration-yellow-300 decoration-4 underline-offset-2">
            めくって決めよう
          </span>
          。
        </h2>
        <Link
          href="/swipe"
          className="inline-block px-10 py-4 bg-gray-900 text-white font-black text-sm rounded-full active:scale-[0.97] transition"
        >
          スワイプをはじめる
        </Link>
        <p className="text-[10px] text-gray-400 mt-4">
          登録2分 ／ 履歴書不要 ／ いつでも退会OK
        </p>

        <div className="mt-10 text-[10px] text-gray-400">
          Made with coffee in Tokyo.<br />
          © {new Date().getFullYear()} SWIPLY
        </div>
      </section>

      <BottomNav />
    </div>
  );
}
