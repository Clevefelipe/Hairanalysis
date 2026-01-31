import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { loginSalon } from "../services/authApi";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from =
    (location.state as any)?.from?.pathname || "/dashboard";

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");

  async function handleLogin() {
    try {
      const token = await loginSalon(email, senha);
      login(token);
      navigate(from, { replace: true });
    } catch {
      setError("Email ou senha inválidos");
    }
  }

  return (
    <div style={{ maxWidth: "400px", margin: "80px auto" }}>
      <Card title="Acesso do Sistema">
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginBottom: "8px" }}
        />

        <input
          placeholder="Senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          style={{ width: "100%", marginBottom: "8px" }}
        />

        {error && (
          <p style={{ color: "red", marginBottom: 8 }}>
            {error}
          </p>
        )}

        <Button variant="primary" onClick={handleLogin}>
          Entrar
        </Button>
      </Card>
    </div>
  );
}
