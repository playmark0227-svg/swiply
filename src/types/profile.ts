export interface UserProfile {
  name: string;
  age: string;
  gender: string;
  photo: string;
  selfIntro: string;
  hobbies: string[];
  skills: string[];
  location: string;
  desiredJobType: "baito" | "career" | "both";
  desiredLocations: string[];
  experience: string;
  education: string;
}

export const defaultProfile: UserProfile = {
  name: "",
  age: "",
  gender: "",
  photo: "",
  selfIntro: "",
  hobbies: [],
  skills: [],
  location: "",
  desiredJobType: "both",
  desiredLocations: [],
  experience: "",
  education: "",
};
