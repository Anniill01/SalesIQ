
import { GoogleGenAI, Type } from "@google/genai";
import { SalesAnalysisResult, LiveTranscriptChunk, ProspectProfile, DealInteraction, FullDealAnalysis } from "../types";

// Helper to convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Helper to try and salvage truncated JSON
const safeJSONParse = (jsonString: string): any => {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.warn("JSON Parse failed, attempting to repair truncated JSON...");
    // Naive repair: Try to close open braces/brackets
    // This is a best-effort repair for demo purposes
    let repaired = jsonString.trim();
    const openBraces = (repaired.match(/{/g) || []).length;
    const closeBraces = (repaired.match(/}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/]/g) || []).length;

    for (let i = 0; i < (openBraces - closeBraces); i++) repaired += "}";
    for (let i = 0; i < (openBrackets - closeBrackets); i++) repaired += "]";
    
    try {
      return JSON.parse(repaired);
    } catch (e2) {
      console.error("Failed to repair JSON:", e2);
      throw new Error("Analysis generated too much data and was cut off. Please try a shorter audio file.");
    }
  }
};

// --- IMAGE GENERATION FOR AVATARS ---
const generateProspectAvatar = async (profile: ProspectProfile, apiKey: string): Promise<string | undefined> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    // Use gemini-2.5-flash-image for efficient generation
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{
          text: `Generate a flat, minimalist vector art avatar of a professional business person. 
                 Traits: ${profile.discType} personality, ${profile.communicationStyle} style. 
                 Expression should match a business setting. 
                 Use a solid, neutral background. High quality, professional headshot.`
        }]
      },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
  } catch (e) {
    console.warn("Avatar generation failed:", e);
    return undefined;
  }
  return undefined;
};

// --- FULL DEAL ANALYSIS (MULTI-MODAL) ---

