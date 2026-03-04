import axios from 'axios';

// Função para buscar datasets do Kaggle via backend
export async function fetchKaggleDatasets(query) {
  try {
    const response = await axios.get(`/api/kaggle/datasets?query=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    return [];
  }
}

// Alias para compatibilidade com imports existentes
export const getKaggleDatasets = fetchKaggleDatasets;
