import { GenerationProgress } from './VideoTypes';

export class NarrativeProgressTracker {
  private currentProgress: number = 0;
  private onProgressCallback: (progress: GenerationProgress) => void;

  constructor(onProgress: (progress: GenerationProgress) => void = () => {}) {
    this.onProgressCallback = onProgress;
  }

  update(
    stage: GenerationProgress['stage'], 
    currentClip?: number, 
    totalClips?: number, 
    message?: string, 
    stageProgress?: number
  ): void {
    let calculatedProgress = 0;
    const initContribution = 0.05;
    const generationContribution = 0.75;
    const stitchingContribution = 0.20;

    if (stage === 'initializing') {
      calculatedProgress = (stageProgress || 0) * initContribution;
    } else if (stage === 'generating' && typeof currentClip === 'number' && typeof totalClips === 'number' && totalClips > 0) {
      const baseProgressForGeneration = initContribution;
      const progressWithinCurrentClip = stageProgress || 0;
      const completedClipsProgress = ((currentClip - 1) / totalClips) * generationContribution;
      const currentClipSubProgress = (progressWithinCurrentClip / totalClips) * generationContribution;
      calculatedProgress = baseProgressForGeneration + completedClipsProgress + currentClipSubProgress;
    } else if (stage === 'stitching') {
      const baseProgressForStitching = initContribution + generationContribution;
      calculatedProgress = baseProgressForStitching + ((stageProgress || 0) * stitchingContribution);
    } else if (stage === 'complete') {
      calculatedProgress = 1;
    } else if (stage === 'error') {
      calculatedProgress = this.currentProgress;
    }

    this.currentProgress = Math.min(1, Math.max(0, calculatedProgress));

    this.onProgressCallback({
      stage,
      currentClip,
      totalClips,
      overallProgress: this.currentProgress,
      message: message || stage.charAt(0).toUpperCase() + stage.slice(1),
    });
  }

  getCurrentProgress(): number {
    return this.currentProgress;
  }
} 