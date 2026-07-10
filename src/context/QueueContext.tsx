'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// ==========================================
// TYPES
// ==========================================
export type UserRole = 'Super Admin' | 'Organization Admin' | 'Staff';
export type OrgStatus = 'Pending Verification' | 'Active' | 'Suspended' | 'Rejected';
export type TokenStatus = 'Waiting' | 'Serving' | 'Completed' | 'Skipped';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId?: string;
  token: string;
}

export interface Organization {
  id: string;
  name: string;
  businessType: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  status: OrgStatus;
  qrCodeUrl: string;
  logoUrl?: string;
  subscriptionPlan?: string;
  paymentStatus?: string;
  trialStatus?: string;
  subscriptionExpiry?: string;
  createdAt: string;
  totalTokens?: number;
}

export interface QueueToken {
  id: string;
  organizationId: string;
  tokenNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  purpose?: string;
  status: TokenStatus;
  sequence: number;
  createdAt: string;
}

export interface DashboardMetrics {
  todayQueue: number;
  currentToken: string;
  waitingCustomers: number;
  completedCustomers: number;
  skippedCustomers: number;
  avgWaitingTime: number;
  isQueuePaused: boolean;
}

export interface BusinessSettings {
  organizationId: string;
  avgServiceTime: number;
  isPaused: boolean;
}

interface QueueContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;

  organizations: Organization[];
  tokens: QueueToken[];
  dashboard: DashboardMetrics | null;
  settings: Record<string, BusinessSettings>;

  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;

  registerOrganization: (orgData: {
    name: string; businessType: string; ownerName: string; email: string; phone: string;
    businessAddress: string; password: string; registrationDocUrl?: string; identityProofUrl?: string;
  }) => Promise<{ ok: boolean; message?: string; organization?: any }>;

  fetchOrganizations: () => Promise<void>;
  approveOrganization: (id: string) => Promise<void>;
  rejectOrganization: (id: string) => Promise<void>;
  suspendOrganization: (id: string) => Promise<void>;
  activateOrganization: (id: string) => Promise<void>;

  fetchDashboard: (orgId: string) => Promise<void>;
  fetchTokens: (orgId: string) => Promise<void>;
  nextCustomer: (orgId: string) => Promise<void>;
  skipCustomer: (orgId: string) => Promise<void>;
  recallCustomer: (orgId: string, tokenId: string) => Promise<void>;
  toggleQueuePause: (orgId: string, currentlyPaused: boolean) => Promise<void>;
  updateAvgServiceTime: (orgId: string, minutes: number) => Promise<void>;
  updateBusinessProfile: (orgId: string, name: string, phone: string, address: string, logoUrl?: string) => Promise<void>;

  bookToken: (orgId: string, name: string, phone: string, email?: string, purpose?: string) => Promise<QueueToken | null>;
  trackToken: (tokenId: string) => Promise<any>;
  searchTokens: (query: string) => Promise<(QueueToken & { organizationName: string })[]>;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

// ==========================================
// MAPPING HELPERS (backend snake_case -> frontend camelCase)
// ==========================================
const mapOrg = (o: any): Organization => ({
  id: o.id,
  name: o.name,
  businessType: o.business_type,
  ownerName: o.owner_name,
  email: o.email,
  phone: o.phone,
  address: o.business_address,
  status: o.status,
  qrCodeUrl: o.qr_code_url || '',
  logoUrl: o.logo_url,
  subscriptionPlan: o.subscription_plan,
  paymentStatus: o.payment_status,
  trialStatus: o.trial_status,
  subscriptionExpiry: o.subscription_expiry,
  createdAt: o.created_at,
  totalTokens: o.total_tokens ? parseInt(o.total_tokens) : undefined,
});

const mapToken = (t: any): QueueToken => ({
  id: t.id,
  organizationId: t.organization_id,
  tokenNumber: t.token_number,
  customerName: t.customer_name,
  customerPhone: t.customer_phone,
  customerEmail: t.customer_email,
  purpose: t.purpose_of_visit,
  status: t.status,
  sequence: t.sequence_number,
  createdAt: t.created_at,
});

