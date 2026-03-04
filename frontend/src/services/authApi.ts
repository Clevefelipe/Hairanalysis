import api from "./api";

export async function loginSalon(
  email: string,
  password: string
): Promise<string> {
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  return response.data.access_token;
}

export async function listProfessionals(salonId: string) {
  const response = await api.get(`/auth/professionals/${salonId}` as const);
  return response.data ?? [];
}

export async function createProfessional(payload: {
  email: string;
  password: string;
  fullName?: string;
}, salonId: string) {
  const response = await api.post(`/auth/professionals/${salonId}` as const, payload);
  return response.data;
}

export async function updateProfessional(
  salonId: string,
  professionalId: string,
  payload: {
    email?: string;
    password?: string;
    fullName?: string;
  },
) {
  const response = await api.patch(
    `/auth/professionals/${salonId}/${professionalId}` as const,
    payload,
  );
  return response.data;
}

export async function deleteProfessional(salonId: string, professionalId: string) {
  const response = await api.delete(`/auth/professionals/${salonId}/${professionalId}` as const);
  return response.data;
}
