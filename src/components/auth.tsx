import axios from 'axios';

const api = "https://estacionamentoapi2025.vercel.app";

export async function login(email: string, senha: string): Promise<string | null> {
  try {
    const response = await axios.post(`${api}/login`, { email, senha });
    if (response.status === 200 && response.data.token) {
      localStorage.setItem('token', response.data.token);
      return response.data.token;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export function logout() {
  localStorage.removeItem('token');
  window.location.href = "/estacionamento-web-2025/"
}

export async function isAuthenticated(): Promise<boolean> {
  const token = localStorage.getItem('token');
  if (!token) return false;
  try {
    const response = await axios.post(`${api}/logado`, { token });
    if (response.status === 200 && response.data.valid === true) return true;
    else {
      localStorage.removeItem('token');
      return false;
    }
  } catch (error) {
    return false;
  }
}