// ==========================================
// PROVIDER
// ==========================================
export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [tokens, setTokens] = useState<QueueToken[]>([]);
  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null);
  const [settings, setSettings] = useState<Record<string, BusinessSettings>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load saved session on first mount
  useEffect(() => {
    const savedUser = localStorage.getItem('qflow_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('qflow_user');
      }
    }
    setLoading(false);
  }, []);

  // Generic API call helper
  const apiFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    if (currentUser?.token) {
      headers['Authorization'] = `Bearer ${currentUser.token}`;
    }

    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data;
  }, [currentUser]);

  // ---------- AUTH ----------
  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const user: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        organizationId: data.user.organizationId,
        token: data.token,
      };
      setCurrentUser(user);
      localStorage.setItem('qflow_user', JSON.stringify(user));
      return { ok: true };
    } catch (e: any) {
      setError(e.message);
      return { ok: false, message: e.message };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setOrganizations([]);
    setTokens([]);
    setDashboard(null);
    localStorage.removeItem('qflow_user');
  };

  const registerOrganization: QueueContextType['registerOrganization'] = async (orgData) => {
    try {
      setError(null);
      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(orgData),
      });
      return { ok: true, message: data.message, organization: data.organization };
    } catch (e: any) {
      setError(e.message);
      return { ok: false, message: e.message };
    }
  };

  // ---------- SUPER ADMIN ----------
  const fetchOrganizations = async () => {
    try {
      setError(null);
      const data = await apiFetch('/api/superadmin/organizations');
      setOrganizations(data.map(mapOrg));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const updateOrgStatus = async (id: string, status: OrgStatus) => {
    try {
      setError(null);
      await apiFetch(`/api/superadmin/organizations/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await fetchOrganizations();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const approveOrganization = (id: string) => updateOrgStatus(id, 'Active');
  const rejectOrganization = (id: string) => updateOrgStatus(id, 'Rejected');
  const suspendOrganization = (id: string) => updateOrgStatus(id, 'Suspended');
  const activateOrganization = (id: string) => updateOrgStatus(id, 'Active');

  // ---------- ORGANIZATION ADMIN ----------
  const fetchDashboard = async (orgId: string) => {
    try {
      setError(null);
      const data = await apiFetch(`/api/organizations/${orgId}/dashboard`);
      setDashboard(data);
      setSettings(prev => ({
        ...prev,
        [orgId]: { organizationId: orgId, avgServiceTime: 15, isPaused: data.isQueuePaused },
      }));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const fetchTokens = async (orgId: string) => {
    try {
      setError(null);
      const data = await apiFetch(`/api/organizations/${orgId}/queue/tokens`);
      setTokens(data.map(mapToken));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const nextCustomer = async (orgId: string) => {
    try {
      setError(null);
      await apiFetch(`/api/organizations/${orgId}/queue/next`, { method: 'POST' });
      await Promise.all([fetchDashboard(orgId), fetchTokens(orgId)]);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const skipCustomer = async (orgId: string) => {
    try {
      setError(null);
      await apiFetch(`/api/organizations/${orgId}/queue/skip`, { method: 'POST' });
      await Promise.all([fetchDashboard(orgId), fetchTokens(orgId)]);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const recallCustomer = async (orgId: string, tokenId: string) => {
    try {
      setError(null);
      await apiFetch(`/api/organizations/${orgId}/queue/${tokenId}/recall`, { method: 'POST' });
    } catch (e: any) {
      setError(e.message);
    }
  };

  const toggleQueuePause = async (orgId: string, currentlyPaused: boolean) => {
    try {
      setError(null);
      await apiFetch(`/api/organizations/${orgId}/settings`, {
        method: 'PATCH',
        body: JSON.stringify({ isQueuePaused: !currentlyPaused }),
      });
      await fetchDashboard(orgId);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const updateAvgServiceTime = async (orgId: string, minutes: number) => {
    try {
      setError(null);
      await apiFetch(`/api/organizations/${orgId}/settings`, {
        method: 'PATCH',
        body: JSON.stringify({ avgServiceTimeMinutes: minutes }),
      });
      setSettings(prev => ({
        ...prev,
        [orgId]: { ...(prev[orgId] || { organizationId: orgId, isPaused: false }), avgServiceTime: minutes },
      }));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const updateBusinessProfile = async (orgId: string, name: string, phone: string, address: string, logoUrl?: string) => {
    try {
      setError(null);
      await apiFetch(`/api/organizations/${orgId}/profile`, {
        method: 'PATCH',
        body: JSON.stringify({ name, phone, businessAddress: address, logoUrl }),
      });
    } catch (e: any) {
      setError(e.message);
    }
  };

  // ---------- PUBLIC / CUSTOMER ----------
  const bookToken = async (orgId: string, name: string, phone: string, email?: string, purpose?: string) => {
    try {
      setError(null);
      const data = await apiFetch(`/api/public/queue/${orgId}/book`, {
        method: 'POST',
        body: JSON.stringify({ name, phone, email, purpose }),
      });
      return mapToken(data);
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  };

  const trackToken = async (tokenId: string) => {
    try {
      setError(null);
      return await apiFetch(`/api/public/tokens/${tokenId}/track`);
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  };

  const searchTokens = async (query: string) => {
    try {
      setError(null);
      const data = await apiFetch(`/api/public/search?query=${encodeURIComponent(query)}`);
      return data.map((t: any) => ({ ...mapToken(t), organizationName: t.org_name }));
    } catch (e: any) {
      setError(e.message);
      return [];
    }
  };

  return (
    <QueueContext.Provider
      value={{
        currentUser,
        loading,
        error,
        organizations,
        tokens,
        dashboard,
        settings,
        login,
        logout,
        registerOrganization,
        fetchOrganizations,
        approveOrganization,
        rejectOrganization,
        suspendOrganization,
        activateOrganization,
        fetchDashboard,
        fetchTokens,
        nextCustomer,
        skipCustomer,
        recallCustomer,
        toggleQueuePause,
        updateAvgServiceTime,
        updateBusinessProfile,
        bookToken,
        trackToken,
        searchTokens,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (context === undefined) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};
