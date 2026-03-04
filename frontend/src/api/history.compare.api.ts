// frontend/src/api/history.compare.api.ts

import axios from 'axios';

export async function compareHistory(baseId: string, targetId: string) {
  const response = await axios.get('/history/compare', {
    params: { baseId, targetId },
  });

  return response.data;
}
