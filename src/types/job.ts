export type JobType = "baito" | "career";

export interface Job {
  id: string;
  type: JobType;
  company: string;
  title: string;
  salary: string;
  location: string;
  catchphrase: string;
  image: string;
  video?: string;
  description: string;
  requirements: string[];
  benefits: string[];
  workHours: string;
  access: string;
  // カードに表示する必須条件
  tags: string[];
  // 雇用形態
  employmentType: string;
  // 年齢制限等
  ageRequirement?: string;
  // 勤務日数
  minDays: string;
  // 経験
  experience: string;
}
