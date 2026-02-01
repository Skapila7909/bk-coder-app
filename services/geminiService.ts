import { GoogleGenAI, Type } from "@google/genai";
import { Problem, SubmissionResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = 'gemini-3-flash-preview';

/**
 * Generates a Python coding problem based on a prompt/topic.
 */
export const generateProblem = async (topic: string, difficulty: string): Promise<Problem> => {
  const prompt = `Generate a unique Python coding challenge about "${topic}" with difficulty "${difficulty}".
  Provide a title, description, some visible test cases, and some hidden edge cases.
  Also provide starter code function definition.
  `;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          starterCode: { type: Type.STRING },
          testCases: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                input: { type: Type.STRING },
                expectedOutput: { type: Type.STRING },
                isHidden: { type: Type.BOOLEAN }
              }
            }
          }
        },
        required: ["title", "description", "starterCode", "testCases"]
      }
    }
  });

  const data = JSON.parse(response.text || "{}");
  
  return {
    id: crypto.randomUUID(),
    title: data.title,
    description: data.description,
    difficulty: difficulty as 'Easy' | 'Medium' | 'Hard',
    testCases: data.testCases,
    starterCode: data.starterCode,
    timeLimit: 30
  };
};

/**
 * Simulates executing the code to provide output for the user.
 * DOES NOT Grade logic anymore.
 */
export const runCodeSimulation = async (
  code: string, 
  problem: Problem
): Promise<SubmissionResult> => {
  
  const testCaseStr = JSON.stringify(problem.testCases.filter(tc => !tc.isHidden));
  
  const prompt = `
    You are a Python Code Executor.
    
    PROBLEM: ${problem.title}
    USER CODE:
    ${code}
    
    TEST CASES (Visible): ${testCaseStr}

    TASK:
    1. Simulate running the USER CODE against the visible TEST CASES.
    2. Provide the output (stdout) or error messages.
    3. Do NOT grade the code. Just show what happens when it runs.
    
    Return JSON with 'output'.
  `;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          output: { type: Type.STRING, description: "Simulated output of the code execution" },
        }
      }
    }
  });

  const result = JSON.parse(response.text || "{}");

  return {
    output: result.output || "No output generated.",
    executionTime: `${(Math.random() * 0.5).toFixed(3)}s`
  };
};