export interface AIAnalysisResponse {
  analysis?: {
    general_condition?: {
      technical_summary?: string;
      client_friendly_explanation?: string;
      impact_on_procedures?: string;
    };
  };

  straightening_aptitude?: {
    verdict?: 'APTO' | 'APTO_COM_RESTRICOES' | 'NAO_APTO';
    technical_justification?: string;
    risk_alert?: string | null;
  };

  personalized_straightening_protocol?: {
    compatible_services?: Array<{
      service_id: string;
      service_name: string;
      compatibility_level: string;
      justification: string;
      attention_points?: string[];
    }>;
  };

  in_salon_care?: {
    before_procedure?: string[];
    after_procedure?: string[];
  };

  home_care?: {
    objective?: string;
    four_week_schedule?: Record<string, string>;
    alerts?: string[];
  };

  follow_up?: {
    recommended_return_interval?: string;
    revaluation_suggestion?: string;
    early_return_alerts?: string[];
  };
}
