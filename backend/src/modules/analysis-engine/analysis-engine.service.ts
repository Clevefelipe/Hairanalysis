import { Injectable } from '@nestjs/common';
import { calculateAptitudeClassification } from './aptitude.engine';
import { WEIGHT_PROFILE_VERSION } from './analysis-engine.constants';
import { calculateConfidence } from './confidence.engine';
import { calculateFiberIntegrityScore } from './fiber-score.engine';
import { calculateRiskLevels } from './risk.engine';
import {
  AnalysisMode,
  type AnalysisInput,
  type AnalysisResult,
} from './analysis-engine.types';

export function calculateAnalysisResult(input: AnalysisInput): AnalysisResult {
  const mode = input.mode || AnalysisMode.CAPILAR;
  const { score, profileId } = calculateFiberIntegrityScore(input);
  const risk = calculateRiskLevels(input);
  const confidence = calculateConfidence(input);

  const aptitude = calculateAptitudeClassification({
    score,
    confidence,
    mode,
    scalpRiskIndex: risk.scalpRiskIndex,
  });

  return {
    score,
    risk,
    riskIndex: risk.overallIndex,
    aptitude: aptitude.aptitude,
    aptitudeLabel: aptitude.aptitudeLabel,
    aptitudeMessage: aptitude.aptitudeMessage,
    confidence,
    canSuggestStraightening: aptitude.canSuggestStraightening,
    weightProfileId: profileId,
    weightProfileVersion: WEIGHT_PROFILE_VERSION,
  };
}

@Injectable()
export class AnalysisEngineService {
  calculateAnalysisResult(input: AnalysisInput): AnalysisResult {
    return calculateAnalysisResult(input);
  }
}
