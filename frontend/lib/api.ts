const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export type ConfigurePayload = {
  tenant_id: string;
  business_name: string;
  description: string;
  tone: string;
  pricing: Array<{ plan: string; price: string; features?: string[] }>;
  faqs: Array<{ question: string; answer: string }>;
};

export type ChatResponse = {
  message: string;
};

export type Lead = {
  name: string;
  email: string;
  platform: string;
  timestamp: string;
};

const handleResponseError = async (response: Response, fallback: string) => {
  const payload = await response.text();
  const errorText = payload || fallback;
  throw new Error(errorText);
};

export async function configureTenant(payload: ConfigurePayload) {
  const response = await fetch(`${API_BASE}/configure`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return handleResponseError(response, 'Unable to configure tenant.');
  }

  return response.json();
}

export async function sendMessage(
  tenant_id: string,
  user_id: string,
  message: string,
  onProgress?: (partial: string) => void,
) {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tenant_id, user_id, message }),
  });

  if (!response.ok) {
    return handleResponseError(response, 'Chat request failed.');
  }

  if (!response.body) {
    const payload = await response.json();
    return payload as ChatResponse;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let completed = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    completed += chunk;
    if (onProgress) {
      onProgress(completed);
    }
  }

  const trimmed = completed.trim();
  try {
    const parsed = JSON.parse(trimmed);
    return parsed as ChatResponse;
  } catch {
    return { message: trimmed };
  }
}

export async function fetchLeads(tenant_id: string) {
  const response = await fetch(`${API_BASE}/leads?tenant_id=${encodeURIComponent(tenant_id)}`);

  if (!response.ok) {
    return handleResponseError(response, 'Unable to load leads.');
  }

  return response.json() as Promise<Lead[]>;
}
