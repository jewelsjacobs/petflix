import { GenerationProgress } from './VideoTypes';

export class SingleProgressTracker {
  private currentProgress: GenerationProgress;
  private onProgressCallback: (progress: number) => void;

  constructor(onProgress: (progress: number) => void = () => {}) {
    this.currentProgress = {
      stage: 'initializing',
      overallProgress: 0
    };
    this.onProgressCallback = onProgress;
  }

  update(stage: GenerationProgress['stage'], progressOverride?: number, message?: string): void {
    this.currentProgress = {
      stage,
      overallProgress: progressOverride !== undefined ? progressOverride : this.currentProgress.overallProgress,
      message: message || this.currentProgress.message
    };

    if (progressOverride !== undefined) {
      this.onProgressCallback(progressOverride);
    }
  }

  getCurrentProgress(): GenerationProgress {
    return { ...this.currentProgress };
  }
}

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