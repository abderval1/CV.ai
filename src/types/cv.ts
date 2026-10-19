export interface PersonalDetails {
  name: string;
  title: string;
  location: string;
  phone: string;
  email: string;
  linkedin: string;
  website?: string;
}

export interface Competency {
  id: string;
  category: string;
  description: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  period: string;
  location?: string;
  donor?: string;
  highlights: string[];
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  period: string;
  gpaOrHonors?: string;
}

export interface Reference {
  id: string;
  name: string;
  institutionAndPosition: string;
  contact: string;
}

export interface CVData {
  personalDetails: PersonalDetails;
  summary: string;
  competencies: Competency[];
  experiences: Experience[];
  educations: Education[];
  trainings: string[];
  languages: {
    language: string;
    level: string;
  }[];
  references: Reference[];
  templateStyle: 'un_classic' | 'european_modern' | 'ats_compact';
}

export interface AtsAuditResult {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  quantifiableMetricsCount: number;
  strongActionVerbs: string[];
  weakPhrasesFound: string[];
  recommendations: string[];
}

export interface CoverLetterData {
  recipientName: string;
  organizationName: string;
  jobTitle: string;
  locationDate: string;
  letterBody: string;
  keySellingPoints: string[];
}
