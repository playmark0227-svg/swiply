/**
 * Demo data for the company dashboard.
 *
 * Simulates the logged-in company's perspective — their own job postings,
 * applicants who swiped right, messages, and analytics. Everything is
 * deterministic so the demo feels realistic without a backend.
 *
 * In production, this would be replaced by Firestore queries scoped to
 * the authenticated company's UID.
 */

export const DEMO_COMPANY = {
  id: "company-bloom",
  name: "Hair Salon BLOOM",
  logo: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&h=200&fit=crop",
  plan: "FOUNDING" as const,
  industry: "美容室",
  verified: true,
  joinedAt: "2026-03-15T00:00:00Z",
};

// ─── Company's own job postings ─────────────────────────────────────

export interface CompanyJob {
  id: string;
  title: string;
  type: "baito" | "career" | "gig";
  salary: string;
  location: string;
  status: "active" | "paused" | "draft" | "expired";
  postedAt: string;
  views: number;
  likes: number;
  matches: number;
  applications: number;
  image: string;
}

const ISO = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

export function getCompanyJobs(): CompanyJob[] {
  return [
    {
      id: "cj-1",
      title: "美容師 / スタイリスト",
      type: "career",
      salary: "月給 28万〜40万円",
      location: "東京都渋谷区",
      status: "active",
      postedAt: ISO(14),
      views: 1243,
      likes: 87,
      matches: 23,
      applications: 12,
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=800&fit=crop",
    },
    {
      id: "cj-2",
      title: "アシスタント",
      type: "career",
      salary: "月給 22万〜26万円",
      location: "東京都渋谷区",
      status: "active",
      postedAt: ISO(7),
      views: 856,
      likes: 54,
      matches: 15,
      applications: 8,
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=800&fit=crop",
    },
    {
      id: "cj-3",
      title: "レセプション / 受付",
      type: "baito",
      salary: "時給 1,300円",
      location: "東京都渋谷区",
      status: "active",
      postedAt: ISO(3),
      views: 432,
      likes: 31,
      matches: 9,
      applications: 5,
      image: "https://images.unsplash.com/photo-1521590832167-7228fcb22ddc?w=600&h=800&fit=crop",
    },
    {
      id: "cj-4",
      title: "ネイリスト",
      type: "career",
      salary: "月給 25万〜35万円",
      location: "東京都表参道",
      status: "paused",
      postedAt: ISO(30),
      views: 2100,
      likes: 112,
      matches: 28,
      applications: 18,
      image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=800&fit=crop",
    },
    {
      id: "cj-5",
      title: "撮影アシスタント（単発）",
      type: "gig",
      salary: "日給 12,000円",
      location: "東京都渋谷区",
      status: "draft",
      postedAt: ISO(1),
      views: 0,
      likes: 0,
      matches: 0,
      applications: 0,
      image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=800&fit=crop",
    },
  ];
}

// ─── Applicants who liked / matched / applied ───────────────────────

export type ApplicantStage =
  | "liked"      // LIKE only (company hasn't acted)
  | "matched"    // Both sides liked
  | "screening"  // Company is reviewing
  | "interview"  // Interview scheduled
  | "offered"    // Offer sent
  | "hired"      // Accepted offer
  | "rejected"   // Company declined
  | "withdrawn"; // Candidate withdrew

export interface Applicant {
  id: string;
  name: string;
  age: number;
  photo: string;
  jobId: string;
  jobTitle: string;
  stage: ApplicantStage;
  appliedAt: string;
  experience: string;
  skills: string[];
  selfIntro: string;
  matchRate: number; // 0-100 AI match score
  noShowCount: number;
  lastMessageAt?: string;
  interviewAt?: string;
}

