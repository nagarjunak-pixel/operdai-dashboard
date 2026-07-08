/**
 * OperdAI Dashboard API Client
 * Connects the React dashboard to the FastAPI backend.
 */

const API_BASE = 'http://localhost:8000/api/v1';

// ─── Token Storage ──────────────────────────────────────────
let accessToken = localStorage.getItem('operdai_token') || null;
let refreshToken = localStorage.getItem('operdai_refresh') || null;

export function setTokens(access, refresh) {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('operdai_token', access);
  localStorage.setItem('operdai_refresh', refresh);
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('operdai_token');
  localStorage.removeItem('operdai_refresh');
}

export function isAuthenticated() {
  return !!accessToken;
}

// ─── Fetch Helper ───────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && refreshToken) {
    // Try refresh
    const refreshOk = await refreshAccessToken();
    if (refreshOk) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      return fetch(`${API_BASE}${path}`, { ...options, headers });
    }
    clearTokens();
    window.location.reload();
    return null;
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// ─── Auth ───────────────────────────────────────────────────
export async function login(email, password) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data) {
    setTokens(data.access_token, data.refresh_token);
  }
  return data;
}

export async function register(userData) {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  if (data) {
    setTokens(data.access_token, data.refresh_token);
  }
  return data;
}

export async function refreshAccessToken() {
  if (!refreshToken) return false;
  try {
    const data = await apiFetch('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (data) {
      setTokens(data.access_token, data.refresh_token);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export async function getCurrentUser() {
  return apiFetch('/auth/me');
}

// ─── Dashboard Stats ────────────────────────────────────────
export async function getDashboardStats(clientId) {
  const params = clientId ? `?client_id=${clientId}` : '';
  return apiFetch(`/dashboard/stats${params}`);
}

// ─── Leads ──────────────────────────────────────────────────
export async function listLeads(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/leads?${qs}`);
}

export async function getLead(leadId) {
  return apiFetch(`/leads/${leadId}`);
}

export async function updateLeadStatus(leadId, status) {
  return apiFetch(`/leads/${leadId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function getLeadStats(clientId) {
  const params = clientId ? `?client_id=${clientId}` : '';
  return apiFetch(`/leads/stats/summary${params}`);
}

// ─── Conversations ──────────────────────────────────────────
export async function getConversation(conversationId) {
  return apiFetch(`/conversations/${conversationId}`);
}

export async function getConversationMessages(conversationId) {
  return apiFetch(`/conversations/${conversationId}/messages`);
}

export async function sendManualMessage(conversationId, content) {
  return apiFetch(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function listConversations(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/conversations?${qs}`);
}

// ─── Escalations ────────────────────────────────────────────
export async function listEscalations(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/escalations?${qs}`);
}

export async function resolveEscalation(runId, action, editedMessage = null) {
  return apiFetch(`/escalations/${runId}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ action, edited_message: editedMessage }),
  });
}

export async function getEscalationStats(clientId) {
  const params = clientId ? `?client_id=${clientId}` : '';
  return apiFetch(`/escalations/stats${params}`);
}

// ─── Agent Runs (Traces) ────────────────────────────────────
export async function listAgentRuns(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/agent-runs?${qs}`);
}

export async function getAgentRun(runId) {
  return apiFetch(`/agent-runs/${runId}`);
}

export async function replayAgentRun(runId) {
  return apiFetch(`/agent-runs/${runId}/replay`);
}

// ─── Knowledge Base ─────────────────────────────────────────
export async function listKbDocuments(clientId) {
  return apiFetch(`/kb/client/${clientId}`);
}

export async function createKbDocument(clientId, data) {
  return apiFetch(`/kb/client/${clientId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateKbDocument(docId, data) {
  return apiFetch(`/kb/${docId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteKbDocument(docId) {
  return apiFetch(`/kb/${docId}`, { method: 'DELETE' });
}

// ─── Clients ────────────────────────────────────────────────
export async function listClients() {
  return apiFetch('/clients');
}

export async function getClient(clientId) {
  return apiFetch(`/clients/${clientId}`);
}

export async function createClient(data) {
  return apiFetch('/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateClient(clientId, data) {
  return apiFetch(`/clients/${clientId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function updateAutonomy(clientId, data) {
  return apiFetch(`/clients/${clientId}/autonomy`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function toggleKillSwitch(clientId, activate) {
  return apiFetch(`/clients/${clientId}/kill-switch`, {
    method: activate ? 'POST' : 'DELETE',
  });
}

export async function toggleShadowMode(clientId) {
  return apiFetch(`/clients/${clientId}/shadow-mode`, {
    method: 'PATCH',
  });
}

// ─── Billing ────────────────────────────────────────────────
export async function getBillingUsage() {
  return apiFetch('/billing/usage');
}

// ─── Health ─────────────────────────────────────────────────
export async function checkHealth() {
  return apiFetch('/health');
}

// ─── Agencies ───────────────────────────────────────────────
export async function getBranding(agencySlug) {
  return apiFetch(`/branding/${agencySlug}`);
}

export async function listAgencies() {
  return apiFetch('/agencies');
}

export async function createAgency(data) {
  return apiFetch('/agencies', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
