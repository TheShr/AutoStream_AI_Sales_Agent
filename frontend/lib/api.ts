const API_BASE = 'http://localhost:8000';

export type ConfigurePayload = {
  tenant_id: string;
  business_name: string;
  description: string;
  tone: string;
  pricing: unknown[];
  faqs: unknown[];
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

export async function configureTenant(payload: ConfigurePayload) {
  const response = await fetch(`${API_BASE}/configure`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Unable to configure tenant.');
  }

  return response.json();
}

export async function sendMessage(tenant_id: string, user_id: string, message: string) {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tenant_id, user_id, message }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Chat request failed.');
  }

  return response.json() as Promise<ChatResponse>;
}

export async function fetchLeads(tenant_id: string) {
  const response = await fetch(`${API_BASE}/leads?tenant_id=${encodeURIComponent(tenant_id)}`);

  if (!response.ok) {
    throw new Error('Unable to load leads.');
  }

  return response.json() as Promise<Lead[]>;
}