export function getApplicants(): Applicant[] {
  return [
    {
      id: "ap-1",
      name: "田中 美咲",
      age: 24,
      photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
      jobId: "cj-1",
      jobTitle: "美容師 / スタイリスト",
      stage: "interview",
      appliedAt: ISO(5),
      experience: "美容師歴3年 / 前職: AFLOAT",
      skills: ["カット", "カラー", "パーマ", "ヘッドスパ"],
      selfIntro: "お客様一人ひとりに似合うスタイルを提案するのが好きです。カラーが特に得意で、透明感のあるハイトーンには自信があります。",
      matchRate: 92,
      noShowCount: 0,
      lastMessageAt: ISO(0.1),
      interviewAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
    },
    {
      id: "ap-2",
      name: "佐藤 健太",
      age: 22,
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      jobId: "cj-2",
      jobTitle: "アシスタント",
      stage: "matched",
      appliedAt: ISO(3),
      experience: "美容専門学校卒業 / 実務未経験",
      skills: ["シャンプー", "ブロー", "カラー塗布"],
      selfIntro: "美容専門学校を卒業したばかりです。早く一人前のスタイリストになりたいと思っています。",
      matchRate: 78,
      noShowCount: 0,
      lastMessageAt: ISO(1),
    },
    {
      id: "ap-3",
      name: "鈴木 あや",
      age: 28,
      photo: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop",
      jobId: "cj-1",
      jobTitle: "美容師 / スタイリスト",
      stage: "screening",
      appliedAt: ISO(2),
      experience: "美容師歴6年 / 前職: LIPPS",
      skills: ["カット", "カラー", "縮毛矯正", "エクステ"],
      selfIntro: "メンズカットが得意ですが、最近はレディースのデザインカラーにも力を入れています。",
      matchRate: 88,
      noShowCount: 0,
    },
    {
      id: "ap-4",
      name: "高橋 結衣",
      age: 20,
      photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop",
      jobId: "cj-3",
      jobTitle: "レセプション / 受付",
      stage: "offered",
      appliedAt: ISO(8),
      experience: "接客バイト2年 / カフェ店員",
      skills: ["接客", "レジ", "電話対応", "Excel"],
      selfIntro: "カフェでの接客経験を活かして、お客様に気持ちよく過ごしてもらえる受付を目指したいです。",
      matchRate: 85,
      noShowCount: 0,
      lastMessageAt: ISO(0.5),
    },
    {
      id: "ap-5",
      name: "山田 翔太",
      age: 26,
      photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
      jobId: "cj-1",
      jobTitle: "美容師 / スタイリスト",
      stage: "liked",
      appliedAt: ISO(1),
      experience: "美容師歴4年 / 前職: OCEAN TOKYO",
      skills: ["カット", "パーマ", "メンズスタイリング"],
      selfIntro: "メンズ特化でやってきましたが、幅広いスタイルに挑戦したいと思い転職を考えています。",
      matchRate: 90,
      noShowCount: 0,
    },
    {
      id: "ap-6",
      name: "伊藤 千佳",
      age: 23,
      photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
      jobId: "cj-2",
      jobTitle: "アシスタント",
      stage: "rejected",
      appliedAt: ISO(12),
      experience: "美容学校在学中",
      skills: ["シャンプー"],
      selfIntro: "まだ学校に通っていますが、卒業後すぐに働きたいと思っています。",
      matchRate: 45,
      noShowCount: 1,
    },
    {
      id: "ap-7",
      name: "中村 大輝",
      age: 30,
      photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
      jobId: "cj-1",
      jobTitle: "美容師 / スタイリスト",
      stage: "hired",
      appliedAt: ISO(20),
      experience: "美容師歴8年 / 店長経験あり",
      skills: ["カット", "カラー", "パーマ", "マネジメント"],
      selfIntro: "前職では店長として5人のスタッフを育てました。BLOOMの理念に共感し、一緒に成長したいです。",
      matchRate: 96,
      noShowCount: 0,
      lastMessageAt: ISO(2),
    },
    {
      id: "ap-8",
      name: "渡辺 さくら",
      age: 21,
      photo: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=200&fit=crop",
      jobId: "cj-3",
      jobTitle: "レセプション / 受付",
      stage: "liked",
      appliedAt: ISO(0.5),
      experience: "大学生 / 接客バイト1年",
      skills: ["接客", "SNS運用"],
      selfIntro: "美容に興味があります。将来はサロン運営にも関わりたいです。",
      matchRate: 72,
      noShowCount: 0,
    },
  ];
}

// ─── Company messages (from the company's perspective) ───────────────

export interface CompanyThread {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantPhoto: string;
  jobTitle: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  messages: CompanyMessage[];
}

export interface CompanyMessage {
  id: string;
  sender: "company" | "applicant" | "system";
  senderName: string;
  body: string;
  sentAt: string;
}

