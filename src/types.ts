export type SubjectType = 'geometry' | 'algebra' | 'combinatorics' | 'number_theory';

export interface SubjectInfo {
  id: SubjectType;
  name: string; // 기하, 대수, 조합, 정수
  color: string; // Tailwind color class
  teacher: string; // 담당 선생님 성함
}

export type DayType = '화요일' | '목요일' | '일요일';

export interface Period {
  period: number;
  subjectId: SubjectType | 'wt';
  subjectName: string;
}

export interface DaySchedule {
  day: DayType;
  periods: Period[];
}

export interface ProblemItem {
  id: string;
  label: string; // e.g., "유제 16", "17", "연습 14"
  isCompleted: boolean;
}

export interface AssignmentSection {
  id: string;
  title: string; // e.g., "예습: 유제 16-19"
  rawText: string;
  problems: ProblemItem[];
}

export interface SubjectState {
  subjectId: SubjectType;
  previews: AssignmentSection[];
  reviews: AssignmentSection[];
  wtScopes: AssignmentSection[];
  notes: string;
}

export interface AppState {
  subjects: Record<SubjectType, SubjectState>;
  rawPasteText: string;
  lastParsedDate: string | null;
}

export const SUBJECTS_CONFIG: Record<SubjectType, SubjectInfo> = {
  geometry: { id: 'geometry', name: '기하', color: 'blue', teacher: '김동범쌤' },
  algebra: { id: 'algebra', name: '대수', color: 'emerald', teacher: '김주미쌤' },
  number_theory: { id: 'number_theory', name: '정수', color: 'purple', teacher: '이상혁쌤' },
  combinatorics: { id: 'combinatorics', name: '조합', color: 'orange', teacher: '하혜안쌤' },
};

export const WEEKLY_SCHEDULE: DaySchedule[] = [
  {
    day: '화요일',
    periods: [
      { period: 1, subjectId: 'combinatorics', subjectName: '조합' },
      { period: 2, subjectId: 'geometry', subjectName: '기하' },
      { period: 3, subjectId: 'number_theory', subjectName: '정수' },
    ],
  },
  {
    day: '목요일',
    periods: [
      { period: 1, subjectId: 'combinatorics', subjectName: '조합' },
      { period: 2, subjectId: 'algebra', subjectName: '대수' },
      { period: 3, subjectId: 'number_theory', subjectName: '정수' },
    ],
  },
  {
    day: '일요일',
    periods: [
      { period: 1, subjectId: 'geometry', subjectName: '기하' },
      { period: 2, subjectId: 'wt', subjectName: 'WT (복습테스트)' },
      { period: 3, subjectId: 'algebra', subjectName: '대수' },
    ],
  },
];
