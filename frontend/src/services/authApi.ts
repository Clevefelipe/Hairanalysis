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