export function getCompanyThreads(): CompanyThread[] {
  return [
    {
      id: "ct-1",
      applicantId: "ap-1",
      applicantName: "田中 美咲",
      applicantPhoto: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
      jobTitle: "美容師 / スタイリスト",
      lastMessage: "明後日の14時で大丈夫です！楽しみにしています。",
      lastMessageAt: ISO(0.1),
      unread: 1,
      messages: [
        { id: "cm-1-1", sender: "system", senderName: "SWIPLY", body: "田中 美咲 さんとマッチしました！", sentAt: ISO(5) },
        { id: "cm-1-2", sender: "company", senderName: "Hair Salon BLOOM", body: "田中さん、はじめまして！Hair Salon BLOOMの採用担当です。プロフィール拝見しました。カラーが得意とのこと、ぜひお話しさせてください！", sentAt: ISO(4.8) },
        { id: "cm-1-3", sender: "applicant", senderName: "田中 美咲", body: "はじめまして！ご連絡ありがとうございます。BLOOMさんの雰囲気がとても素敵で、ぜひお話したいです。", sentAt: ISO(4.5) },
        { id: "cm-1-4", sender: "company", senderName: "Hair Salon BLOOM", body: "ありがとうございます！ビデオ面接はいかがですか？ご都合のいい日時を教えてください。", sentAt: ISO(3) },
        { id: "cm-1-5", sender: "applicant", senderName: "田中 美咲", body: "明後日の14時で大丈夫です！楽しみにしています。", sentAt: ISO(0.1) },
      ],
    },
    {
      id: "ct-2",
      applicantId: "ap-2",
      applicantName: "佐藤 健太",
      applicantPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      jobTitle: "アシスタント",
      lastMessage: "はい、よろしくお願いします！",
      lastMessageAt: ISO(1),
      unread: 0,
      messages: [
        { id: "cm-2-1", sender: "system", senderName: "SWIPLY", body: "佐藤 健太 さんとマッチしました！", sentAt: ISO(3) },
        { id: "cm-2-2", sender: "company", senderName: "Hair Salon BLOOM", body: "佐藤さん、マッチありがとうございます！アシスタントの募集にご興味いただけたとのこと、嬉しいです。", sentAt: ISO(2.8) },
        { id: "cm-2-3", sender: "applicant", senderName: "佐藤 健太", body: "はい、よろしくお願いします！", sentAt: ISO(1) },
      ],
    },
    {
      id: "ct-3",
      applicantId: "ap-4",
      applicantName: "高橋 結衣",
      applicantPhoto: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop",
      jobTitle: "レセプション / 受付",
      lastMessage: "内定のご連絡、本当にありがとうございます！ぜひお受けしたいです。",
      lastMessageAt: ISO(0.5),
      unread: 1,
      messages: [
        { id: "cm-3-1", sender: "system", senderName: "SWIPLY", body: "高橋 結衣 さんとマッチしました！", sentAt: ISO(8) },
        { id: "cm-3-2", sender: "company", senderName: "Hair Salon BLOOM", body: "高橋さん、面接ありがとうございました。ぜひ一緒に働きたいと思い、内定をお出ししたいのですが、いかがでしょうか？", sentAt: ISO(1) },
        { id: "cm-3-3", sender: "applicant", senderName: "高橋 結衣", body: "内定のご連絡、本当にありがとうございます！ぜひお受けしたいです。", sentAt: ISO(0.5) },
      ],
    },
    {
      id: "ct-4",
      applicantId: "ap-7",
      applicantName: "中村 大輝",
      applicantPhoto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
      jobTitle: "美容師 / スタイリスト",
      lastMessage: "入社日は6月1日でお願いします。よろしくお願いします！",
      lastMessageAt: ISO(2),
      unread: 0,
      messages: [
        { id: "cm-4-1", sender: "system", senderName: "SWIPLY", body: "中村 大輝 さんとマッチしました！", sentAt: ISO(20) },
        { id: "cm-4-2", sender: "applicant", senderName: "中村 大輝", body: "入社日は6月1日でお願いします。よろしくお願いします！", sentAt: ISO(2) },
      ],
    },
  ];
}

// ─── Analytics data ─────────────────────────────────────────────────

export interface DailyStats {
  date: string;
  views: number;
  likes: number;
  matches: number;
  applications: number;
}

export function getWeeklyStats(): DailyStats[] {
  const stats: DailyStats[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
    stats.push({
      date: dateStr,
      views: 120 + Math.floor(Math.random() * 80),
      likes: 8 + Math.floor(Math.random() * 12),
      matches: 2 + Math.floor(Math.random() * 5),
      applications: 1 + Math.floor(Math.random() * 3),
    });
  }
  return stats;
}