export const analyzeFullDeal = async (interactions: DealInteraction[]): Promise<FullDealAnalysis> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  
  const ai = new GoogleGenAI({ apiKey });
  
  // Prepare contents: We need to load all files and convert them to parts
  const parts: any[] = [];
  
  // System Instruction Part
  parts.push({
    text: `You are a Chief Revenue Officer AI. 
           Your task is to analyze a complete "Deal Folder" containing multiple files (Sales calls, Emails, Proposals, Notes).
           
           GOAL: Reconstruct the entire customer journey, map stakeholders, predict the win probability, and provide a strategic action plan.
           
           CRITICAL INSTRUCTIONS:
           1. Correlate information across documents (e.g., if an email mentions a concern raised in a call).
           2. Construct a chronological timeline of the deal sentiment.
           3. Identify the "Buying Committee" by finding all names/roles mentioned across all files.
           4. Determine the Win Probability based on BANT (Budget, Authority, Need, Timeline) evidence found in the data.
           5. Perform a "Deal Health/QA" check to ensure standard sales process steps (e.g. NDA, Budget Confirmed) are met.
           6. Identify missed opportunities for cross-sell or better positioning.`
  });

  // Process Interactions
  for (const item of interactions) {
    if (item.file) {
      const base64 = await fileToBase64(item.file);
      parts.push({
        text: `--- START OF FILE: ${item.fileName} (${item.type}) ---`
      });
      parts.push({
        inlineData: {
          mimeType: item.file.type,
          data: base64
        }
      });
    } else if (item.content) {
      parts.push({
        text: `--- START OF ${item.type} (${item.date}) ---\n${item.content}`
      });
    }
  }

  try {
    // SWITCHED TO GEMINI 2.5 FLASH FOR SPEED
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: { parts },
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dealName: { type: Type.STRING, description: "Infer a name for this deal, e.g., 'Acme Corp Enterprise License'" },
            winProbability: {
               type: Type.OBJECT,
               properties: {
                 score: { type: Type.NUMBER },
                 label: { type: Type.STRING, enum: ["High Likelihood", "Medium Likelihood", "Low Likelihood"] },
                 rationale: { type: Type.STRING }
               }
            },
            journeyTimeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stage: { type: Type.STRING, description: "e.g. Discovery, Demo, Negotiation" },
                  date: { type: Type.STRING, description: "Approximate date/time relative to start" },
                  sentiment: { type: Type.STRING, enum: ["Positive", "Neutral", "Negative"] },
                  summary: { type: Type.STRING },
                  keySignal: { type: Type.STRING, description: "Key quote or event" }
                }
              }
            },
            stakeholders: {
               type: Type.ARRAY,
               items: {
                  type: Type.OBJECT,
                  properties: {
                      role: { type: Type.STRING, enum: ["Decision Maker", "Influencer", "End User", "Blocker", "Unknown"] },
                      nameOrReference: { type: Type.STRING },
                      sentiment: { type: Type.STRING, enum: ["Positive", "Neutral", "Negative"] }
                  }
               }
            },
            allObjections: {
               type: Type.ARRAY,
               items: {
                  type: Type.OBJECT,
                  properties: {
                     objection: { type: Type.STRING },
                     status: { type: Type.STRING, enum: ["Resolved", "Open"] },
                     strategy: { type: Type.STRING, description: "How to handle if open, or how it was resolved" }
                  }
               }
            },
            actionPlan: {
               type: Type.OBJECT,
               properties: {
                 nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
                 risksToMitigate: { type: Type.ARRAY, items: { type: Type.STRING } },
                 upsellOpportunities: { type: Type.ARRAY, items: { type: Type.STRING } }
               }
            },
            overallSentimentTrend: { type: Type.STRING, enum: ["Improving", "Declining", "Stable"] },
            executiveSummary: { type: Type.STRING },
            missedOpportunities: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "List strategic opportunities the rep missed across the deal history."
            },
            keyMoments: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "List the 'Best Moments' or turning points where the rep succeeded." 
            },
            dealHealthChecks: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        check: { type: Type.STRING, description: "e.g. 'Decision Maker Access', 'Budget Approved', 'Competitor Analysis'" },
                        status: { type: Type.STRING, enum: ["Pass", "Fail", "Warning"] },
                        details: { type: Type.STRING }
                    }
                }
            },
            coachingInsights: {
                type: Type.OBJECT,
                properties: {
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    improvementAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
                    keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            },
            keyQuestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Strategic questions the rep should have asked or did ask well." },
            closingSuggestions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        strategy: { type: Type.STRING },
                        rationale: { type: Type.STRING }
                    }
                }
            },
            consolidatedScript: { 
                type: Type.STRING, 
                description: "A chronological 'script' or summary of the most critical dialogue/exchanges across all interactions." 
            }
          }
        }
      }
    });

    const json = safeJSONParse(response.text || "{}");
    return json as FullDealAnalysis;

  } catch (err: any) {
    console.error("Deal Analysis Error:", err);
    throw new Error("Deal analysis failed. Try fewer files or check API key.");
  }
};


// --- SINGLE CALL ANALYSIS ---

