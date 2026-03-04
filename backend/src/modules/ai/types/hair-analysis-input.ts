export interface HairAnalysisInput {
  analysisType: 'capilar' | 'tricologica';

  tricoscopy: {
    density: number;
    thicknessMicra: number;
    grayHairPercent: number;
  };

  hairShaft: {
    porosity: 1 | 2 | 3 | 4 | 5;
    elasticity: 'baixa' | 'media' | 'alta';
    cuticleIntegrity: 'intacta' | 'irregular' | 'danificada';
  };

  chemicalHistory: {
    metals: boolean;
    previousRelaxation: string;
    coloration: string;
  };

  mainComplaint: string;
}
