// Problem generator interface — extensible to other math problem types

export interface Problem {
  a: number;
  b: number;
  question: string;
  answer: number;
  key: string; // unique key for adaptive tracking, e.g. "mul:3:7"
  type: string;
}

export interface ProblemGenerator {
  type: string;
  label: string;
  generate(a: number, b: number): Problem;
  allKeys(maxNum: number): string[];
}

export const multiplicationGenerator: ProblemGenerator = {
  type: 'multiplication',
  label: 'Times Tables',

  generate(a: number, b: number): Problem {
    return {
      a,
      b,
      question: `${a} × ${b}`,
      answer: a * b,
      key: `mul:${Math.min(a, b)}:${Math.max(a, b)}`,
      type: 'multiplication',
    };
  },

  allKeys(maxNum: number): string[] {
    const keys: string[] = [];
    for (let a = 1; a <= maxNum; a++) {
      for (let b = a; b <= maxNum; b++) {
        keys.push(`mul:${a}:${b}`);
      }
    }
    return keys;
  },
};

export function parseProblemKey(key: string): { type: string; a: number; b: number } {
  const [type, aStr, bStr] = key.split(':');
  return { type, a: parseInt(aStr), b: parseInt(bStr) };
}

export function generateFromKey(key: string): Problem {
  const { a, b } = parseProblemKey(key);
  return multiplicationGenerator.generate(a, b);
}

export const generators: Record<string, ProblemGenerator> = {
  multiplication: multiplicationGenerator,
};
