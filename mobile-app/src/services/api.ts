import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// ─────────────────────────────────────────────────────────────
// AUTO-DETECT: Usa o IP do servidor Expo como base para a API
// Em dev, o Expo já sabe o IP da máquina na rede Wi-Fi.
// Fallback para localhost se não conseguir detetar.
// ─────────────────────────────────────────────────────────────
import { Platform } from 'react-native';

function getApiBaseUrl(): string {
  const fromEnv = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;
  if (fromEnv?.trim()) {
    return fromEnv.trim().replace(/\/$/, '');
  }

  if (Platform.OS === 'web') {
    return 'http://127.0.0.1:3000';
  }

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.manifest2?.extra?.expoGo?.debuggerHost as string | undefined) ??
    Constants.manifest?.debuggerHost;

  if (hostUri) {
    const host = hostUri.replace(/^https?:\/\//, '').split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:3000`;
    }
  }

  if (__DEV__) {
    console.warn(
      '[IPOCARD] Não foi possível detetar o IP do servidor. Defina EXPO_PUBLIC_API_URL=http://SEU_IP:3000 antes de npx expo start'
    );
  }

  return 'http://192.168.1.8:3000';
}

export const API_BASE_URL = getApiBaseUrl();

const TOKEN_KEY = '@ipocard_token';

// ── Token helpers ────────────────────────────────────────────

export const saveToken = async (token: string) => {
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const getToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(TOKEN_KEY);
};

export const clearToken = async () => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};

// ── HTTP helper ──────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Erro HTTP ${response.status}`);
    }

    return data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`O servidor demorou muito a responder. Verifique se o IP ${API_BASE_URL} está correto e se o backend está ligado.`);
    }
    throw error;
  }
}

// ════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════

export interface StudentLoginResponse {
  token: string;
  student: {
    id: string;
    name: string;
    studentNumber: string;
    classGroup: string;
    balance: number;
    photoUrl: string | null;
  };
}

export interface StaffLoginResponse {
  token: string;
  role: string;
  username: string;
}

export const loginStudent = (studentNumber: string, password: string) =>
  request<StudentLoginResponse>('/api/auth/login/student', {
    method: 'POST',
    body: JSON.stringify({ studentNumber, password }),
  });

export const loginStaff = (username: string, password: string) =>
  request<StaffLoginResponse>('/api/auth/login/staff', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

// ════════════════════════════════════════════════════════════
// ALUNO
// ════════════════════════════════════════════════════════════

export interface Purchase {
  id: string;
  totalAmount: number;
  items: any[];
  createdAt: string;
}

export interface Deposit {
  id: string;
  amount: number;
  receiptRef: string;
  receiptDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  studentNumber: string;
  classGroup: string;
  photoUrl: string | null;
  balance: number;
  createdAt: string;
}

export interface AlunoProfileResponse {
  student: StudentProfile;
  purchases: Purchase[];
  deposits: Deposit[];
}

export const getAlunoProfile = (id: string) =>
  request<AlunoProfileResponse>(`/api/aluno/profile/${id}`);

export const submitDeposit = (data: {
  studentId: string;
  amount: number;
  receiptRef: string;
  receiptDate: string;
}) =>
  request<{ message: string; deposit: Deposit }>('/api/aluno/deposits', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// ════════════════════════════════════════════════════════════
// CANTINA
// ════════════════════════════════════════════════════════════

export interface CantinaStudent {
  id: string;
  name: string;
  studentNumber: string;
  classGroup: string;
  photoUrl: string | null;
  balance: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface PurchaseItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export const scanStudent = (key: string) =>
  request<CantinaStudent>(`/api/cantina/students/scan?key=${encodeURIComponent(key)}`);

export const getProducts = () =>
  request<Product[]>('/api/cantina/products');

export const registerPurchase = (studentId: string, items: PurchaseItem[]) =>
  request<{ message: string; purchase: any; newBalance: number }>(
    '/api/cantina/purchases',
    {
      method: 'POST',
      body: JSON.stringify({ studentId, items }),
    }
  );
