'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// ==========================================
// TYPES
// ==========================================
export type UserRole = 'Super Admin' | 'Organization Admin' | 'Staff';
export type OrgStatus = 'Pending Verification' | 'Active' | 'Suspended' | 'Rejected';
export type TokenStatus = 'Waiting' | 'Serving' | 'Completed' | 'Skipped' | 'Cancelled' | 'Expired';

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
  purposeCategory?: string;
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
  aiPredictedServiceTime?: number;
  isAiPredicted?: boolean;
  predictionSampleSize?: number;
}

export interface BusinessSettings {
  organizationId: string;
  avgServiceTime: number;
  isPaused: boolean;
}

export interface Department {
  id: string;
  name: string;
  avgServiceTime?: number;
  isPaused: boolean;
}

export interface PublicOrgInfo {
  id: string;
  name: string;
  businessType: string;
  address: string;
  logoUrl?: string;
  status: OrgStatus;
  isQueuePaused: boolean;
  currentToken: string;
  waitingCount: number;
  departments: Department[];
}

export interface PlatformAnalytics {
  totalOrgs: number;
  activeOrgs: number;
  pendingOrgs: number;
  totalTokens: number;
  dailyCustomers: number;
}

export interface PublicDepartment {
  id: string;
  name: string;
  isPaused: boolean;
  waitingCount: number;
}

