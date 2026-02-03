export type VisionAnalysisType = "CAPILAR" | "TRICOLOGICA";

export interface VisionRecord {
  id: string;
  salonId: string;
  analysisType: VisionAnalysisType;

  imageBase64: string;
  annotationBase64?: string;
  findings: string[];

  createdAt: number;
}
