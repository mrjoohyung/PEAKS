import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  Trash2, 
  Sparkles, 
  Calendar, 
  RefreshCw, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  AlertCircle,
  MessageSquare,
  ThumbsUp,
  Search,
  CheckSquare,
  Square,
  Camera,
  Upload,
  RotateCcw,
  Volume2,
  Bell,
  ExternalLink
} from 'lucide-react';
import { AppState, SubjectType, SUBJECTS_CONFIG, WEEKLY_SCHEDULE, ProblemItem, AssignmentSection } from './types';
import { INITIAL_APP_STATE, INITIAL_PASTE_TEXT } from './initialData';
import CelebrationOverlay from './components/CelebrationOverlay';

interface PraiseCharacter {
  name: string;
  emoji: string;
  color: string;
  borderColor: string;
  text: string;
  celebration: string;
}

const PRAISE_CHARACTERS: PraiseCharacter[] = [
  {
    name: "아기 토끼 레비",
    emoji: "🐰",
    color: "bg-pink-50/80 text-pink-800",
    borderColor: "border-pink-200",
    text: "총명한 귀로 픽스 학원의 기하/대수 공식을 쏙쏙 흡수했구나! 대단해! ⭐",
    celebration: "레비가 깡충깡충 뛰며 기뻐하고 있어요! 🐇💨"
  },
  {
    name: "꼬마 호랑이 범이",
    emoji: "🐯",
    color: "bg-amber-50/80 text-amber-800",
    borderColor: "border-amber-200",
    text: "어려운 KMO 기출 문제도 맹수처럼 용맹하게 물어뜯어 격파하다니! 너무 멋져! 🔥",
    celebration: "범이가 어흥~ 신나서 꼬리를 흔들고 있습니다! 🐅"
  },
  {
    name: "영재 판다 루루",
    emoji: "🐼",
    color: "bg-slate-50/80 text-slate-800",
    borderColor: "border-slate-300",
    text: "복잡한 정수론과 조합론 문제를 이렇게 정교하게 풀다니, 너는 진짜 영재야! 🎖️",
    celebration: "루루가 구르기를 하며 열광적인 덤블링 축하를 보내요! 🎋"
  },
  {
    name: "꼬마 사자 아슬란",
    emoji: "🦁",
    color: "bg-orange-50/80 text-orange-800",
    borderColor: "border-orange-200",
    text: "조합론의 어려운 케이스 분류를 실수 없이 완벽히 끝내다니! 최고존엄 사자왕 인정! 👑",
    celebration: "아슬란이 금빛 갈기를 흩날리며 우렁찬 함성을 지릅니다! 🎉"
  },
  {
    name: "학구파 올리 부엉이",
    emoji: "🦉",
    color: "bg-violet-50/80 text-violet-800",
    borderColor: "border-violet-200",
    text: "밤낮으로 깊이 사색하더니 어려운 예복습 문제를 전부 극복해냈군요! 현명해요! 🎓",
    celebration: "올리가 안경을 고쳐 쓰며 윙크와 함께 지혜의 기운을 불어넣어 줍니다! 🌠"
  },
];

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('fix_academy_planner_state') || localStorage.getItem('peaks_academy_planner_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.subjects && parsed.rawPasteText) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved state, using initial', e);
      }
    }
    return INITIAL_APP_STATE;
  });

  const [pasteText, setPasteText] = useState(state.rawPasteText);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectType>('geometry');
  const [filterType, setFilterType] = useState<'all' | 'todo' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'homework' | 'wt'>('homework');
  
  // Custom manual problem input states
  const [newProblemLabel, setNewProblemLabel] = useState('');
  const [newProblemSection, setNewProblemSection] = useState<'previews' | 'reviews' | 'wtScopes'>('previews');
  const [manualSubject, setManualSubject] = useState<SubjectType>('geometry');

  // Dynamic Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Praise character state per subject
  const [praiseIndices, setPraiseIndices] = useState<Record<SubjectType, number>>(() => {
    return {
      geometry: 0,
      algebra: 1,
      number_theory: 2,
      combinatorics: 3,
    };
  });

  const rotatePraiseCharacter = (subId: SubjectType) => {
    setPraiseIndices((prev) => {
      const nextIdx = (prev[subId] + 1) % PRAISE_CHARACTERS.length;
      return { ...prev, [subId]: nextIdx };
    });
  };

  // Celebration effect states
  const [showCelebration, setShowCelebration] = useState(false);
  const [prevCompletedSubject, setPrevCompletedSubject] = useState<Record<SubjectType, boolean>>({
    geometry: false,
    algebra: false,
    number_theory: false,
    combinatorics: false,
  });
  const celebrationIsMounted = useRef(false);

  useEffect(() => {
    if (!celebrationIsMounted.current) {
      celebrationIsMounted.current = true;
      const initialMap: Record<SubjectType, boolean> = {
        geometry: false,
        algebra: false,
        number_theory: false,
        combinatorics: false,
      };
      (Object.keys(SUBJECTS_CONFIG) as SubjectType[]).forEach((subId) => {
        const subState = state.subjects[subId];
        const allProblems = [
          ...subState.previews.flatMap(p => p.problems),
          ...subState.reviews.flatMap(r => r.problems)
        ];
        initialMap[subId] = allProblems.length > 0 && allProblems.every(p => p.isCompleted);
      });
      setPrevCompletedSubject(initialMap);
      return;
    }

    const nextCompletedMap = { ...prevCompletedSubject };
    let triggered = false;

    (Object.keys(SUBJECTS_CONFIG) as SubjectType[]).forEach((subId) => {
      const subState = state.subjects[subId];
      const allProblems = [
        ...subState.previews.flatMap(p => p.problems),
        ...subState.reviews.flatMap(r => r.problems)
      ];
      const hasProblems = allProblems.length > 0;
      const isAllDone = hasProblems && allProblems.every(p => p.isCompleted);
      
      if (isAllDone && !prevCompletedSubject[subId]) {
        triggered = true;
      }
      nextCompletedMap[subId] = isAllDone;
    });

    setPrevCompletedSubject(nextCompletedMap);

    if (triggered) {
      setShowCelebration(true);
      const timer = setTimeout(() => {
        setShowCelebration(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.subjects]);

  // Camera & Image OCR States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [uploadTab, setUploadTab] = useState<'text' | 'image' | 'camera'>('text');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Dynamic real-time clock effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('fix_academy_planner_state', JSON.stringify(state));
  }, [state]);

  // Handle camera start/stop
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setErrorMsg('카메라에 연결할 수 없습니다. 권한을 확인해주세요.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Capture image from live webcam video
  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImagePreviewUrl(dataUrl);
        stopCamera();
        setSuccessMsg('플래너 사진이 성공적으로 촬영되었습니다! 이제 아래 분석 버튼을 클릭하세요.');
      }
    }
  };

  // Handle local photo selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
        setSuccessMsg('사진 파일이 등록되었습니다. 아래 분석 버튼을 클릭해 주세요.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag & drop file handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
        setSuccessMsg('사진이 드롭되었습니다! 아래 분석 버튼을 클릭해 주세요.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Clean preview
  const handleClearImage = () => {
    setImagePreviewUrl(null);
    setSelectedFile(null);
    stopCamera();
  };

  // Handle parsing through the Gemini proxy server
  const handleParse = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await fetch('/api/parse-homework', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: uploadTab === 'text' ? pasteText : '', 
          image: uploadTab !== 'text' ? imagePreviewUrl : null 
        }),
      });

      if (!response.ok) {
        let errMsg = '분석에 실패했습니다. 사진 선명도나 서버 상태를 확인하세요.';
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const errData = await response.json();
            errMsg = errData.error || errMsg;
          } catch (e) {
            // Ignore parse error and keep default msg
          }
        } else {
          try {
            const textErr = await response.text();
            console.error('Server HTML/Text error:', textErr);
            if (textErr.includes('GEMINI_API_KEY environment variable is required')) {
              errMsg = 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다. Settings > Secrets에서 API 키를 등록해주세요.';
            } else {
              errMsg = `서버 오류가 발생했습니다. (HTTP 상태 코드: ${response.status})`;
            }
          } catch (e) {
            errMsg = `서버 응답 오류 (HTTP ${response.status})`;
          }
        }
        throw new Error(errMsg);
      }

      let parsedData;
      const responseContentType = response.headers.get('content-type');
      if (responseContentType && responseContentType.includes('application/json')) {
        parsedData = await response.json();
      } else {
        const rawText = await response.text();
        console.error('Server returned non-JSON successful response:', rawText);
        throw new Error('서버에서 올바른 형식의 응답(JSON)을 받지 못했습니다.');
      }
      
      // Merge with ids and convert into full state
      const newSubjectsState = { ...state.subjects };

      // Helper to map and assign unique ids to parsed items
      const mapSections = (sections: any[] | undefined, prefix: string): AssignmentSection[] => {
        if (!sections) return [];
        return sections.map((sec, idx) => ({
          id: `${prefix}_sec_${idx}_${Date.now()}`,
          title: sec.title || '숙제 항목',
          rawText: sec.rawText || '',
          problems: (sec.problems || []).map((p: any, pIdx: number) => ({
            id: `${prefix}_prob_${idx}_${pIdx}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            label: p.label,
            isCompleted: !!p.isCompleted,
          })),
        }));
      };

      (Object.keys(SUBJECTS_CONFIG) as SubjectType[]).forEach((subKey) => {
        const serverData = parsedData[subKey] || {};
        const prevSubject = state.subjects[subKey];

        // 1. Previews (예습): Unchecked previews are done during class, so they are replaced by newly parsed previews.
        const parsedPreviews = mapSections(serverData.previews, `${subKey}_p`);
        const previews = (serverData.previews && serverData.previews.length > 0)
          ? parsedPreviews
          : (prevSubject?.previews || []);

        // 2. Reviews (복습): Unchecked reviews are overdue, so we must preserve only the unchecked ones at the very front and append new reviews.
        const prevReviews = prevSubject?.reviews || [];
        const overdueReviews = prevReviews
          .map((sec) => ({
            ...sec,
            problems: sec.problems.filter((p) => !p.isCompleted),
          }))
          .filter((sec) => sec.problems.length > 0);

        const newReviews = mapSections(serverData.reviews, `${subKey}_r`);
        const reviews = [...overdueReviews, ...newReviews];

        // 3. WT Scopes (WT 대비): Replace with new if parsed, else keep existing.
        const parsedWtScopes = mapSections(serverData.wtScopes, `${subKey}_wtscope`);
        const wtScopes = (serverData.wtScopes && serverData.wtScopes.length > 0)
          ? parsedWtScopes
          : (prevSubject?.wtScopes || []);

        newSubjectsState[subKey] = {
          subjectId: subKey,
          previews,
          reviews,
          wtScopes,
          notes: serverData.notes || prevSubject?.notes || '',
        };
      });

      const today = new Date();
      const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')} ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

      setState({
        rawPasteText: uploadTab === 'text' ? pasteText : '사진(OCR) 분석 완료',
        lastParsedDate: dateString,
        subjects: newSubjectsState,
      });

      setSuccessMsg('픽스 학원 숙제/시험 범위 분석 완료! 귀여운 덤보와 함께 확인해보세요.');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '서버 연동 중 에러가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to initial raw text or template
  const handleLoadDemo = () => {
    setPasteText(INITIAL_PASTE_TEXT);
    setUploadTab('text');
    setSuccessMsg('기본 숙제 예시 텍스트가 로드되었습니다.');
  };

  const handleClearAll = () => {
    if (window.confirm('모든 데이터가 초기화되고 입력창이 비워집니다. 진행할까요?')) {
      setPasteText('');
      setImagePreviewUrl(null);
      setSelectedFile(null);
      stopCamera();
      const clearedSubjects = { ...state.subjects };
      (Object.keys(clearedSubjects) as SubjectType[]).forEach((key) => {
        clearedSubjects[key] = {
          subjectId: key,
          previews: [],
          reviews: [],
          wtScopes: [],
          notes: '',
        };
      });
      setState({
        rawPasteText: '',
        lastParsedDate: null,
        subjects: clearedSubjects,
      });
      setErrorMsg(null);
      setSuccessMsg('데이터가 깨끗하게 지워졌습니다.');
    }
  };

  // Check/uncheck problem
  const toggleProblem = (
    subjectId: SubjectType,
    sectionType: 'previews' | 'reviews' | 'wtScopes',
    sectionId: string,
    problemId: string
  ) => {
    setState((prev) => {
      const updatedSubjects = { ...prev.subjects };
      const subject = updatedSubjects[subjectId];
      const sections = subject[sectionType];
      
      const newSections = sections.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            problems: sec.problems.map((p) => {
              if (p.id === problemId) {
                return { ...p, isCompleted: !p.isCompleted };
              }
              return p;
            }),
          };
        }
        return sec;
      });

      updatedSubjects[subjectId] = {
        ...subject,
        [sectionType]: newSections,
      };

      return {
        ...prev,
        subjects: updatedSubjects,
      };
    });
  };

  // Quick mark entire section as completed/uncompleted
  const toggleSectionAll = (
    subjectId: SubjectType,
    sectionType: 'previews' | 'reviews' | 'wtScopes',
    sectionId: string,
    targetState: boolean
  ) => {
    setState((prev) => {
      const updatedSubjects = { ...prev.subjects };
      const subject = updatedSubjects[subjectId];
      const sections = subject[sectionType];
      
      const newSections = sections.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            problems: sec.problems.map((p) => ({ ...p, isCompleted: targetState })),
          };
        }
        return sec;
      });

      updatedSubjects[subjectId] = {
        ...subject,
        [sectionType]: newSections,
      };

      return {
        ...prev,
        subjects: updatedSubjects,
      };
    });
  };

  // Delete section
  const deleteSection = (
    subjectId: SubjectType,
    sectionType: 'previews' | 'reviews' | 'wtScopes',
    sectionId: string
  ) => {
    setState((prev) => {
      const updatedSubjects = { ...prev.subjects };
      const subject = updatedSubjects[subjectId];
      const sections = subject[sectionType];
      
      updatedSubjects[subjectId] = {
        ...subject,
        [sectionType]: sections.filter((sec) => sec.id !== sectionId),
      };

      return {
        ...prev,
        subjects: updatedSubjects,
      };
    });
  };

  // Add manual problem
  const handleAddManualProblem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProblemLabel.trim()) return;

    setState((prev) => {
      const updatedSubjects = { ...prev.subjects };
      const subject = updatedSubjects[manualSubject];
      const sections = subject[newProblemSection];

      // If there is already a section, we can append to the first one, or create a "추가 숙제" section if none exists
      let newSections = [...sections];
      if (newSections.length === 0) {
        newSections.push({
          id: `manual_sec_${Date.now()}`,
          title: `추가 과제`,
          rawText: '',
          problems: [],
        });
      }

      // Add to the first section
      newSections[0] = {
        ...newSections[0],
        problems: [
          ...newSections[0].problems,
          {
            id: `manual_prob_${Date.now()}`,
            label: newProblemLabel.trim(),
            isCompleted: false,
          },
        ],
      };

      updatedSubjects[manualSubject] = {
        ...subject,
        [newProblemSection]: newSections,
      };

      return {
        ...prev,
        subjects: updatedSubjects,
      };
    });

    setNewProblemLabel('');
    setSuccessMsg('새 숙제 문항이 성공적으로 추가되었습니다!');
  };

  // Update notes
  const handleNoteChange = (subjectId: SubjectType, notes: string) => {
    setState((prev) => {
      const updatedSubjects = { ...prev.subjects };
      updatedSubjects[subjectId] = {
        ...updatedSubjects[subjectId],
        notes,
      };
      return {
        ...prev,
        subjects: updatedSubjects,
      };
    });
  };

  // Stats calculation - keeping counts but removing raw progress bars (트래커 제거)
  const getSubjectStats = (subjectId: SubjectType, category: 'homework' | 'wt' | 'all' = 'all') => {
    const sub = state.subjects[subjectId];
    let total = 0;
    let completed = 0;

    const count = (secList: AssignmentSection[]) => {
      secList.forEach((sec) => {
        sec.problems.forEach((p) => {
          total++;
          if (p.isCompleted) completed++;
        });
      });
    };

    if (category === 'homework' || category === 'all') {
      count(sub.previews);
      count(sub.reviews);
    }
    if (category === 'wt' || category === 'all') {
      count(sub.wtScopes);
    }

    return { total, completed, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const getGlobalStats = () => {
    let total = 0;
    let completed = 0;
    (Object.keys(SUBJECTS_CONFIG) as SubjectType[]).forEach((key) => {
      const stats = getSubjectStats(key);
      total += stats.total;
      completed += stats.completed;
    });
    return { total, completed, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const globalStats = getGlobalStats();

  // Helper to color things
  const getSubjectColorClasses = (id: SubjectType) => {
    switch (id) {
      case 'geometry':
        return {
          bg: 'bg-blue-50/80 border-blue-100',
          text: 'text-blue-700 border-blue-200',
          darkText: 'text-blue-950',
          border: 'border-blue-200',
          badge: 'bg-blue-100 text-blue-800',
          accentBg: 'bg-blue-600',
          accentText: 'text-blue-600 hover:bg-blue-50/50',
          hoverBg: 'hover:bg-blue-50/30',
        };
      case 'algebra':
        return {
          bg: 'bg-emerald-50/80 border-emerald-100',
          text: 'text-emerald-700 border-emerald-200',
          darkText: 'text-emerald-950',
          border: 'border-emerald-200',
          badge: 'bg-emerald-100 text-emerald-800',
          accentBg: 'bg-emerald-600',
          accentText: 'text-emerald-600 hover:bg-emerald-50/50',
          hoverBg: 'hover:bg-emerald-50/30',
        };
      case 'combinatorics':
        return {
          bg: 'bg-orange-50/80 border-orange-100',
          text: 'text-orange-700 border-orange-200',
          darkText: 'text-orange-950',
          border: 'border-orange-200',
          badge: 'bg-orange-100 text-orange-800',
          accentBg: 'bg-orange-600',
          accentText: 'text-orange-600 hover:bg-orange-50/50',
          hoverBg: 'hover:bg-orange-50/30',
        };
      case 'number_theory':
        return {
          bg: 'bg-purple-50/80 border-purple-100',
          text: 'text-purple-700 border-purple-200',
          darkText: 'text-purple-950',
          border: 'border-purple-200',
          badge: 'bg-purple-100 text-purple-800',
          accentBg: 'bg-purple-600',
          accentText: 'text-purple-600 hover:bg-purple-50/50',
          hoverBg: 'hover:bg-purple-50/30',
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Celebration overlay */}
      <CelebrationOverlay isVisible={showCelebration} onClose={() => setShowCelebration(false)} />

      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-xs px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <span className="text-white font-black text-sm tracking-widest font-mono">PEAKS</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                픽스 학원 숙제 플래너
                <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">PEAKS Elite</span>
              </h1>
              <p className="text-xs text-slate-500">기하·대수·정수·조합 예복습 완벽 점검</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* PEAKS Band Shortcut */}
            <a 
              href="https://www.band.us/band/102658583/post"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl border border-emerald-700 shadow-xs text-xs font-black transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <ExternalLink size={14} />
              <span>픽스 밴드 바로가기</span>
            </a>

            {/* Dynamic Running Clock instead of Gauge Dashboard */}
            <div className="flex items-center gap-3 bg-white/90 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs">
              <Clock className="text-indigo-600 animate-pulse shrink-0" size={16} />
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 tracking-wider">현재 시간</p>
                <p className="text-xs font-extrabold text-slate-800 font-mono">
                  {currentTime.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })} {currentTime.toLocaleTimeString('ko-KR', { hour12: false })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* Alerts & Notifications Block (알림 기능) */}
        <div className="bg-indigo-50/75 border border-indigo-100 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Bell className="animate-bounce" size={18} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                픽스 주간 알림장 브리핑 & 오답 가이드
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              </h4>
              <p className="text-xs text-slate-600">
                {currentTime.getDay() === 2 ? (
                  <strong>오늘은 화요일 수업일입니다! 조합, 기하, 정수 과제 및 WT(개념/예제 1,2,3) 범위를 철저히 풀고 등원하세요.</strong>
                ) : currentTime.getDay() === 4 ? (
                  <strong>오늘은 목요일 수업일입니다! 대수 예습 유제 16-19 및 연습 14-18 숙제를 끝마쳤는지 체크하세요.</strong>
                ) : currentTime.getDay() === 0 ? (
                  <strong>오늘은 일요일 테스트일입니다! 2교시 복습테스트(WT)에서 최고 점수를 받아봅시다. 화이팅!</strong>
                ) : (
                  <span>정규 수업 요일(화·목·일) 전날 미리미리 예습을 풀어두는 것이 픽스 탑클래스 비결입니다!</span>
                )}
              </p>
              {/* WT 오답 가이드: 화요일에 시험지를 돌려받으므로 화~목요일에만 노출 */}
              {(currentTime.getDay() >= 2 && currentTime.getDay() <= 4) && (
                <div className="mt-1.5 text-[11px] leading-relaxed text-rose-700 bg-rose-50 border border-rose-100 rounded-lg p-2 font-bold">
                  📢 <span className="underline">WT 오답 규칙 (화~목 오답 기간)</span>: 화요일에 돌려받은 WT 시험지의 오답 처리는 목요일까지 완료해야 하며, <span className="text-rose-900 font-extrabold underline">틀린 과목만</span> 해당 담당 선생님(기하: 김동범쌤, 대수: 김주미쌤, 정수: 이상혁쌤, 조합: 하혜안쌤)께 꼭 개별 검사받아야 합니다!
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 shrink-0">
            {Object.entries(state.subjects).map(([key, sub]) => {
              const stats = getSubjectStats(key as SubjectType);
              const remaining = stats.total - stats.completed;
              if (remaining === 0) return null;
              return (
                <span key={key} className="text-[10px] font-bold bg-white border border-slate-200 px-2.5 py-1 rounded-md text-slate-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  {SUBJECTS_CONFIG[key as SubjectType].name}: {remaining}개 남음
                </span>
              );
            })}
            {(Object.keys(state.subjects) as SubjectType[]).every(subId => getSubjectStats(subId).total === getSubjectStats(subId).completed) && (
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md">
                🎉 모든 과제 완벽 정복!
              </span>
            )}
          </div>
        </div>

        {/* Feedback Alert banners */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-start gap-2 text-sm shadow-xs">
            <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
            <div className="flex-1">
              <span className="font-semibold">성공:</span> {successMsg}
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800 font-bold text-xs ml-2 cursor-pointer">닫기</button>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl flex items-start gap-2 text-sm shadow-xs">
            <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={16} />
            <div className="flex-1">
              <span className="font-semibold">확인 필요:</span> {errorMsg}
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-800 font-bold text-xs ml-2 cursor-pointer">닫기</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Side: Upload Controls & Mascot (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Input Zone Container with Tabs */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                  <Sparkles className="text-indigo-500" size={18} />
                  알림장 등록 & 사진 자동 인식 (OCR)
                </h3>
              </div>

              {/* Sub tabs for selection */}
              <div className="flex border-b border-slate-100 pb-1">
                <button
                  onClick={() => { setUploadTab('text'); handleClearImage(); }}
                  className={`flex-1 pb-2 text-center text-xs font-bold transition-all border-b-2 ${
                    uploadTab === 'text' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'
                  }`}
                >
                  텍스트 붙여넣기
                </button>
                <button
                  onClick={() => { setUploadTab('image'); stopCamera(); }}
                  className={`flex-1 pb-2 text-center text-xs font-bold transition-all border-b-2 ${
                    uploadTab === 'image' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'
                  }`}
                >
                  사진 파일 올리기
                </button>
                <button
                  onClick={() => { setUploadTab('camera'); startCamera(); }}
                  className={`flex-1 pb-2 text-center text-xs font-bold transition-all border-b-2 ${
                    uploadTab === 'camera' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'
                  }`}
                >
                  카메라로 바로 촬영
                </button>
              </div>

              {/* Tab 1: Text Input */}
              {uploadTab === 'text' && (
                <div className="space-y-3">
                  <div className="relative">
                    <textarea
                      id="textarea_homework_raw"
                      className="w-full h-64 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono transition-all resize-none"
                      placeholder={`학원 단톡방이나 알림장에서 복사한 숙제를 붙여넣어 주세요.
예시:
기하
예습: 52-57

대수
예습: 유제 16-19, 연습 14-18

조합
복습: 73-78`}
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                    />
                    {pasteText.length === 0 && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center pointer-events-none text-slate-400">
                        <FileText size={24} className="mb-2 text-slate-300" />
                        <p className="text-[11px] font-semibold">이곳에 숙제 전체를 붙여넣으세요</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleLoadDemo}
                      className="flex-1 py-1.5 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-all cursor-pointer text-center"
                    >
                      💡 예시 불러오기
                    </button>
                    <button 
                      onClick={handleClearAll}
                      className="px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 rounded-md cursor-pointer"
                    >
                      초기화
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Local Photo Upload */}
              {uploadTab === 'image' && (
                <div className="space-y-3">
                  <div 
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="w-full h-48 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/50 transition-all flex flex-col items-center justify-center p-4 text-center cursor-pointer relative"
                    onClick={() => document.getElementById('file_ocr_input')?.click()}
                  >
                    <input 
                      id="file_ocr_input"
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                    {imagePreviewUrl ? (
                      <div className="absolute inset-2 bg-white rounded-lg overflow-hidden border">
                        <img 
                          src={imagePreviewUrl} 
                          alt="OCR Preview" 
                          className="w-full h-full object-contain"
                        />
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleClearImage(); }}
                          className="absolute top-1.5 right-1.5 bg-slate-900/80 hover:bg-slate-950 text-white text-[10px] px-2 py-0.5 rounded-md"
                        >
                          삭제
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload size={28} className="text-slate-400 mb-1.5" />
                        <p className="text-xs font-bold text-slate-700">손글씨 알림장 사진 드래그 & 드롭</p>
                        <p className="text-[10px] text-slate-400 mt-1">또는 이곳을 클릭하여 탐색기에서 선택</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Webcam Camera capture */}
              {uploadTab === 'camera' && (
                <div className="space-y-3">
                  {isCameraActive ? (
                    <div className="relative w-full h-48 bg-black rounded-xl overflow-hidden border">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 inset-x-0 flex justify-center gap-2 px-3">
                        <button
                          onClick={capturePhoto}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md cursor-pointer flex items-center gap-1"
                        >
                          <Camera size={12} />
                          찰칵! 사진 찍기
                        </button>
                        <button
                          onClick={stopCamera}
                          className="bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg"
                        >
                          끄기
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-48 border border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
                      {imagePreviewUrl ? (
                        <div className="w-full h-full relative rounded-lg overflow-hidden border bg-white">
                          <img 
                            src={imagePreviewUrl} 
                            alt="Captured" 
                            className="w-full h-full object-contain"
                          />
                          <button 
                            onClick={handleClearImage}
                            className="absolute top-1.5 right-1.5 bg-slate-900/80 hover:bg-slate-950 text-white text-[10px] px-2 py-0.5 rounded-md"
                          >
                            지우고 다시 찍기
                          </button>
                        </div>
                      ) : (
                        <>
                          <Camera size={28} className="text-indigo-500 mb-1.5 animate-pulse" />
                          <p className="text-xs font-bold text-slate-700">웹캠 카메라로 노트 촬영하기</p>
                          <p className="text-[10px] text-slate-400 mt-1">카메라 권한을 수락하고 노트를 비추세요.</p>
                          <button
                            onClick={startCamera}
                            className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                          >
                            📷 카메라 켜기
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Main Parser Action Button */}
              <button
                id="btn_smart_parse"
                onClick={handleParse}
                disabled={isLoading || (uploadTab === 'text' ? !pasteText.trim() : !imagePreviewUrl)}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                  isLoading || (uploadTab === 'text' ? !pasteText.trim() : !imagePreviewUrl)
                    ? 'bg-slate-300 cursor-not-allowed shadow-none'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-98'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    AI가 사진 글씨 판독 및 숙제 추출 중...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    {uploadTab === 'text' ? '스마트 분석 및 개별 문항 추출' : 'AI 사진 판독 및 숙제 추출'}
                  </>
                )}
              </button>
            </div>

            {/* Dumbo Character Praise Section */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/70 p-5 rounded-2xl border border-indigo-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                {/* Custom SVG Dumbo character icon */}
                <div className="w-16 h-16 bg-white rounded-full border-2 border-indigo-300 flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative">
                  <svg viewBox="0 0 100 100" className="w-14 h-14 transform hover:scale-110 transition-transform">
                    {/* Ear Backs */}
                    <ellipse cx="25" cy="45" rx="18" ry="24" fill="#a5f3fc" />
                    <ellipse cx="75" cy="45" rx="18" ry="24" fill="#a5f3fc" />
                    <ellipse cx="28" cy="45" rx="12" ry="18" fill="#fbcfe8" />
                    <ellipse cx="72" cy="45" rx="12" ry="18" fill="#fbcfe8" />
                    {/* Head */}
                    <circle cx="50" cy="50" r="22" fill="#bae6fd" />
                    {/* Hat */}
                    <polygon points="50,15 38,32 62,32" fill="#fbbf24" />
                    <circle cx="50" cy="12" r="3" fill="#f59e0b" />
                    {/* Eyes */}
                    <ellipse cx="42" cy="48" rx="3.5" ry="5.5" fill="#1e293b" />
                    <ellipse cx="58" cy="48" rx="3.5" ry="5.5" fill="#1e293b" />
                    <circle cx="41" cy="46" r="1" fill="#ffffff" />
                    <circle cx="57" cy="46" r="1" fill="#ffffff" />
                    {/* Cheeks */}
                    <circle cx="38" cy="55" r="3" fill="#fca5a5" opacity="0.6" />
                    <circle cx="62" cy="55" r="3" fill="#fca5a5" opacity="0.6" />
                    {/* Trunk */}
                    <path d="M 50,55 Q 52,68 45,72 Q 40,73 43,67" fill="none" stroke="#60a5fa" strokeWidth="5" strokeLinecap="round" />
                  </svg>
                  {/* Status halo */}
                  <span className="absolute bottom-0 right-1 text-xs">🐘</span>
                </div>
                
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                    꼬마 코끼리 덤보
                    <span className="text-[10px] bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded-sm font-bold">공부 도우미</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">큰 귀로 날아와 여러분의 노력을 진심으로 축하해줘요!</p>
                </div>
              </div>

              {/* Speech bubble */}
              <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-xs relative">
                <div className="absolute left-6 top-[-7px] w-3.5 h-3.5 bg-white border-t border-l border-indigo-100 transform rotate-45"></div>
                <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                  {(() => {
                    const subjectKeys = Object.keys(state.subjects) as SubjectType[];
                    const totalTasks = subjectKeys.reduce((acc, subId) => acc + getSubjectStats(subId).total, 0);
                    const compTasks = subjectKeys.reduce((acc, subId) => acc + getSubjectStats(subId).completed, 0);
                    const pct = totalTasks > 0 ? Math.round((compTasks / totalTasks) * 100) : 0;

                    if (totalTasks === 0) {
                      return "덤보가 큰 귀를 쫑긋 세우고 기다려요! 알림장 사진을 찍거나 숙제를 입력해서 플래너를 시작해봐요! 🐘💙";
                    }
                    if (pct === 100) {
                      return "🌈 끼야호! 모든 문제를 완벽하게 풀어냈구나! 덤보가 큰 귀로 하늘 높이 펄펄 날면서 너를 안아주고 있어! 너는 정말 최고의 영재야! 🎉✨🎈";
                    }
                    if (pct >= 80) {
                      return "우와! 고지가 코앞이야! 덤보가 신나서 춤을 추고 귀를 펄럭이고 있어. 마지막 한 두 문제만 더 힘내자! 🐘🔥";
                    }
                    if (pct >= 50) {
                      return "절반 이상 성공! 대수, 기하 등 까다로운 KMO 문제를 이렇게 훌륭히 풀어내다니 대단해. 덤보가 옆에서 응원의 바람을 불어줄게! 🍿🐘💨";
                    }
                    if (pct > 0) {
                      return "스타트가 좋아! 차근차근 해결해 보자. 어려운 증명 문제나 유제 풀이도 포기하지 마! 덤보가 항상 네 편이야. 🐘📝";
                    }
                    return "자, 오늘의 픽스 경시 숙제를 격파해볼까? 대수 유제, 정수 연습문제를 하나씩 체크하면서 끝마쳐보자! 덤보와 함께 출발! 🐘💙";
                  })()}
                </p>
              </div>

              {/* Dumbo interactive interaction button */}
              <button
                onClick={() => {
                  const phrases = [
                    "덤보가 코로 물을 뿜어 응원합니다! 뿜뿜~ 💦🐘💙",
                    "대수와 기하는 증명이 핵심! 덤보도 같이 생각해볼게요!",
                    "오늘 한 장의 공부가 미래 KMO 금메달의 밑거름이 됩니다! 🥇",
                    "지칠 땐 맛있는 간식을 먹으며 덤보 귀처럼 큰 심호흡을 하세요! 🍿",
                    "완벽히 완료하면 대포알처럼 멋진 칭찬을 해드릴게요!"
                  ];
                  const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
                  alert(`🐘 덤보의 따뜻한 한마디:\n"${randomPhrase}"`);
                }}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <Volume2 size={13} />
                덤보에게 힘찬 응원 한마디 듣기
              </button>
            </div>

            {/* Manual Add Quick Form */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                <Plus className="text-indigo-500" size={16} />
                수동 숙제/문항 추가
              </h3>
              <form onSubmit={handleAddManualProblem} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">대상 과목</label>
                  <select
                    id="select_manual_subject"
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-50 focus:bg-white"
                    value={manualSubject}
                    onChange={(e) => setManualSubject(e.target.value as SubjectType)}
                  >
                    {Object.values(SUBJECTS_CONFIG).map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">구분</label>
                    <select
                      id="select_manual_section"
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-50 focus:bg-white"
                      value={newProblemSection}
                      onChange={(e) => setNewProblemSection(e.target.value as any)}
                    >
                      <option value="previews">예습</option>
                      <option value="reviews">복습</option>
                      <option value="wtScopes">WT 범위</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">문항/페이지명</label>
                    <input
                      id="input_manual_problem_label"
                      type="text"
                      placeholder="예: 연습 15, 82p"
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                      value={newProblemLabel}
                      onChange={(e) => setNewProblemLabel(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  id="btn_add_manual_problem"
                  type="submit"
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  <Plus size={14} />
                  목록에 바로 추가
                </button>
              </form>
            </div>

          </div>

          {/* Right Side: Timetable & Homework Boards (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Weekly Timetable Panel (첫 화면 합침) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <Calendar className="text-indigo-600" size={16} />
                    픽스 경시학원 주간 수업 시간표
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">화목일 수업 루틴에 최적화된 공부 루틴을 형성하세요.</p>
                </div>
                <div className="bg-indigo-50 text-indigo-700 px-2 py-0.5 text-[10px] font-bold rounded-full">
                  정규 3교시제
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {WEEKLY_SCHEDULE.map((daySched) => {
                  return (
                    <div key={daySched.day} className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                        <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                          {daySched.day}
                        </span>
                        <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-1.5 rounded-sm">
                          수업일
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {daySched.periods.map((per) => {
                          const isWt = per.subjectId === 'wt';
                          const colors = !isWt ? getSubjectColorClasses(per.subjectId as SubjectType) : null;

                          return (
                            <div 
                              key={per.period}
                              className={`p-1.5 px-2 rounded-lg border flex items-center justify-between transition-all text-[11px] ${
                                isWt 
                                  ? 'bg-amber-50/70 border-amber-200 text-amber-900' 
                                  : colors 
                                    ? `${colors.bg} ${colors.border}` 
                                    : 'bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-black text-slate-400 w-9 bg-white/80 border py-0.5 rounded text-center">
                                  {per.period}교시
                                </span>
                                <span className={`font-bold ${isWt ? 'text-amber-800' : colors?.darkText}`}>
                                  {per.subjectName}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* 2-Category Main Tabs Menu */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-2 shadow-xs">
              <button
                id="btn_tab_category_homework"
                onClick={() => setActiveCategory('homework')}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  activeCategory === 'homework'
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                }`}
              >
                <BookOpen size={16} className={activeCategory === 'homework' ? 'text-indigo-600' : 'text-slate-400'} />
                <span>과제 학습 (예습 · 복습)</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black transition-all ${activeCategory === 'homework' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200/80 text-slate-600'}`}>
                  {(() => {
                    let total = 0;
                    (Object.keys(SUBJECTS_CONFIG) as SubjectType[]).forEach((key) => {
                      const stats = getSubjectStats(key, 'homework');
                      total += stats.total;
                    });
                    return total;
                  })()}문항
                </span>
              </button>
              <button
                id="btn_tab_category_wt"
                onClick={() => setActiveCategory('wt')}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  activeCategory === 'wt'
                    ? 'bg-white text-amber-700 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                }`}
              >
                <Sparkles size={16} className={activeCategory === 'wt' ? 'text-amber-500 animate-pulse' : 'text-slate-400'} />
                <span>WT 테스트 대비</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black transition-all ${activeCategory === 'wt' ? 'bg-amber-50 text-amber-700' : 'bg-slate-200/80 text-slate-600'}`}>
                  {(() => {
                    let total = 0;
                    (Object.keys(SUBJECTS_CONFIG) as SubjectType[]).forEach((key) => {
                      const stats = getSubjectStats(key, 'wt');
                      total += stats.total;
                    });
                    return total;
                  })()}범위
                </span>
              </button>
            </div>

            {/* Subject Filters Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 mr-2">과목 필터:</span>
                {Object.values(SUBJECTS_CONFIG).map((sub) => {
                  const stats = getSubjectStats(sub.id, activeCategory);
                  const isSelected = selectedSubject === sub.id;
                  return (
                    <button
                      id={`btn_filter_subject_${sub.id}`}
                      key={sub.id}
                      onClick={() => setSelectedSubject(sub.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>{sub.name}</span>
                      <span className={`text-[9px] px-1 py-0.2 rounded-full ${isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                        {stats.completed}/{stats.total}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-2.5 top-2.5 text-slate-400" size={13} />
                  <input
                    id="input_search_query"
                    type="text"
                    placeholder="문항 검색 (예: 연습 14)..."
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs w-full sm:w-40 focus:bg-white focus:outline-hidden"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <select
                  id="select_status_filter"
                  className="border border-slate-200 rounded-lg p-1.5 text-xs bg-slate-50 focus:bg-white"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                >
                  <option value="all">모든 상태</option>
                  <option value="todo">미완료 과제</option>
                  <option value="completed">완료한 과제</option>
                </select>
              </div>
            </div>

            {/* Interactive Subject Panels */}
            <div className="space-y-6">
              {(Object.keys(SUBJECTS_CONFIG) as SubjectType[])
                .filter((key) => selectedSubject === key)
                .map((subId) => {
                  const config = SUBJECTS_CONFIG[subId];
                  const subState = state.subjects[subId];
                  const colors = getSubjectColorClasses(subId);
                  const stats = getSubjectStats(subId, activeCategory);

                  return (
                    <div 
                      key={subId} 
                      className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:shadow-sm"
                    >
                      {/* Subject Heading */}
                      <div className={`px-5 py-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${colors.bg}`}>
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${colors.accentBg}`}></span>
                          <h2 className={`text-base font-black ${colors.darkText}`}>
                            {config.name} <span className="text-xs font-normal text-slate-500">({config.teacher})</span>
                          </h2>
                          <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-md font-bold text-slate-500">
                            완료: {stats.completed} / 전체: {stats.total}개
                          </span>
                        </div>
                      </div>

                      {/* Content Grid */}
                      <div className="p-5 space-y-6">
                        
                        <div className="space-y-6">
                          
                          {/* 1. 과제 학습 (예습·복습) Section */}
                          {activeCategory === 'homework' && (
                            <div className="space-y-3 bg-indigo-50/20 border border-indigo-100/50 rounded-2xl p-4">
                              <div className="flex items-center gap-1.5 border-b border-indigo-100/50 pb-1.5 mb-2">
                                <BookOpen className="text-indigo-600" size={15} />
                                <span className="text-[12px] font-extrabold text-indigo-950 uppercase tracking-wider">
                                  과제 학습 (예습 · 복습)
                                </span>
                              </div>

                              <div className="space-y-4">
                                {(['previews', 'reviews'] as const).map((secType) => {
                                  const sections = subState[secType];
                                  const sectionTypeName = secType === 'previews' ? '예습 과제 (수업 전)' : '복습 과제 (수업 후)';

                                  return (
                                    <div key={secType} className="space-y-2">
                                      <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                          {sectionTypeName}
                                        </span>
                                      </div>

                                      {sections.length === 0 ? (
                                        <div className="bg-white/50 border border-dashed border-slate-200 rounded-xl p-5 text-center text-slate-400 text-xs">
                                          등록된 {secType === 'previews' ? '예습' : '복습'} 과제가 없습니다.
                                        </div>
                                      ) : (

                                        <div className="space-y-3">
                                          {sections.map((sec) => {
                                            // Filter problems
                                            const filteredProblems = sec.problems.filter((p) => {
                                              const matchesSearch = p.label.toLowerCase().includes(searchQuery.toLowerCase());
                                              const matchesStatus = 
                                                filterType === 'all' ||
                                                (filterType === 'todo' && !p.isCompleted) ||
                                                (filterType === 'completed' && p.isCompleted);
                                              return matchesSearch && matchesStatus;
                                            });

                                            if (filteredProblems.length === 0 && searchQuery) return null;

                                            const secTotal = sec.problems.length;
                                            const secCompleted = sec.problems.filter(p => p.isCompleted).length;

                                            return (
                                              <div key={sec.id} className="bg-white rounded-xl p-4 border border-slate-150 shadow-2xs">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
                                                  <div>
                                                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                                      {sec.title}
                                                      <span className="text-[10px] font-bold bg-slate-200/80 text-slate-600 px-1.5 py-0.2 rounded">
                                                        {secCompleted}/{secTotal}
                                                      </span>
                                                    </h4>
                                                    {sec.rawText && (
                                                      <p className="text-[9px] text-slate-400 mt-0.5 font-mono">
                                                        원본: {sec.rawText}
                                                      </p>
                                                    )}
                                                  </div>

                                                  {/* Section Batch Controls */}
                                                  <div className="flex items-center gap-1.5">
                                                    <button
                                                      id={`btn_section_all_${sec.id}`}
                                                      onClick={() => toggleSectionAll(subId, secType, sec.id, true)}
                                                      className="text-[10px] font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 px-2 py-1 rounded transition-all cursor-pointer"
                                                    >
                                                      전체 체크
                                                    </button>
                                                    <button
                                                      id={`btn_section_none_${sec.id}`}
                                                      onClick={() => toggleSectionAll(subId, secType, sec.id, false)}
                                                      className="text-[10px] font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 px-2 py-1 rounded transition-all cursor-pointer"
                                                    >
                                                      전체 해제
                                                    </button>
                                                    <button
                                                      id={`btn_section_delete_${sec.id}`}
                                                      onClick={() => deleteSection(subId, secType, sec.id)}
                                                      className="text-[10px] font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded transition-all ml-1 cursor-pointer"
                                                      title="삭제"
                                                    >
                                                      <Trash2 size={11} />
                                                    </button>
                                                  </div>
                                                </div>

                                                {/* Checkbox Matrix */}
                                                {filteredProblems.length === 0 ? (
                                                  <p className="text-[11px] text-slate-400 italic">표시할 문항이 없습니다.</p>
                                                ) : (
                                                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                                                    {filteredProblems.map((prob) => {
                                                      return (
                                                        <button
                                                          id={`btn_prob_toggle_${prob.id}`}
                                                          key={prob.id}
                                                          onClick={() => toggleProblem(subId, secType, sec.id, prob.id)}
                                                          className={`p-2 rounded-lg border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                                                            prob.isCompleted
                                                              ? `${colors.bg} ${colors.border}`
                                                              : 'bg-white border-slate-200 hover:border-slate-300'
                                                          }`}
                                                        >
                                                          <div className="shrink-0">
                                                            {prob.isCompleted ? (
                                                              <CheckSquare className={colors.text} size={14} />
                                                            ) : (
                                                              <Square className="text-slate-400" size={14} />
                                                            )}
                                                          </div>
                                                          <span className={`text-[11px] font-bold truncate ${
                                                            prob.isCompleted 
                                                              ? `${colors.text} line-through opacity-70` 
                                                              : 'text-slate-700'
                                                          }`}>
                                                            {prob.label}
                                                          </span>
                                                        </button>
                                                      );
                                                    })}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                                </div>
                              </div>
                            )}

                            {/* 2. WT 테스트 대비 Section */}
                            {activeCategory === 'wt' && (
                              <div className="space-y-3 bg-amber-50/20 border border-amber-100/50 rounded-2xl p-4">
                                <div className="flex items-center gap-1.5 border-b border-amber-100/50 pb-1.5 mb-2">
                                  <Sparkles className="text-amber-600 animate-pulse" size={15} />
                                  <span className="text-[12px] font-extrabold text-amber-950 uppercase tracking-wider">
                                    WT 테스트 대비
                                  </span>
                                </div>

                                {subState.wtScopes.length === 0 ? (
                                  <div className="bg-white/50 border border-dashed border-slate-200 rounded-xl p-5 text-center text-slate-400 text-xs">
                                    등록된 WT 시험 대비 범위가 없습니다.
                                    <p className="text-[10px] text-slate-400 mt-1">왼쪽에서 사진을 업로드하거나 알림장 텍스트를 입력해 보세요.</p>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                  {subState.wtScopes.map((sec) => {
                                    const secType = 'wtScopes';
                                    // Filter problems
                                    const filteredProblems = sec.problems.filter((p) => {
                                      const matchesSearch = p.label.toLowerCase().includes(searchQuery.toLowerCase());
                                      const matchesStatus = 
                                        filterType === 'all' ||
                                        (filterType === 'todo' && !p.isCompleted) ||
                                        (filterType === 'completed' && p.isCompleted);
                                      return matchesSearch && matchesStatus;
                                    });

                                    if (filteredProblems.length === 0 && searchQuery) return null;

                                    const secTotal = sec.problems.length;
                                    const secCompleted = sec.problems.filter(p => p.isCompleted).length;

                                    return (
                                      <div key={sec.id} className="bg-white rounded-xl p-4 border border-slate-150 shadow-2xs">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
                                          <div>
                                            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                              {sec.title}
                                              <span className="text-[10px] font-bold bg-slate-200/80 text-slate-600 px-1.5 py-0.2 rounded">
                                                {secCompleted}/{secTotal}
                                              </span>
                                            </h4>
                                            {sec.rawText && (
                                              <p className="text-[9px] text-slate-400 mt-0.5 font-mono">
                                                원본: {sec.rawText}
                                              </p>
                                            )}
                                          </div>

                                          {/* Section Batch Controls */}
                                          <div className="flex items-center gap-1.5">
                                            <button
                                              id={`btn_section_all_${sec.id}`}
                                              onClick={() => toggleSectionAll(subId, secType, sec.id, true)}
                                              className="text-[10px] font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 px-2 py-1 rounded transition-all cursor-pointer"
                                            >
                                              전체 체크
                                            </button>
                                            <button
                                              id={`btn_section_none_${sec.id}`}
                                              onClick={() => toggleSectionAll(subId, secType, sec.id, false)}
                                              className="text-[10px] font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 px-2 py-1 rounded transition-all cursor-pointer"
                                            >
                                              전체 해제
                                            </button>
                                            <button
                                              id={`btn_section_delete_${sec.id}`}
                                              onClick={() => deleteSection(subId, secType, sec.id)}
                                              className="text-[10px] font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded transition-all ml-1 cursor-pointer"
                                              title="삭제"
                                            >
                                              <Trash2 size={11} />
                                            </button>
                                          </div>
                                        </div>

                                        {/* Checkbox Matrix */}
                                        {filteredProblems.length === 0 ? (
                                          <p className="text-[11px] text-slate-400 italic">표시할 문항이 없습니다.</p>
                                        ) : (
                                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                                            {filteredProblems.map((prob) => {
                                              return (
                                                <button
                                                  id={`btn_prob_toggle_${prob.id}`}
                                                  key={prob.id}
                                                  onClick={() => toggleProblem(subId, secType, sec.id, prob.id)}
                                                  className={`p-2 rounded-lg border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                                                    prob.isCompleted
                                                      ? `${colors.bg} ${colors.border}`
                                                      : 'bg-white border-slate-200 hover:border-slate-300'
                                                  }`}
                                                >
                                                  <div className="shrink-0">
                                                    {prob.isCompleted ? (
                                                      <CheckSquare className={colors.text} size={14} />
                                                    ) : (
                                                      <Square className="text-slate-400" size={14} />
                                                    )}
                                                  </div>
                                                  <span className={`text-[11px] font-bold truncate ${
                                                    prob.isCompleted 
                                                      ? `${colors.text} line-through opacity-70` 
                                                      : 'text-slate-700'
                                                  }`}>
                                                    {prob.label}
                                                  </span>
                                                </button>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          </div>

                        {/* Praise Character Zone (핵심 공식 복습 노트 대체) */}
                        <div className="pt-5 border-t border-slate-100 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-0.5">
                              <span className="text-xs sm:text-sm font-extrabold text-slate-700 flex items-center gap-1.5">
                                <span>✨ 픽스 오늘의 칭찬 & 응원 메신저</span>
                              </span>
                              <p className="text-[10px] text-slate-400">학습 진행 상태에 따라 캐릭터들의 대화와 반응이 변화합니다.</p>
                            </div>
                            <button
                              onClick={() => rotatePraiseCharacter(subId)}
                              className="text-xs sm:text-sm font-extrabold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:scale-[1.02] active:scale-[0.98] px-4 py-2 rounded-xl cursor-pointer transition-all border border-indigo-200/40 shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
                            >
                              🔄 응원 친구 바꾸기
                            </button>
                          </div>

                          {(() => {
                            const char = PRAISE_CHARACTERS[praiseIndices[subId]];
                            const reviewsTotal = subState.reviews.reduce((acc, r) => acc + r.problems.length, 0);
                            const reviewsCompleted = subState.reviews.reduce((acc, r) => acc + r.problems.filter(p => p.isCompleted).length, 0);
                            const isReviewsPerfect = reviewsTotal > 0 && reviewsCompleted === reviewsTotal;
                            const isReviewsActive = reviewsCompleted > 0;

                            if (isReviewsPerfect) {
                              return (
                                <div className={`p-5 rounded-2xl border-2 ${char.borderColor} ${char.color} shadow-sm space-y-3 transition-all duration-300`}>
                                  <div className="flex items-center gap-3">
                                    <span className="text-3xl animate-bounce">{char.emoji}</span>
                                    <div>
                                      <h5 className="font-extrabold text-sm flex items-center gap-2 text-slate-800">
                                        {char.name}의 극찬!
                                        <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">복습 완료율 100% 🏆</span>
                                      </h5>
                                      <p className="text-[11px] text-slate-500 mt-0.5">{char.celebration}</p>
                                    </div>
                                  </div>
                                  <p className="text-xs sm:text-sm font-black leading-relaxed pl-11 text-slate-800 bg-white/60 p-3 rounded-xl border border-white/50">
                                    "{char.text}"
                                  </p>
                                </div>
                              );
                            }

                            if (isReviewsActive) {
                              return (
                                <div className={`p-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-700 shadow-2xs space-y-3 transition-all duration-300`}>
                                  <div className="flex items-center gap-3">
                                    <span className="text-3xl animate-pulse">{char.emoji}</span>
                                    <div>
                                      <h5 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                                        {char.name}이 곁에서 응원해요
                                        <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-full">진행 중 ⚡</span>
                                      </h5>
                                      <p className="text-[11px] text-slate-500 mt-0.5">복습 완료율: {Math.round((reviewsCompleted / reviewsTotal) * 100)}% ({reviewsCompleted}/{reviewsTotal}개)</p>
                                    </div>
                                  </div>
                                  <p className="text-xs sm:text-sm font-black italic pl-11 text-slate-700 bg-white p-3 rounded-xl border border-slate-100">
                                    "와! 절반 넘게 가고 있어! 조금만 더 풀면 내 특급 극찬 도장을 받아 갈 수 있어! 힘내자구! {char.emoji}🔥"
                                  </p>
                                </div>
                              );
                            }

                            return (
                              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3 text-slate-600 transition-all duration-300">
                                <span className="text-3xl grayscale opacity-70 mt-0.5">{char.emoji}</span>
                                <div className="flex-1 space-y-1">
                                  <h5 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                                    {char.name}의 칭찬 도장 대기 중
                                  </h5>
                                  <p className="text-xs text-slate-500 leading-relaxed">
                                    복습 과제를 풀고 완료 체크를 하시면 {char.name}이 칭찬의 댄스를 선사합니다! 🐘💙
                                  </p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                      </div>
                    </div>
                  );
                })}
            </div>

          </div>

        </div>

      </main>

      {/* Aesthetic human label margin footer */}
      <footer className="text-center py-10 text-xs text-slate-400 border-t border-slate-200 mt-12">
        <p>© 2026 픽스 경시학원(PEAKS) 맞춤형 숙제 플래너. KMO 최고 영재들을 응원합니다.</p>
      </footer>
    </div>
  );
}
