/**
 * Demo candidate profiles used by the AI scout feature on
 * /admin/scout/. In production these would come from
 * Firestore (`users/{uid}` documents).
 *
 * Kept intentionally lightweight — only the fields the scout-generation
 * prompt cares about (selfIntro, skills, hobbies, experience).
 */

export interface CandidateProfile {
  id: string;
  name: string;
  age: string;
  location: string;
  photo: string;
  selfIntro: string;
  skills: string[];
  hobbies: string[];
  experience: string;
  education?: string;
  /** Coarse desired job type — drives recommended-job hint in the UI. */
  desiredJobType: "baito" | "career" | "gig" | "both";
  /** Free-form interest tags. */
  interests: string[];
}

export const candidates: CandidateProfile[] = [
  {
    id: "cand-1",
    name: "山田 さくら",
    age: "21",
    location: "埼玉県川口市",
    photo:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=70",
    selfIntro:
      "大学では文学を専攻しつつ、Reactで個人ブログを運営してます。コーヒーが好きで、スターバックスで2年バリスタやってました。",
    skills: ["接客", "React", "TypeScript", "ライティング"],
    hobbies: ["読書", "コーヒー", "カフェ巡り"],
    experience: "スターバックス バリスタ 2年（時給リーダー経験あり）",
    education: "都内私立大学 文学部 3年",
    desiredJobType: "baito",
    interests: ["カフェ", "ライティング", "教育"],
  },
  {
    id: "cand-2",
    name: "佐藤 健太郎",
    age: "28",
    location: "東京都渋谷区",
    photo:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=70",
    selfIntro:
      "Webデザイナーから始めて、いまはフロントエンドエンジニア5年目。Figma/React/Next.jsが得意。チームのドキュメント文化を作るのが好きです。",
    skills: ["Figma", "React", "Next.js", "TypeScript", "Storybook"],
    hobbies: ["ボードゲーム", "サウナ", "映画"],
    experience: "ECサイトリニューアルでチームリーダー、Lighthouse 40%改善実績",
    education: "国立大学 情報科学部 卒",
    desiredJobType: "career",
    interests: ["UX", "デザインシステム", "リードエンジニア"],
  },
  {
    id: "cand-3",
    name: "鈴木 ゆい",
    age: "32",
    location: "千葉県柏市",
    photo:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=70",
    selfIntro:
      "2人の子育て中。前職は出版社で営業事務6年。週2〜3でリモートワーク希望。エクセルでの集計・社内調整が得意です。",
    skills: ["Excel", "Word", "営業事務", "電話応対", "顧客管理"],
    hobbies: ["パン作り", "家庭菜園"],
    experience: "出版社 営業事務 6年",
    education: "短大卒",
    desiredJobType: "baito",
    interests: ["在宅ワーク", "事務", "ライターアシスタント"],
  },
  {
    id: "cand-4",
    name: "中村 蓮",
    age: "23",
    location: "東京都板橋区",
    photo:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=70",
    selfIntro:
      "新卒でSIerに入ったけど、プロダクト開発に近い場所で働きたくて転職活動中。Pythonでデータ分析、AWS運用経験あり。",
    skills: ["Python", "SQL", "AWS", "Linux", "データ分析"],
    hobbies: ["ロードバイク", "登山", "サウナ"],
    experience: "SIer 1.5年（業務システム開発・運用）",
    education: "私立大学 理工学部 情報工学科 卒",
    desiredJobType: "career",
    interests: ["スタートアップ", "プロダクト開発", "DevOps"],
  },
  {
    id: "cand-5",
    name: "田中 美咲",
    age: "26",
    location: "東京都世田谷区",
    photo:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=70",
    selfIntro:
      "美容部員→ECマーケへの転身組。InstagramとTikTokのアカウント運用、月間1.5M imp実績あり。撮影・編集まで巻き取れます。",
    skills: ["SNS運用", "動画編集", "Instagram", "TikTok", "Adobe Premiere"],
    hobbies: ["コスメ研究", "旅行", "韓国ドラマ"],
    experience: "化粧品メーカー 美容部員 4年 → 自社ECマーケ 1年",
    education: "美容専門学校 卒",
    desiredJobType: "career",
    interests: ["SNSマーケティング", "動画", "美容"],
  },
  {
    id: "cand-6",
    name: "渡辺 翔太",
    age: "19",
    location: "神奈川県横浜市",
    photo:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&q=70",
    selfIntro:
      "工学部1年生。プログラミングと自転車が好き。スキマ時間でガッと稼ぎたいので単発・短期希望。",
    skills: ["Python", "学園祭運営", "重い物運び"],
    hobbies: ["自転車", "プログラミング", "ゲーム"],
    experience: "学園祭実行委員 / イベント設営アルバイト",
    desiredJobType: "gig",
    interests: ["イベント設営", "倉庫", "配送"],
  },
];