interface QueueContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;

  organizations: Organization[];
  analytics: PlatformAnalytics | null;
  tokens: QueueToken[];
  dashboard: DashboardMetrics | null;
  settings: Record<string, BusinessSettings>;

  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ ok: boolean; message?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ ok: boolean; message?: string }>;

  registerOrganization: (orgData: {
    name: string; businessType: string; ownerName: string; email: string; phone: string;
    businessAddress: string; password: string; registrationDocUrl?: string; identityProofUrl?: string;
  }) => Promise<{ ok: boolean; message?: string; organization?: any }>;

  fetchOrganizations: () => Promise<void>;
  fetchOrgDocuments: (orgId: string) => Promise<{ documentType: string; fileUrl: string }[]>;
  fetchAnalytics: () => Promise<void>;
  fetchPurposeCategories: (orgId: string) => Promise<{ category: string; count: number }[]>;
  approveOrganization: (id: string) => Promise<void>;
  rejectOrganization: (id: string) => Promise<void>;
  suspendOrganization: (id: string) => Promise<void>;
  activateOrganization: (id: string) => Promise<void>;

  fetchDashboard: (orgId: string, deptId?: string) => Promise<void>;
  fetchOwnOrgProfile: (orgId: string) => Promise<Organization | null>;
  fetchTokens: (orgId: string, deptId?: string) => Promise<void>;
  fetchCustomerHistory: (orgId: string, filters?: { search?: string; startDate?: string; endDate?: string; status?: string; page?: number; limit?: number }) => Promise<{ tokens: QueueToken[]; total: number; page: number; limit: number }>;
  nextCustomer: (orgId: string, deptId?: string) => Promise<void>;
  skipCustomer: (orgId: string, deptId?: string) => Promise<void>;
  recallCustomer: (orgId: string, tokenId: string) => Promise<void>;
  toggleQueuePause: (orgId: string, currentlyPaused: boolean) => Promise<void>;
  updateAvgServiceTime: (orgId: string, minutes: number) => Promise<void>;
  updateBusinessProfile: (orgId: string, name: string, phone: string, address: string, logoUrl?: string) => Promise<void>;
  updateSubscription: (orgId: string, subscriptionPlan: string, paymentStatus: string, trialStatus: string, subscriptionExpiry: string) => Promise<void>;

  fetchDepartments: (orgId: string) => Promise<Department[]>;
  createDepartment: (orgId: string, name: string, avgServiceTimeMinutes?: number) => Promise<{ ok: boolean; message?: string }>;
  updateDepartment: (orgId: string, deptId: string, updates: { name?: string; avgServiceTimeMinutes?: number; isPaused?: boolean }) => Promise<{ ok: boolean; message?: string }>;
  deleteDepartment: (orgId: string, deptId: string) => Promise<{ ok: boolean; message?: string }>;
  createPaymentOrder: (plan: string) => Promise<{ ok: boolean; orderId?: string; amount?: number; currency?: string; keyId?: string; message?: string }>;
  verifyPayment: (razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string, plan: string) => Promise<{ ok: boolean; message?: string }>;

  bookToken: (orgId: string, name: string, phone: string, email?: string, purpose?: string, deptId?: string) => Promise<{ ok: boolean; token?: QueueToken; message?: string }>;
  trackToken: (tokenId: string) => Promise<any>;
  cancelToken: (tokenId: string) => Promise<{ ok: boolean; message?: string }>;
  fetchPublicOrgInfo: (orgId: string, deptId?: string) => Promise<PublicOrgInfo | null>;
  fetchPublicDepartments: (orgId: string) => Promise<PublicDepartment[]>;
  sendChatMessage: (orgId: string, message: string, history: { role: 'user' | 'assistant'; content: string }[]) => Promise<{ ok: boolean; reply?: string; message?: string }>;
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
  purposeCategory: t.purpose_category,
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
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
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

  const forgotPassword = async (email: string) => {
    try {
      setError(null);
      const data = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      return { ok: true, message: data.message };
    } catch (e: any) {
      setError(e.message);
      return { ok: false, message: e.message };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      setError(null);
      const data = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });
      return { ok: true, message: data.message };
    } catch (e: any) {
      setError(e.message);
      return { ok: false, message: e.message };
    }
  };

  const registerOrganization: QueueContextType['registerOrganization'] = async (orgData) => {
    try {
      setError(null);
      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(orgData),
      });
      if (data.token && data.user) {
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
      }
      return { ok: true, message: data.message, organization: data.organization };
    } catch (e: any) {
      setError(e.message);
      return { ok: false, message: e.message };
    }
  };

  const createPaymentOrder = async (plan: string) => {
    try {
      setError(null);
      const data = await apiFetch('/api/payment/create-order', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      });
      return { ok: true, orderId: data.orderId, amount: data.amount, currency: data.currency, keyId: data.keyId };
    } catch (e: any) {
      setError(e.message);
      return { ok: false, message: e.message };
    }
  };

  const verifyPayment = async (razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string, plan: string) => {
    try {
      setError(null);
      await apiFetch('/api/payment/verify', {
        method: 'POST',
        body: JSON.stringify({
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
          plan,
        }),
      });
      return { ok: true };
    } catch (e: any) {
      setError(e.message);
      return { ok: false, message: e.message };
    }
  };

  const updateSubscription = async (
    orgId: string, subscriptionPlan: string, paymentStatus: string, trialStatus: string, subscriptionExpiry: string
  ) => {
    try {
      setError(null);
      await apiFetch(`/api/organizations/${orgId}/subscription`, {
        method: 'PATCH',
        body: JSON.stringify({ subscriptionPlan, paymentStatus, trialStatus, subscriptionExpiry }),
      });
    } catch (e: any) {
      setError(e.message);
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

  const fetchOrgDocuments = async (orgId: string) => {
    try {
      setError(null);
      const data = await apiFetch(`/api/superadmin/organizations/${orgId}/documents`);
      return data.map((d: any) => ({ documentType: d.document_type, fileUrl: d.file_url }));
    } catch (e: any) {
      setError(e.message);
      return [];
    }
  };

  const fetchAnalytics = async () => {
    try {
      setError(null);
      const data = await apiFetch('/api/superadmin/analytics');
      setAnalytics({
        totalOrgs: parseInt(data.total_orgs) || 0,
        activeOrgs: parseInt(data.active_orgs) || 0,
        pendingOrgs: parseInt(data.pending_orgs) || 0,
        totalTokens: parseInt(data.total_tokens) || 0,
        dailyCustomers: parseInt(data.daily_customers) || 0,
      });
    } catch (e: any) {
      setError(e.message);
    }
  };

  const fetchPurposeCategories = async (orgId: string) => {
    try {
      setError(null);
      return await apiFetch(`/api/organizations/${orgId}/insights/purpose-categories`);
    } catch (e: any) {
      setError(e.message);
      return [];
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
  const fetchDashboard = async (orgId: string, deptId?: string) => {
    try {
      setError(null);
      const query = deptId ? `?deptId=${deptId}` : '';
      const data = await apiFetch(`/api/organizations/${orgId}/dashboard${query}`);
      setDashboard(data);
      setSettings(prev => ({
        ...prev,
        [orgId]: { organizationId: orgId, avgServiceTime: 15, isPaused: data.isQueuePaused },
      }));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const fetchOwnOrgProfile = async (orgId: string): Promise<Organization | null> => {
    try {
      setError(null);
      const data = await apiFetch(`/api/organizations/${orgId}/profile`);
      const org = mapOrg(data);
      setOrganizations(prev => {
        const others = prev.filter(o => o.id !== org.id);
        return [...others, org];
      });
      return org;
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  };

  const fetchTokens = async (orgId: string, deptId?: string) => {
    try {
      setError(null);
      const query = deptId ? `?deptId=${deptId}` : '';
      const data = await apiFetch(`/api/organizations/${orgId}/queue/tokens${query}`);
      setTokens(data.map(mapToken));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const fetchCustomerHistory: QueueContextType['fetchCustomerHistory'] = async (orgId, filters = {}) => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.status) params.set('status', filters.status);
      params.set('page', String(filters.page || 1));
      params.set('limit', String(filters.limit || 50));

      const data = await apiFetch(`/api/organizations/${orgId}/customers/history?${params.toString()}`);
      return {
        tokens: data.tokens.map(mapToken),
        total: data.total,
        page: data.page,
        limit: data.limit,
      };
    } catch (e: any) {
      setError(e.message);
      return { tokens: [], total: 0, page: 1, limit: 50 };
    }
  };

  const nextCustomer = async (orgId: string, deptId?: string) => {
    try {
      setError(null);
      await apiFetch(`/api/organizations/${orgId}/queue/next`, { method: 'POST', body: JSON.stringify({ deptId }) });
      await Promise.all([fetchDashboard(orgId, deptId), fetchTokens(orgId, deptId)]);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const skipCustomer = async (orgId: string, deptId?: string) => {
    try {
      setError(null);
      await apiFetch(`/api/organizations/${orgId}/queue/skip`, { method: 'POST', body: JSON.stringify({ deptId }) });
      await Promise.all([fetchDashboard(orgId, deptId), fetchTokens(orgId, deptId)]);
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

  const fetchDepartments = async (orgId: string): Promise<Department[]> => {
    try {
      setError(null);
      const data = await apiFetch(`/api/organizations/${orgId}/departments`);
      return data.map((d: any) => ({
        id: d.id,
        name: d.name,
        avgServiceTime: d.avg_service_time_minutes,
        isPaused: d.is_paused,
      }));
    } catch (e: any) {
      setError(e.message);
      return [];
    }
  };

  const createDepartment = async (orgId: string, name: string, avgServiceTimeMinutes?: number) => {
    try {
      setError(null);
      await apiFetch(`/api/organizations/${orgId}/departments`, {
        method: 'POST',
        body: JSON.stringify({ name, avgServiceTimeMinutes }),
      });
      return { ok: true };
    } catch (e: any) {
      setError(e.message);
      return { ok: false, message: e.message };
    }
  };

  const updateDepartment = async (orgId: string, deptId: string, updates: { name?: string; avgServiceTimeMinutes?: number; isPaused?: boolean }) => {
    try {
      setError(null);
      await apiFetch(`/api/organizations/${orgId}/departments/${deptId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      return { ok: true };
    } catch (e: any) {
      setError(e.message);
      return { ok: false, message: e.message };
    }
  };

  const deleteDepartment = async (orgId: string, deptId: string) => {
    try {
      setError(null);
      await apiFetch(`/api/organizations/${orgId}/departments/${deptId}`, { method: 'DELETE' });
      return { ok: true };
    } catch (e: any) {
      setError(e.message);
      return { ok: false, message: e.message };
    }
  };

  // ---------- PUBLIC / CUSTOMER ----------
  const bookToken = async (orgId: string, name: string, phone: string, email?: string, purpose?: string, deptId?: string) => {
    try {
      setError(null);
      const data = await apiFetch(`/api/public/queue/${orgId}/book`, {
        method: 'POST',
        body: JSON.stringify({ name, phone, email, purpose, departmentId: deptId }),
      });
      return { ok: true, token: mapToken(data) };
    } catch (e: any) {
      setError(e.message);
      return { ok: false, message: e.message };
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

  const cancelToken = async (tokenId: string) => {
    try {
      setError(null);
      const data = await apiFetch(`/api/public/tokens/${tokenId}/cancel`, { method: 'POST' });
      return { ok: true, message: data.message };
    } catch (e: any) {
      setError(e.message);
      return { ok: false, message: e.message };
    }
  };

  const fetchPublicOrgInfo = async (orgId: string, deptId?: string) => {
    try {
      setError(null);
      // This is a public endpoint, so we call fetch directly (no auth header needed)
      const query = deptId ? `?deptId=${deptId}` : '';
      const res = await fetch(`${API_URL}/api/public/organizations/${orgId}${query}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load organization');
      return data;
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  };

  const fetchPublicDepartments = async (orgId: string): Promise<PublicDepartment[]> => {
    try {
      const res = await fetch(`${API_URL}/api/public/organizations/${orgId}/departments`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load departments');
      return data.map((d: any) => ({
        id: d.id,
        name: d.name,
        isPaused: d.is_paused,
        waitingCount: parseInt(d.waiting_count) || 0,
      }));
    } catch (e: any) {
      return [];
    }
  };

  const sendChatMessage = async (
    orgId: string,
    message: string,
    history: { role: 'user' | 'assistant'; content: string }[]
  ) => {
    try {
      const res = await fetch(`${API_URL}/api/public/organizations/${orgId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get a response.');
      return { ok: true, reply: data.reply };
    } catch (e: any) {
      return { ok: false, message: e.message };
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
        analytics,
        tokens,
        dashboard,
        settings,
        login,
        logout,
        forgotPassword,
        resetPassword,
        registerOrganization,
        fetchOrganizations,
        fetchOrgDocuments,
        fetchAnalytics,
        fetchPurposeCategories,
        approveOrganization,
        rejectOrganization,
        suspendOrganization,
        activateOrganization,
        fetchDashboard,
        fetchOwnOrgProfile,
        fetchTokens,
        fetchCustomerHistory,
        nextCustomer,
        skipCustomer,
        recallCustomer,
        toggleQueuePause,
        updateAvgServiceTime,
        updateBusinessProfile,
        updateSubscription,
        fetchDepartments,
        createDepartment,
        updateDepartment,
        deleteDepartment,
        createPaymentOrder,
        verifyPayment,
        bookToken,
        trackToken,
        cancelToken,
        fetchPublicOrgInfo,
        fetchPublicDepartments,
        sendChatMessage,
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