export const analyzeSalesCall = async (audioFile: File): Promise<SalesAnalysisResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey });
  const base64Audio = await fileToBase64(audioFile);

  // Fallback if type is missing or not specific enough
  const mimeType = audioFile.type || 'audio/mp3'; 

  const prompt = `
    You are an Enterprise Sales Ops & Intelligence Engine. Analyze this sales call audio.
    
    IMPORTANT: 
    1. Output strictly valid JSON.
    2. BE CONCISE. Do not be overly verbose in the transcript if the call is long.
    
    Tasks:
    1. **Transcript & Sentiment**: 
       - Generate a **Condensed Smart Transcript**. Focus on key dialogue exchanges, questions, and answers. Summarize filler or repetitive sections to save space.
       - Diarize text (Salesperson vs Prospect).
       - **OBJECTIONS**: Identify objection segments.
    
    2. **Quantitative Metrics**:
       - Estimate Talk Ratio, Interruptions, Listening Ratio, WPM.
       - **Silence Analysis**: Identify 'Smart Silence' vs 'Awkward Silence'.
    
    3. **Key Topics Detected**: Extract 5-7 distinct BUSINESS topics.

    4. **Deal Intelligence**: 
       - **Buyer Intent**: Classify signals.
       - **Predicted Outcome**: Win probability based on BANT.

    5. **Coaching (DEEP & SPECIFIC)**: 
       - Strengths, Missed Opportunities, Key Questions, Key Objections.
       - **Sales Pitch**: Assess Hook, Clarity, CTA.
    
    6. **Compliance**: Check for forbidden phrases.
    7. **Customer Profile**: DiSC analysis.
    8. **Follow Up**: Draft a follow up email.

    Return strictly JSON matching the schema.
  `;

  try {
    // SWITCHED TO GEMINI 2.5 FLASH FOR SPEED & TOKEN EFFICIENCY
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          { text: prompt }
        ]
      },
      config: {
        temperature: 0.1,        
        // Remove explicit maxOutputTokens to rely on model default or set a safe high limit if needed.
        // gemini-2.5-flash usually handles large context well, but we want to avoid cutting off JSON.
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  speaker: { type: Type.STRING, enum: ["Salesperson", "Prospect"] },
                  text: { type: Type.STRING },
                  timestamp: { type: Type.STRING },
                  isObjection: { type: Type.BOOLEAN },
                  objectionHandlingFeedback: { type: Type.STRING }
                }
              }
            },
            sentimentGraph: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timeOffset: { type: Type.NUMBER },
                  label: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  insight: { type: Type.STRING }
                }
              }
            },
            coachingCard: {
              type: Type.OBJECT,
              properties: {
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                missedOpportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                overallSummary: { type: Type.STRING },
                keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
                nextActions: { type: Type.ARRAY, items: { type: Type.STRING } },
                keyQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                objectionsHandled: { type: Type.ARRAY, items: { type: Type.STRING } },
                salesPitchAssessment: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    clarity: { type: Type.STRING },
                    hook: { type: Type.STRING },
                    callToAction: { type: Type.STRING }
                  }
                },
                closingSuggestions: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT,
                    properties: {
                      strategy: { type: Type.STRING },
                      rationale: { type: Type.STRING }
                    }
                  } 
                },
                improvementAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
                predictedOutcome: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    label: { type: Type.STRING, enum: ["High Likelihood", "Medium Likelihood", "Low Likelihood"] },
                    rationale: { type: Type.STRING }
                  }
                }
              }
            },
            callStats: {
              type: Type.OBJECT,
              properties: {
                wpm: { type: Type.NUMBER },
                interruptions: { type: Type.NUMBER },
                longestMonologue: { type: Type.NUMBER },
                patienceScore: { type: Type.NUMBER },
                duration: { type: Type.STRING },
                callScore: { type: Type.NUMBER },
                scoreBreakdown: {
                  type: Type.OBJECT,
                  properties: {
                    talkRatioContribution: { type: Type.NUMBER },
                    patienceContribution: { type: Type.NUMBER },
                    sentimentContribution: { type: Type.NUMBER },
                    interruptionsContribution: { type: Type.NUMBER }
                  }
                }
              }
            },
            talkRatio: {
              type: Type.OBJECT,
              properties: {
                sales: { type: Type.NUMBER },
                prospect: { type: Type.NUMBER }
              }
            },
            topics: {
              type: Type.ARRAY,
              items: {
                  type: Type.OBJECT,
                  properties: {
                      name: { type: Type.STRING },
                      relevance: { type: Type.NUMBER },
                      description: { type: Type.STRING }
                  }
              }
            },
            competitors: {
              type: Type.ARRAY,
              items: {
                  type: Type.OBJECT,
                  properties: {
                      name: { type: Type.STRING },
                      mentionCount: { type: Type.NUMBER },
                      context: { type: Type.STRING },
                      suggestedRebuttal: { type: Type.STRING }
                  }
              }
            },
            dealIntelligence: {
              type: Type.OBJECT,
              properties: {
                  riskAnalysis: {
                      type: Type.OBJECT,
                      properties: {
                          riskScore: { type: Type.NUMBER },
                          riskLevel: { type: Type.STRING, enum: ["Critical", "High", "Medium", "Low"] },
                          riskFactors: { type: Type.ARRAY, items: { type: Type.STRING } }
                      }
                  },
                  buyingCommittee: {
                      type: Type.ARRAY,
                      items: {
                          type: Type.OBJECT,
                          properties: {
                              role: { type: Type.STRING, enum: ["Decision Maker", "Influencer", "End User", "Blocker", "Unknown"] },
                              nameOrReference: { type: Type.STRING },
                              sentiment: { type: Type.STRING, enum: ["Positive", "Neutral", "Negative"] }
                          }
                      }
                  },
                  dealStage: {
                      type: Type.OBJECT,
                      properties: {
                          currentStage: { type: Type.STRING },
                          recommendedStage: { type: Type.STRING },
                          justification: { type: Type.STRING }
                      }
                  },
                  intents: {
                      type: Type.ARRAY,
                      items: {
                          type: Type.OBJECT,
                          properties: {
                              category: { type: Type.STRING, enum: ["Buying", "Pricing", "Timeline", "Feature Fit", "Risk"] },
                              score: { type: Type.NUMBER },
                              evidence: { type: Type.STRING }
                          }
                      }
                  }
              }
            },
            silenceAnalysis: {
              type: Type.OBJECT,
              properties: {
                listeningRatio: { type: Type.NUMBER },
                smartSilenceCount: { type: Type.NUMBER },
                awkwardSilenceCount: { type: Type.NUMBER },
                explanation: { type: Type.STRING }
              }
            },
            compliance: {
              type: Type.OBJECT,
              properties: {
                complianceScore: { type: Type.NUMBER },
                forbiddenPhrasesDetected: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      phrase: { type: Type.STRING },
                      context: { type: Type.STRING },
                      severity: { type: Type.STRING, enum: ["Critical", "Warning"] },
                      correction: { type: Type.STRING }
                    }
                  }
                },
                requiredStatements: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      statement: { type: Type.STRING },
                      status: { type: Type.STRING, enum: ["Present", "Missing"] }
                    }
                  }
                }
              }
            },
            customerProfile: {
              type: Type.OBJECT,
              properties: {
                discType: { type: Type.STRING, enum: ["Dominance", "Influence", "Steadiness", "Conscientiousness"] },
                communicationStyle: { type: Type.STRING },
                sellingTips: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            followUp: {
              type: Type.OBJECT,
              properties: {
                emailSubject: { type: Type.STRING },
                emailBody: { type: Type.STRING },
                agendaItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                emailVariations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      tone: { type: Type.STRING, enum: ["Professional", "Friendly", "Urgent"] },
                      subject: { type: Type.STRING },
                      body: { type: Type.STRING }
                    }
                  }
                },
                proposalBullets: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini.");

    try {
      const json = safeJSONParse(text) as SalesAnalysisResult;
      
      // Chain Multimodal Capability
      // Once we have the text profile, generate an Avatar Image for the prospect
      if (json.customerProfile) {
         const avatarBase64 = await generateProspectAvatar(json.customerProfile, apiKey);
         if (avatarBase64) {
           json.customerProfile.avatarBase64 = avatarBase64;
         }
      }

      return json;
    } catch (error) {
      console.error("Failed to parse JSON response:", text);
      throw new Error("Invalid JSON response from AI model.");
    }
  } catch (err: any) {
    console.error("Call Analysis Error:", err);
    throw new Error(err.message || "Call analysis failed. Please check your API key or try a shorter audio file.");
  }
};

// --- AUDIO UTILS FOR LIVE API ---

export const blobToPCM = async (blob: Blob): Promise<Int16Array> => {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const float32Data = audioBuffer.getChannelData(0);
    
    // Downsample or convert Float32 to Int16
    const int16Data = new Int16Array(float32Data.length);
    for (let i = 0; i < float32Data.length; i++) {
        const s = Math.max(-1, Math.min(1, float32Data[i]));
        int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Data;
};

export const b64ToUint8Array = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

export const float32ToInt16 = (float32: Float32Array): Int16Array => {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16;
};
