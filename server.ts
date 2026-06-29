import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required. Please set it in the Secrets panel.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// GET fallback to prevent 405/404 confusion
app.get('/api/parse-homework', (req, res) => {
  res.status(405).json({ error: 'POST method is required for parsing homework.' });
});

// REST API for parsing the custom text format or handwritten photo using Gemini
app.post('/api/parse-homework', async (req, res) => {
  try {
    const { text, image } = req.body;
    
    if (!text && !image) {
       res.status(400).json({ error: 'Text content or image is required' });
       return;
    }

    const ai = getAiClient();

    const systemInstruction = `
      You are an expert tutor coordinator for "Fix" (픽스 경시학원), a highly competitive math academy.
      Your task is to parse raw homework, WT range, or handwritten planner/notebook photos into structured JSON.
      
      There are 4 main subjects:
      1. 기하 (geometry)
      2. 대수 (algebra)
      3. 정수 (number_theory)
      4. 조합 (combinatorics)

      OCR Misread & Subject Matching Corrections:
      - IMPORTANT OCR FIX: Handwriting recognition often misreads "수열 이론" (Sequence Theory) or "수열이론" as "4열 어른", "4열어른", "수열어른", "4열", or "4열 어론". You MUST interpret any such text as "수열 이론" and always categorize it under "대수 (algebra)".
      - Always categorize general Sequence (수열), series, or functional equations under "대수 (algebra)".

      Each subject contains 3 potential sections of work (Exclude WT 오답 / wtErrors as requested by user):
      - previews (예습)
      - reviews (복습)
      - wtScopes (WT 범위 - Weekly Test study range)
      There is also a general "notes" field for any extra comments.

      Crucial instructions for problem/page ranges:
      - THEORY & CONCEPT SEPARATION RULES:
        1. IF NOT separated by a comma (e.g., "이론 p.52-58", "이론 52-58p"):
           - This means studying the theory page range.
           - You MUST split this range into individual page items, carrying the prefix and page indicator over.
           - For example: "이론 p.52-58" MUST be split into: "이론 p.52", "이론 p.53", "이론 p.54", "이론 p.55", "이론 p.56", "이론 p.57", "이론 p.58".
           - "개념 12-15p" MUST be split into: "개념 12p", "개념 13p", "개념 14p", "개념 15p".
        2. IF separated by a comma or explicit separator (e.g., "이론, 52-58" or "이론 및 52-58"):
           - This means TWO separate homework sections:
             a. A single item for reading/studying the theory, labeled simply "이론" (or "개념" etc.).
             b. A range of homework problems from #52 to #58, which must be split into separate problem items: "#52", "#53", "#54", "#55", "#56", "#57", "#58" (or "52번", "53번" etc.).
           - DO NOT merge the word "이론" into each problem number (e.g., DO NOT generate "이론 52", "이론 53" etc.). Keep "이론" as its own separate item, and list problem numbers separately.
      - IMPORTANT RULE: For actual problem lists/practice exercise ranges, if a homework description does NOT contain the letter 'p' or 'p.' or the word '페이지' anywhere in that range/item context, you must treat every item as a problem number (e.g., '#52' or '52번', or just '52'), NOT as a page (페이지). Only append 'p' to the label (e.g., '52p') if 'p' or 'p.' or '페이지' was explicitly written in the raw text.
        For example:
        - "52-57" (no 'p') -> should generate problem numbers: "#52", "#53", "#54", "#55", "#56", "#57" (or "52번", "53번" etc). Do NOT generate "52p", "53p", etc.
        - "52-57p" (contains 'p') -> should generate pages: "52p", "53p", "54p", "55p", "56p", "57p".
      - For actual homework problem ranges, you MUST split a range (e.g., "14-18", "1~18", "43-47") into individual, distinct items in the 'problems' list.
        For example:
        - "유제 16-19" should generate: "유제 16", "유제 17", "유제 18", "유제 19"
        - "연습 14-18" should generate: "연습 14", "연습 15", "연습 16", "연습 17", "연습 18"
        - "이론, 52-58" should generate: "이론" as one item, followed by "#52", "#53", "#54", "#55", "#56", "#57", "#58" (or "52번"...) as separate problem items.
        - "이론 p.52-58" should generate: "이론 p.52", "이론 p.53", "이론 p.54", "이론 p.55", "이론 p.56", "이론 p.57", "이론 p.58".
        - "이론 p.45" should generate: "이론 p.45" as a single item.
        - "#65-78" list of question numbers should generate: "#65", "#66", ..., "#78"
        - "WT 범위: 대수 : 1단원 연습문제 1번~18번" should generate individual items: "연습 1", "연습 2", ..., "연습 18"
        - "1단원 연습문제 18~26" should generate: "연습 18", "연습 19", ..., "연습 26"
        - "2단원 개념 및 예제1,2,3" should generate: "2단원 개념", "예제 1", "예제 2", "예제 3"

      Check if any item is already completed based on sections like "WT 공부 중" or "done" status in the text or written on the paper.
      For example:
      "WT 공부 중
      기하: done
      대수: 1단원 연습 9,16,17"
      - Under 'geometry', all parsed problems should have isCompleted: true.
      - Under 'algebra', ONLY the problems corresponding to "연습 9", "연습 16", "연습 17" under 'algebra' WT scope should be marked isCompleted: true, and isCompleted: false for other algebra problems.

      Respond ONLY with valid JSON conforming to the requested schema. Ensure to parse thoroughly.
    `;

    const parts: any[] = [];

    if (image) {
      // image is expected to be a data URI: "data:image/png;base64,iVBOR..."
      const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      } else {
        // Fallback if raw base64 is sent
        parts.push({
          inlineData: {
            data: image,
            mimeType: 'image/jpeg'
          }
        });
      }
    }

    const textPrompt = text 
      ? `Please extract and parse the homework from this text into structured JSON as defined by the system instructions: \n\n${text}`
      : `Please analyze the handwritten notebook/planner in this image, identify all assignments for Peaks academy (Geometry, Algebra, Combinatorics, Number Theory) including Previews (예습), Reviews (복습), and WT Scope (WT 범위), expand any page/problem ranges, and parse it into structured JSON.`;

    parts.push({ text: textPrompt });

    const config = {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          geometry: {
            type: Type.OBJECT,
            properties: {
              previews: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Title like '예습: 52-57'" },
                    problems: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          isCompleted: { type: Type.BOOLEAN }
                        },
                        required: ['label', 'isCompleted']
                      }
                    }
                  },
                  required: ['title', 'problems']
                }
              },
              reviews: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    problems: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          isCompleted: { type: Type.BOOLEAN }
                        },
                        required: ['label', 'isCompleted']
                      }
                    }
                  },
                  required: ['title', 'problems']
                }
              },
              wtScopes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    problems: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          isCompleted: { type: Type.BOOLEAN }
                        },
                        required: ['label', 'isCompleted']
                      }
                    }
                  },
                  required: ['title', 'problems']
                }
              },
              notes: { type: Type.STRING }
            }
          },
          algebra: {
            type: Type.OBJECT,
            properties: {
              previews: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    problems: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          isCompleted: { type: Type.BOOLEAN }
                        },
                        required: ['label', 'isCompleted']
                      }
                    }
                  },
                  required: ['title', 'problems']
                }
              },
              reviews: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    problems: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          isCompleted: { type: Type.BOOLEAN }
                        },
                        required: ['label', 'isCompleted']
                      }
                    }
                  },
                  required: ['title', 'problems']
                }
              },
              wtScopes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    problems: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          isCompleted: { type: Type.BOOLEAN }
                        },
                        required: ['label', 'isCompleted']
                      }
                    }
                  },
                  required: ['title', 'problems']
                }
              },
              notes: { type: Type.STRING }
            }
          },
          combinatorics: {
            type: Type.OBJECT,
            properties: {
              previews: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    problems: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          isCompleted: { type: Type.BOOLEAN }
                        },
                        required: ['label', 'isCompleted']
                      }
                    }
                  },
                  required: ['title', 'problems']
                }
              },
              reviews: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    problems: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          isCompleted: { type: Type.BOOLEAN }
                        },
                        required: ['label', 'isCompleted']
                      }
                    }
                  },
                  required: ['title', 'problems']
                }
              },
              wtScopes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    problems: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          isCompleted: { type: Type.BOOLEAN }
                        },
                        required: ['label', 'isCompleted']
                      }
                    }
                  },
                  required: ['title', 'problems']
                }
              },
              notes: { type: Type.STRING }
            }
          },
          number_theory: {
            type: Type.OBJECT,
            properties: {
              previews: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    problems: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          isCompleted: { type: Type.BOOLEAN }
                        },
                        required: ['label', 'isCompleted']
                      }
                    }
                  },
                  required: ['title', 'problems']
                }
              },
              reviews: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    problems: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          isCompleted: { type: Type.BOOLEAN }
                        },
                        required: ['label', 'isCompleted']
                      }
                    }
                  },
                  required: ['title', 'problems']
                }
              },
              wtScopes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    problems: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          isCompleted: { type: Type.BOOLEAN }
                        },
                        required: ['label', 'isCompleted']
                      }
                    }
                  },
                  required: ['title', 'problems']
                }
              },
              notes: { type: Type.STRING }
            }
          }
        }
      }
    };

    let response: any = null;
    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-2.5-pro'
    ];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting Gemini parsing with model: ${modelName}`);
        response = await ai.models.generateContent({
          model: modelName,
          contents: parts,
          config: config
        });
        if (response && response.text) {
          console.log(`Successfully generated content using model: ${modelName}`);
          break; // Succeeded!
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} failed/unavailable:`, err.message || err);
        lastError = err;
      }
    }

    if (!response) {
      throw lastError || new Error('All Gemini model attempts failed.');
    }

    const parsedJson = JSON.parse(response.text || '{}');
    res.json(parsedJson);
  } catch (error: any) {
    console.error('Gemini parsing failed:', error);
    
    let userFriendlyError = '서버에서 AI 분석 중 오류가 발생했습니다.';
    const errorStr = typeof error === 'object' ? JSON.stringify(error) : String(error);
    const errMsg = error.message || '';
    
    if (
      errorStr.includes('429') || 
      errorStr.includes('RESOURCE_EXHAUSTED') || 
      errMsg.includes('quota') || 
      errMsg.includes('429') || 
      errMsg.includes('RESOURCE_EXHAUSTED')
    ) {
      userFriendlyError = '인공지능(Gemini) 모델의 무료 호출 한도가 순간적으로 초과되었습니다. 10~30초 후에 다시 [분석] 버튼을 누르면 성공합니다.';
    } else if (
      errorStr.includes('503') || 
      errorStr.includes('UNAVAILABLE') || 
      errMsg.includes('503') || 
      errMsg.includes('UNAVAILABLE') || 
      errorStr.includes('high demand') ||
      errMsg.includes('high demand')
    ) {
      userFriendlyError = '현재 인공지능 서버 요청이 너무 많아 일시적으로 사용이 어렵습니다. 10초 후에 다시 시도해 주세요.';
    } else if (errMsg) {
      userFriendlyError = `AI 분석 오류: ${errMsg}`;
    }
    
    res.status(500).json({ error: userFriendlyError });
  }
});

// Configure Vite middleware in development
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

setupServer();
