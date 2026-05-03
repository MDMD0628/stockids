import { analyzeTextWithHeuristics } from "../../../../packages/shared/src/analysisHeuristics";
import type { AnalysisResponse } from "../../../../packages/shared/src/collectorTypes";

export type ExpressionAnalyzer = {
  analyze(text: string): Promise<AnalysisResponse>;
};

const mockAnalyzer: ExpressionAnalyzer = {
  async analyze(text) {
    return analyzeTextWithHeuristics(text);
  },
};

export type AnalyzerEnv = {
  EXPRESSION_AI_MODE?: "mock";
};

export const createAnalyzer = (_env: AnalyzerEnv): ExpressionAnalyzer => {
  return mockAnalyzer;
};

export const analyzeExpressions = async (
  text: string,
  analyzer: ExpressionAnalyzer,
) => analyzer.analyze(text);