export function getKPIs() {
  const jobs = getCompanyJobs();
  const applicants = getApplicants();
  return {
    activeJobs: jobs.filter((j) => j.status === "active").length,
    totalViews: jobs.reduce((s, j) => s + j.views, 0),
    totalLikes: jobs.reduce((s, j) => s + j.likes, 0),
    totalMatches: jobs.reduce((s, j) => s + j.matches, 0),
    totalApplications: jobs.reduce((s, j) => s + j.applications, 0),
    pendingReview: applicants.filter((a) => a.stage === "liked" || a.stage === "screening").length,
    interviewScheduled: applicants.filter((a) => a.stage === "interview").length,
    hired: applicants.filter((a) => a.stage === "hired").length,
    conversionRate: 3.2, // %
    avgResponseTime: "2.4時間",
    // Trend data (% change vs last week)
    viewsTrend: +12.5,
    likesTrend: +8.3,
    matchesTrend: +15.0,
    hiredTrend: 0,
    applicationsTrend: +5.7,
    responseTimeTrend: -18.2, // negative is improvement
  };
}

// ─── Notifications ──────────────────────────────────────────────────

export interface DashboardNotification {
  id: string;
  type: "match" | "message" | "application" | "interview" | "system";
  title: string;
  body: string;
  time: string;
  read: boolean;
  avatar?: string;
}

export function getNotifications(): DashboardNotification[] {
  return [
    {
      id: "n-1",
      type: "match",
      title: "新しいマッチ",
      body: "山田 翔太 さんが「美容師 / スタイリスト」にLIKEしました",
      time: ISO(0.1),
      read: false,
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    },
    {
      id: "n-2",
      type: "message",
      title: "新しいメッセージ",
      body: "田中 美咲 さんからメッセージが届きました",
      time: ISO(0.2),
      read: false,
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    },
    {
      id: "n-3",
      type: "interview",
      title: "面接リマインダー",
      body: "田中 美咲 さんとのビデオ面接が明後日14:00に予定されています",
      time: ISO(0.5),
      read: false,
    },
    {
      id: "n-4",
      type: "application",
      title: "新しい応募",
      body: "渡辺 さくら さんが「レセプション / 受付」に応募しました",
      time: ISO(0.8),
      read: true,
      avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop",
    },
    {
      id: "n-5",
      type: "system",
      title: "SWIPLY からのお知らせ",
      body: "求人「美容師 / スタイリスト」の閲覧数が1,000回を突破しました！",
      time: ISO(1),
      read: true,
    },
  ];
}

// ─── Activity timeline ──────────────────────────────────────────────

export interface ActivityEvent {
  id: string;
  type: "like" | "match" | "message" | "interview" | "offer" | "hire" | "view_milestone";
  description: string;
  time: string;
  applicantName?: string;
  applicantPhoto?: string;
  jobTitle?: string;
}

export function getRecentActivity(): ActivityEvent[] {
  return [
    { id: "ae-1", type: "like",     description: "山田 翔太 さんがLIKEしました",                applicantName: "山田 翔太",  applicantPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop", jobTitle: "美容師 / スタイリスト",  time: ISO(0.1) },
    { id: "ae-2", type: "message",  description: "田中 美咲 さんからメッセージ",               applicantName: "田中 美咲",  applicantPhoto: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", jobTitle: "美容師 / スタイリスト",  time: ISO(0.2) },
    { id: "ae-3", type: "offer",    description: "高橋 結衣 さんが内定を承諾",                applicantName: "高橋 結衣",  applicantPhoto: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop", jobTitle: "レセプション / 受付",    time: ISO(0.5) },
    { id: "ae-4", type: "interview", description: "田中 美咲 さんとの面接が確定",              applicantName: "田中 美咲",  applicantPhoto: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", jobTitle: "美容師 / スタイリスト",  time: ISO(1) },
    { id: "ae-5", type: "match",    description: "佐藤 健太 さんとマッチしました",             applicantName: "佐藤 健太",  applicantPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", jobTitle: "アシスタント",           time: ISO(1.5) },
    { id: "ae-6", type: "view_milestone", description: "「美容師 / スタイリスト」が1,000閲覧を達成", jobTitle: "美容師 / スタイリスト", time: ISO(2) },
    { id: "ae-7", type: "hire",     description: "中村 大輝 さんの採用が決定しました",          applicantName: "中村 大輝",  applicantPhoto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop", jobTitle: "美容師 / スタイリスト",  time: ISO(3) },
    { id: "ae-8", type: "like",     description: "渡辺 さくら さんがLIKEしました",             applicantName: "渡辺 さくら", applicantPhoto: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop", jobTitle: "レセプション / 受付",    time: ISO(4) },
  ];
}
