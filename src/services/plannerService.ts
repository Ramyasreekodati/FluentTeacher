import { GoogleGenAI, Type } from "@google/genai";
import { CURRICULUM } from "../data/curriculum";
import { EXERCISES } from "../data/exercises";
import { DailyPlan } from "../types";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiInstance;
}

export async function generateDailyPlan(
  userId: string,
  level: string,
  currentLessonIndex: number,
  currentExerciseIndex: number,
  lastAssessmentSkill: string
): Promise<DailyPlan> {
  const ai = getAI();
  const lesson = CURRICULUM[currentLessonIndex % CURRICULUM.length];
  const exercise = EXERCISES[currentExerciseIndex % EXERCISES.length];
  
  const assessmentSkills = ["Grammar", "Speaking", "Reading", "Writing"];
  const lastIndex = assessmentSkills.indexOf(lastAssessmentSkill);
  const nextSkill = assessmentSkills[(lastIndex + 1) % assessmentSkills.length];

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a structured daily learning plan for a user at ${level} level.
    The current lesson is: ${lesson.title} (${lesson.description}).
    The current exercise is: ${exercise.title}.
    The next assessment skill is: ${nextSkill}.
    
    Create a dynamic AI Topic Module that is relevant to the user's level and the current lesson's theme.
    The topic module should have a title, focus, and 3-4 content blocks (short paragraphs or lists).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topic: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              focus: { type: Type.STRING },
              level: { type: Type.STRING },
              content_blocks: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["title", "focus", "level", "content_blocks"]
          },
          assessment: {
            type: Type.OBJECT,
            properties: {
              goal: { type: Type.STRING }
            },
            required: ["goal"]
          }
        },
        required: ["topic", "assessment"]
      }
    }
  });

  const aiData = JSON.parse(response.text);

  return {
    userId,
    day: Math.floor(Date.now() / (1000 * 60 * 60 * 24)), // Simple day count
    learning: {
      lesson_id: lesson.id,
      title: lesson.title
    },
    topic: {
      ...aiData.topic,
      level: level // Ensure level matches
    },
    exercise: {
      exercise_id: exercise.id,
      type: exercise.type,
      source: "book"
    },
    assessment: {
      type: nextSkill,
      goal: aiData.assessment.goal
    },
    completed: {
      learning: false,
      topic: false,
      exercise: false,
      assessment: false
    }
  };
}
