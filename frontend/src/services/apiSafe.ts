export type ApiResult<T> = {
  ok: boolean;
  data: T;
  error?: string;
};

export async function apiSafe<T>(
  request: () => Promise<any>,
  fallback: T
): Promise<ApiResult<T>> {
  try {
    const response = await request();

    if (response && typeof response.data !== "undefined") {
      return {
        ok: true,
        data: response.data as T,
      };
    }

    return {
      ok: true,
      data: fallback,
    };
  } catch (err: any) {

    if (err?.response?.status === 401) {
      // AuthContext já trata logout
      return {
        ok: false,
        data: fallback,
        error: "Sessão expirada",
      };
    }

    return {
      ok: false,
      data: fallback,
      error: "Erro ao comunicar com o servidor",
    };
  }
}
