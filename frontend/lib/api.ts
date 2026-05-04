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
  tenant_id: string;
  user_id: string;
  response: string;
  intent: string;
  sentiment: string;
  lead_captured: boolean;
  turn_count: number;
  extracted_entities?: {
    intent: string;
    sentiment: string;
    lead_name: string;
    lead_email: string;
    lead_platform: string;
    collection_step: string;
  };
  test_mode?: boolean;
};

export type Lead = {
  lead_id: string;
  name: string;
  email: string;
  phone: string;
  platform: string;
  user_id: string;
  intent: string;
  score: 'hot' | 'warm' | 'cold';
  status: 'new' | 'contacted' | 'qualified' | 'closed' | 'lost';
  notes: string;
  timestamp: string;
  updated_at: string;
};

export type WidgetConfig = {
  tenant_id: string;
  theme: string;
  business_name: string;
  welcome_message: string;
};

export type FeedbackPayload = {
  tenant_id: string;
  message: string;
  response: string;
  rating: 1 | -1;
};

export type ApiKeyResponse = {
  tenant_id: string;
  api_key: string;
  created_at: string;
};

export type LeadUpdatePayload = {
  status?: 'new' | 'contacted' | 'qualified' | 'closed' | 'lost';
  notes?: string;
};

export type WebhookPayload = {
  url: string;
  events: string[];
};

export type Webhook = {
  webhook_id: string;
  tenant_id: string;
  url: string;
  events: string[];
  created_at: string;
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
  testMode: boolean = false,
  apiKey?: string,
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ tenant_id, user_id, message, test_mode: testMode }),
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
    return { tenant_id, user_id, response: trimmed, intent: '', sentiment: 'neutral', lead_captured: false, turn_count: 0 };
  }
}

export async function fetchLeads(tenant_id: string) {
  const response = await fetch(`${API_BASE}/leads?tenant_id=${encodeURIComponent(tenant_id)}`);

  if (!response.ok) {
    return handleResponseError(response, 'Unable to load leads.');
  }

  const data = await response.json();
  return data.leads as Lead[];
}

export async function updateLead(tenant_id: string, lead_id: string, updates: LeadUpdatePayload) {
  const response = await fetch(`${API_BASE}/leads/${lead_id}?tenant_id=${encodeURIComponent(tenant_id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    return handleResponseError(response, 'Unable to update lead.');
  }

  return response.json();
}

export async function getWidgetConfig(tenant_id: string) {
  const response = await fetch(`${API_BASE}/widget/config?tenant_id=${encodeURIComponent(tenant_id)}`);

  if (!response.ok) {
    return handleResponseError(response, 'Unable to load widget config.');
  }

  return response.json() as Promise<WidgetConfig>;
}

export async function submitFeedback(payload: FeedbackPayload) {
  const response = await fetch(`${API_BASE}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return handleResponseError(response, 'Unable to submit feedback.');
  }

  return response.json();
}

export async function getApiKey(tenant_id: string) {
  const response = await fetch(`${API_BASE}/api-keys?tenant_id=${encodeURIComponent(tenant_id)}`);

  if (!response.ok) {
    return handleResponseError(response, 'Unable to load API key.');
  }

  return response.json() as Promise<ApiKeyResponse>;
}

export async function regenerateApiKey(tenant_id: string) {
  const response = await fetch(`${API_BASE}/api-keys?tenant_id=${encodeURIComponent(tenant_id)}`, {
    method: 'POST',
  });

  if (!response.ok) {
    return handleResponseError(response, 'Unable to regenerate API key.');
  }

  return response.json() as Promise<ApiKeyResponse>;
}

export async function createWebhook(tenant_id: string, payload: WebhookPayload) {
  const response = await fetch(`${API_BASE}/webhooks?tenant_id=${encodeURIComponent(tenant_id)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return handleResponseError(response, 'Unable to create webhook.');
  }

  return response.json();
}

export async function getWebhooks(tenant_id: string) {
  const response = await fetch(`${API_BASE}/webhooks?tenant_id=${encodeURIComponent(tenant_id)}`);

  if (!response.ok) {
    return handleResponseError(response, 'Unable to load webhooks.');
  }

  const data = await response.json();
  return data.webhooks as Webhook[];
}

export async function deleteWebhook(tenant_id: string, webhook_id: string) {
  const response = await fetch(`${API_BASE}/webhooks/${webhook_id}?tenant_id=${encodeURIComponent(tenant_id)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    return handleResponseError(response, 'Unable to delete webhook.');
  }

  return response.json();
}
