'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Types Definitions
export type UserRole = 'Super Admin' | 'Organization Admin' | 'Customer';
export type OrgStatus = 'Pending' | 'Approved' | 'Rejected' | 'Active' | 'Suspended';
export type TokenStatus = 'Waiting' | 'Serving' | 'Completed' | 'Skipped';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId?: string; // Links to registered org if Org Admin
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
  registrationDoc?: string;
  identityProof?: string;
  subscriptionPlan?: 'Starter' | 'Professional' | 'Enterprise';
  paymentStatus?: 'Paid' | 'Unpaid' | 'Failed';
  trialStatus?: 'Active' | 'Expired' | 'None';
  subscriptionExpiry?: string;
  createdAt: string;
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

export interface SMSLog {
  id: string;
  organizationId: string;
  organizationName: string;
  customerName: string;
  customerPhone: string;
  tokenNumber: string;
  message: string;
  type: '5_ahead' | '2_ahead' | 'current_turn';
  sentAt: string;
}

export interface BusinessSettings {
  organizationId: string;
  avgServiceTime: number; // in minutes
  isPaused: boolean;
}

interface QueueContextType {
  currentUser: User | null;
  organizations: Organization[];
  tokens: QueueToken[];
  smsLogs: SMSLog[];
  settings: Record<string, BusinessSettings>; // orgId -> settings
  login: (email: string, role: UserRole, orgId?: string) => Promise<boolean>;
  logout: () => void;
  registerOrganization: (orgData: Omit<Organization, 'id' | 'status' | 'qrCodeUrl' | 'createdAt'>) => Promise<Organization>;
  approveOrganization: (id: string) => void;
  rejectOrganization: (id: string) => void;
  suspendOrganization: (id: string) => void;
  activateOrganization: (id: string) => void;
  bookToken: (orgId: string, name: string, phone: string, email?: string, purpose?: string) => QueueToken;
  nextCustomer: (orgId: string) => void;
  completeCustomer: (orgId: string, tokenId: string) => void;
  skipCustomer: (orgId: string, tokenId: string) => void;
  recallCustomer: (orgId: string, tokenId: string) => void;
  toggleQueuePause: (orgId: string) => void;
  updateAvgServiceTime: (orgId: string, minutes: number) => void;
  updateBusinessProfile: (orgId: string, name: string, phone: string, address: string, logoUrl?: string) => void;
  updateSubscription: (
    orgId: string, 
    plan: 'Starter' | 'Professional' | 'Enterprise', 
    paymentStatus: 'Paid' | 'Unpaid' | 'Failed', 
    trialStatus: 'Active' | 'Expired' | 'None', 
    expiryDate: string
  ) => void;
  searchTokens: (query: string) => (QueueToken & { organizationName: string })[];
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

// Initial Mock Organizations
const DEFAULT_ORGANIZATIONS: Organization[] = [
  {
    id: 'org-hosp-1',
    name: 'City General Hospital',
    businessType: 'Hospital',
    ownerName: 'Dr. Sarah Jenkins',
    email: 'admin@cityhospital.org',
    phone: '+1 555-0199',
    address: '450 Medical Center Pkwy, Sector 4',
    status: 'Approved',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=http://localhost:3000/queue/org-hosp-1',
    logoUrl: '🏥',
    subscriptionPlan: 'Professional',
    paymentStatus: 'Paid',
    trialStatus: 'None',
    subscriptionExpiry: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2026-07-01T08:00:00.000Z'
  },
  {
    id: 'org-bank-1',
    name: 'Apex Alliance Bank',
    businessType: 'Bank',
    ownerName: 'Robert Vance',
    email: 'admin@apexalliance.com',
    phone: '+1 555-0120',
    address: '100 Financial Square, Suite A',
    status: 'Approved',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=http://localhost:3000/queue/org-bank-1',
    logoUrl: '💼',
    subscriptionPlan: 'Enterprise',
    paymentStatus: 'Paid',
    trialStatus: 'None',
    subscriptionExpiry: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2026-07-02T10:30:00.000Z'
  },
  {
    id: 'org-salon-1',
    name: 'Glow Premium Salon & Spa',
    businessType: 'Salon',
    ownerName: 'Elena Rostova',
    email: 'elena@glowsalon.com',
    phone: '+1 555-0177',
    address: '88 Beauty Blvd, Promenade Shops',
    status: 'Approved',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=http://localhost:3000/queue/org-salon-1',
    logoUrl: '✨',
    subscriptionPlan: 'Starter',
    paymentStatus: 'Paid',
    trialStatus: 'None',
    subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2026-07-03T11:00:00.000Z'
  },
  {
    id: 'org-pharm-1',
    name: 'QuickCare Pharmacy',
    businessType: 'Pharmacy',
    ownerName: 'Marcus Aurelius',
    email: 'contact@quickcarepharmacy.com',
    phone: '+1 555-0188',
    address: '12 Health St, Medical District',
    status: 'Pending',
    qrCodeUrl: '',
    logoUrl: '💊',
    subscriptionPlan: 'Professional',
    paymentStatus: 'Unpaid',
    trialStatus: 'Active',
    subscriptionExpiry: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2026-07-07T14:00:00.000Z'
  },
  {
    id: 'org-retail-1',
    name: 'MegaMart Supermarket',
    businessType: 'Supermarket',
    ownerName: 'Clarence Thomas',
    email: 'clarence@megamart.com',
    phone: '+1 555-0999',
    address: '900 Hypermarket Pkwy',
    status: 'Rejected',
    qrCodeUrl: '',
    logoUrl: '🛒',
    subscriptionPlan: 'Starter',
    paymentStatus: 'Failed',
    trialStatus: 'Expired',
    subscriptionExpiry: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2026-07-05T09:00:00.000Z'
  }
];

// Seed Tokens for Active Organizations
const DEFAULT_TOKENS: QueueToken[] = [
  // Hospital Queue
  { id: 't-h-1', organizationId: 'org-hosp-1', tokenNumber: 'H001', customerName: 'Alice Miller', customerPhone: '+1 555-0101', purpose: 'Consultation', status: 'Completed', sequence: 1, createdAt: '2026-07-08T08:05:00.000Z' },
  { id: 't-h-2', organizationId: 'org-hosp-1', tokenNumber: 'H002', customerName: 'Brian Davies', customerPhone: '+1 555-0102', purpose: 'X-Ray Report', status: 'Completed', sequence: 2, createdAt: '2026-07-08T08:12:00.000Z' },
  { id: 't-h-3', organizationId: 'org-hosp-1', tokenNumber: 'H003', customerName: 'Clara Oswald', customerPhone: '+1 555-0103', purpose: 'Emergency Consultation', status: 'Serving', sequence: 3, createdAt: '2026-07-08T08:18:00.000Z' },
  { id: 't-h-4', organizationId: 'org-hosp-1', tokenNumber: 'H004', customerName: 'Daniel Craig', customerPhone: '+1 555-0104', purpose: 'Dermatology visit', status: 'Waiting', sequence: 4, createdAt: '2026-07-08T08:22:00.000Z' },
  { id: 't-h-5', organizationId: 'org-hosp-1', tokenNumber: 'H005', customerName: 'Eva Green', customerPhone: '+1 555-0105', purpose: 'Pediatric checkup', status: 'Waiting', sequence: 5, createdAt: '2026-07-08T08:25:00.000Z' },
  { id: 't-h-6', organizationId: 'org-hosp-1', tokenNumber: 'H006', customerName: 'Frank Sinatra', customerPhone: '+1 555-0106', purpose: 'General Checkup', status: 'Waiting', sequence: 6, createdAt: '2026-07-08T08:30:00.000Z' },
  { id: 't-h-7', organizationId: 'org-hosp-1', tokenNumber: 'H007', customerName: 'Grace Kelly', customerPhone: '+1 555-0107', purpose: 'General Checkup', status: 'Waiting', sequence: 7, createdAt: '2026-07-08T08:32:00.000Z' },
  { id: 't-h-8', organizationId: 'org-hosp-1', tokenNumber: 'H008', customerName: 'Harry Potter', customerPhone: '+1 555-0108', purpose: 'Routine blood test', status: 'Waiting', sequence: 8, createdAt: '2026-07-08T08:35:00.000Z' },

  // Bank Queue
  { id: 't-b-1', organizationId: 'org-bank-1', tokenNumber: 'B001', customerName: 'James Bond', customerPhone: '+1 555-0700', purpose: 'Cash Withdrawal', status: 'Serving', sequence: 1, createdAt: '2026-07-08T09:00:00.000Z' },
  { id: 't-b-2', organizationId: 'org-bank-1', tokenNumber: 'B002', customerName: 'Kate Middleton', customerPhone: '+1 555-0701', purpose: 'New Account Opening', status: 'Waiting', sequence: 2, createdAt: '2026-07-08T09:05:00.000Z' },
  { id: 't-b-3', organizationId: 'org-bank-1', tokenNumber: 'B003', customerName: 'Leo Messi', customerPhone: '+1 555-0702', purpose: 'Loan consultation', status: 'Waiting', sequence: 3, createdAt: '2026-07-08T09:12:00.000Z' }
];

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>(DEFAULT_ORGANIZATIONS);
  const [tokens, setTokens] = useState<QueueToken[]>(DEFAULT_TOKENS);
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
  const [settings, setSettings] = useState<Record<string, BusinessSettings>>({
    'org-hosp-1': { organizationId: 'org-hosp-1', avgServiceTime: 12, isPaused: false },
    'org-bank-1': { organizationId: 'org-bank-1', avgServiceTime: 8, isPaused: false },
    'org-salon-1': { organizationId: 'org-salon-1', avgServiceTime: 30, isPaused: false },
    'org-pharm-1': { organizationId: 'org-pharm-1', avgServiceTime: 5, isPaused: false }
  });

  // Load from local storage if available
  useEffect(() => {
    const savedOrgs = localStorage.getItem('qflow_organizations');
    const savedTokens = localStorage.getItem('qflow_tokens');
    const savedSms = localStorage.getItem('qflow_sms_logs');
    const savedSettings = localStorage.getItem('qflow_settings');
    const savedUser = localStorage.getItem('qflow_user');

    if (savedOrgs) {
      try {
        const parsed = JSON.parse(savedOrgs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOrganizations(parsed);
        } else {
          setOrganizations(DEFAULT_ORGANIZATIONS);
        }
      } catch (e) {
        setOrganizations(DEFAULT_ORGANIZATIONS);
      }
    } else {
      setOrganizations(DEFAULT_ORGANIZATIONS);
    }

    if (savedTokens) {
      try {
        const parsed = JSON.parse(savedTokens);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTokens(parsed);
        } else {
          setTokens(DEFAULT_TOKENS);
        }
      } catch (e) {
        setTokens(DEFAULT_TOKENS);
      }
    } else {
      setTokens(DEFAULT_TOKENS);
    }

    if (savedSms) {
      try {
        const parsed = JSON.parse(savedSms);
        if (Array.isArray(parsed)) setSmsLogs(parsed);
      } catch (e) {}
    }

    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed && Object.keys(parsed).length > 0) {
          setSettings(parsed);
        }
      } catch (e) {}
    }

    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {}
    }
  }, []);

  // Save changes to local storage helper
  const saveState = (orgs: Organization[], tks: QueueToken[], sms: SMSLog[], setts: Record<string, BusinessSettings>) => {
    localStorage.setItem('qflow_organizations', JSON.stringify(orgs));
    localStorage.setItem('qflow_tokens', JSON.stringify(tks));
    localStorage.setItem('qflow_sms_logs', JSON.stringify(sms));
    localStorage.setItem('qflow_settings', JSON.stringify(setts));
  };

  // Auth Operations
  const login = async (email: string, role: UserRole, orgId?: string): Promise<boolean> => {
    // Basic simulation
    let userObj: User = {
      id: role === 'Super Admin' ? 'super-admin-id' : `admin-${orgId || 'new'}`,
      email,
      name: role === 'Super Admin' ? 'Platform Director' : 'Business Operator',
      role,
      organizationId: orgId
    };
    setCurrentUser(userObj);
    localStorage.setItem('qflow_user', JSON.stringify(userObj));
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('qflow_user');
  };

  // Register New Tenant
  // Register New Tenant
  const registerOrganization = async (orgData: Omit<Organization, 'id' | 'status' | 'qrCodeUrl' | 'createdAt'>): Promise<Organization> => {
    // Generate a temporary registration reference ID
    const tempId = `temp-reg-${Math.random().toString(36).substr(2, 9)}`;
    const newOrg: Organization = {
      ...orgData,
      id: tempId,
      status: 'Pending',
      qrCodeUrl: '',
      subscriptionPlan: orgData.subscriptionPlan || 'Starter',
      paymentStatus: orgData.paymentStatus || 'Unpaid',
      trialStatus: orgData.trialStatus || 'Active',
      subscriptionExpiry: orgData.subscriptionExpiry || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    };

    const updatedOrgs = [...organizations, newOrg];
    const updatedSettings = {
      ...settings,
      [tempId]: { organizationId: tempId, avgServiceTime: 15, isPaused: false }
    };

    setOrganizations(updatedOrgs);
    setSettings(updatedSettings);
    saveState(updatedOrgs, tokens, smsLogs, updatedSettings);

    return newOrg;
  };

  // Super Admin actions
  const approveOrganization = (id: string) => {
    const uniqueOrgId = `org-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const updated = organizations.map(o => {
      if (o.id === id) {
        return {
          ...o,
          id: uniqueOrgId,
          status: 'Approved' as OrgStatus,
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=http://localhost:3000/queue/${uniqueOrgId}`
        };
      }
      return o;
    });

    const updatedSettings = { ...settings };
    if (updatedSettings[id]) {
      updatedSettings[uniqueOrgId] = {
        organizationId: uniqueOrgId,
        avgServiceTime: updatedSettings[id].avgServiceTime,
        isPaused: updatedSettings[id].isPaused
      };
      delete updatedSettings[id];
    } else {
      updatedSettings[uniqueOrgId] = {
        organizationId: uniqueOrgId,
        avgServiceTime: 15,
        isPaused: false
      };
    }

    setOrganizations(updated);
    setSettings(updatedSettings);
    saveState(updated, tokens, smsLogs, updatedSettings);
  };

  const rejectOrganization = (id: string) => {
    const updated = organizations.map(o => o.id === id ? { ...o, status: 'Rejected' as OrgStatus } : o);
    setOrganizations(updated);
    saveState(updated, tokens, smsLogs, settings);
  };

  const suspendOrganization = (id: string) => {
    const updated = organizations.map(o => o.id === id ? { ...o, status: 'Suspended' as OrgStatus } : o);
    setOrganizations(updated);
    saveState(updated, tokens, smsLogs, settings);
  };

  const activateOrganization = (id: string) => {
    const updated = organizations.map(o => o.id === id ? { ...o, status: 'Approved' as OrgStatus } : o);
    setOrganizations(updated);
    saveState(updated, tokens, smsLogs, settings);
  };

  // Notifications Dispatcher Helper
  const sendSMSNotification = (
    orgId: string,
    customerName: string,
    phone: string,
    tokenNumber: string,
    message: string,
    type: '5_ahead' | '2_ahead' | 'current_turn'
  ) => {
    const org = organizations.find(o => o.id === orgId);
    const newLog: SMSLog = {
      id: `sms-${Math.random().toString(36).substr(2, 9)}`,
      organizationId: orgId,
      organizationName: org ? org.name : 'QueueFlow Business',
      customerName,
      customerPhone: phone,
      tokenNumber,
      message,
      type,
      sentAt: new Date().toISOString()
    };

    setSmsLogs(prev => {
      const updated = [newLog, ...prev];
      localStorage.setItem('qflow_sms_logs', JSON.stringify(updated));
      return updated;
    });
  };

  // Check positions of all waiting customer tokens and dispatch notifications accordingly
  const reevaluateNotifications = (orgId: string, currentTokens: QueueToken[]) => {
    const waitingTokens = currentTokens
      .filter(t => t.organizationId === orgId && t.status === 'Waiting')
      .sort((a, b) => a.sequence - b.sequence);

    waitingTokens.forEach((token, index) => {
      const posAhead = index + 1; // position in the line
      if (posAhead === 5) {
        sendSMSNotification(
          orgId,
          token.customerName,
          token.customerPhone,
          token.tokenNumber,
          `Please get ready. Your turn (Token ${token.tokenNumber}) is approaching. There are 5 people ahead of you.`,
          '5_ahead'
        );
      } else if (posAhead === 2) {
        sendSMSNotification(
          orgId,
          token.customerName,
          token.customerPhone,
          token.tokenNumber,
          `Please come near the service counter. Your turn (Token ${token.tokenNumber}) is approaching. There are 2 people ahead of you.`,
          '2_ahead'
        );
      }
    });
  };

  // Generate Token (Customer flow)
  const bookToken = (orgId: string, name: string, phone: string, email?: string, purpose?: string): QueueToken => {
    const org = organizations.find(o => o.id === orgId);
    if (!org) throw new Error('Organization not found');

    // Letter prefix depending on Business type
    let prefix = 'A';
    const type = org.businessType.toUpperCase();
    if (type.includes('HOSPITAL')) prefix = 'H';
    else if (type.includes('CLINIC')) prefix = 'C';
    else if (type.includes('BANK')) prefix = 'B';
    else if (type.includes('SUPERMARKET')) prefix = 'S';
    else if (type.includes('COLLEGE') || type.includes('UNIVERSITY')) prefix = 'U';
    else if (type.includes('RESTAURANT')) prefix = 'R';
    else if (type.includes('SALON')) prefix = 'N';
    else if (type.includes('PHARMACY')) prefix = 'P';
    else if (type.includes('SERVICE')) prefix = 'V';

    // Get current day's tokens count to make incremental number
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayTokens = tokens.filter(t => 
      t.organizationId === orgId && 
      new Date(t.createdAt) >= startOfDay
    );

    const nextIndex = todayTokens.length + 1;
    const tokenNumber = `${prefix}${String(nextIndex).padStart(3, '0')}`;
    
    // Find highest sequence globally or for today
    const maxSeq = tokens.length > 0 ? Math.max(...tokens.map(t => t.sequence)) : 0;

    const newToken: QueueToken = {
      id: `token-${Math.random().toString(36).substr(2, 9)}`,
      organizationId: orgId,
      tokenNumber,
      customerName: name,
      customerPhone: phone,
      customerEmail: email,
      purpose,
      status: 'Waiting',
      sequence: maxSeq + 1,
      createdAt: new Date().toISOString()
    };

    const updatedTokens = [...tokens, newToken];
    setTokens(updatedTokens);
    saveState(organizations, updatedTokens, smsLogs, settings);

    // Trigger check for newly added token relative notifications
    reevaluateNotifications(orgId, updatedTokens);

    return newToken;
  };

  // Queue Managing Operations (Admin desk)
  const nextCustomer = (orgId: string) => {
    // 1. Mark current serving customer as Completed
    let updated = tokens.map(t => 
      (t.organizationId === orgId && t.status === 'Serving') 
        ? { ...t, status: 'Completed' as TokenStatus } 
        : t
    );

    // 2. Grab next in line (FIFO)
    const nextWaiting = updated
      .filter(t => t.organizationId === orgId && t.status === 'Waiting')
      .sort((a, b) => a.sequence - b.sequence)[0];

    if (nextWaiting) {
      updated = updated.map(t => 
        t.id === nextWaiting.id 
          ? { ...t, status: 'Serving' as TokenStatus } 
          : t
      );

      // Trigger SMS for active turn
      sendSMSNotification(
        orgId,
        nextWaiting.customerName,
        nextWaiting.customerPhone,
        nextWaiting.tokenNumber,
        `It is now your turn (Token ${nextWaiting.tokenNumber}). Please proceed to the counter.`,
        'current_turn'
      );
    }

    setTokens(updated);
    saveState(organizations, updated, smsLogs, settings);
    
    // Re-check remaining customer lines to update thresholds (5 or 2 left)
    reevaluateNotifications(orgId, updated);
  };

  const completeCustomer = (orgId: string, tokenId: string) => {
    const updated = tokens.map(t => t.id === tokenId ? { ...t, status: 'Completed' as TokenStatus } : t);
    setTokens(updated);
    saveState(organizations, updated, smsLogs, settings);
    reevaluateNotifications(orgId, updated);
  };

  const skipCustomer = (orgId: string, tokenId: string) => {
    const updated = tokens.map(t => t.id === tokenId ? { ...t, status: 'Skipped' as TokenStatus } : t);
    setTokens(updated);
    saveState(organizations, updated, smsLogs, settings);
    reevaluateNotifications(orgId, updated);
  };

  const recallCustomer = (orgId: string, tokenId: string) => {
    const token = tokens.find(t => t.id === tokenId);
    if (token) {
      sendSMSNotification(
        orgId,
        token.customerName,
        token.customerPhone,
        token.tokenNumber,
        `Re-calling Token ${token.tokenNumber}: Please proceed to the service counter. Your turn is currently active!`,
        'current_turn'
      );
    }
  };

  const toggleQueuePause = (orgId: string) => {
    const current = settings[orgId];
    if (current) {
      const updatedSettings = {
        ...settings,
        [orgId]: { ...current, isPaused: !current.isPaused }
      };
      setSettings(updatedSettings);
      saveState(organizations, tokens, smsLogs, updatedSettings);
    }
  };

  const updateAvgServiceTime = (orgId: string, minutes: number) => {
    const current = settings[orgId];
    if (current) {
      const updatedSettings = {
        ...settings,
        [orgId]: { ...current, avgServiceTime: minutes }
      };
      setSettings(updatedSettings);
      saveState(organizations, tokens, smsLogs, updatedSettings);
    }
  };

  const updateBusinessProfile = (orgId: string, name: string, phone: string, address: string, logoUrl?: string) => {
    const updatedOrgs = organizations.map(o => 
      o.id === orgId 
        ? { ...o, name, phone, address, logoUrl: logoUrl || o.logoUrl } 
        : o
    );
    setOrganizations(updatedOrgs);
    saveState(updatedOrgs, tokens, smsLogs, settings);
  };

  const updateSubscription = (
    orgId: string, 
    plan: 'Starter' | 'Professional' | 'Enterprise', 
    paymentStatus: 'Paid' | 'Unpaid' | 'Failed', 
    trialStatus: 'Active' | 'Expired' | 'None', 
    expiryDate: string
  ) => {
    const updatedOrgs = organizations.map(o => 
      o.id === orgId 
        ? { 
            ...o, 
            subscriptionPlan: plan, 
            paymentStatus, 
            trialStatus, 
            subscriptionExpiry: expiryDate,
            status: 'Pending' as OrgStatus
          } 
        : o
    );
    setOrganizations(updatedOrgs);
    saveState(updatedOrgs, tokens, smsLogs, settings);
  };

  // Search Ticket across platform
  const searchTokens = (query: string): (QueueToken & { organizationName: string })[] => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return [];

    return tokens
      .filter(t => 
        (t.status === 'Waiting' || t.status === 'Serving') && 
        (t.customerPhone.includes(cleanQuery) || 
         t.tokenNumber.toLowerCase() === cleanQuery || 
         t.organizationId.toLowerCase() === cleanQuery)
      )
      .map(t => {
        const org = organizations.find(o => o.id === t.organizationId);
        return {
          ...t,
          organizationName: org ? org.name : 'Unknown Organization'
        };
      });
  };

  return (
    <QueueContext.Provider
      value={{
        currentUser,
        organizations,
        tokens,
        smsLogs,
        settings,
        login,
        logout,
        registerOrganization,
        approveOrganization,
        rejectOrganization,
        suspendOrganization,
        activateOrganization,
        bookToken,
        nextCustomer,
        completeCustomer,
        skipCustomer,
        recallCustomer,
        toggleQueuePause,
        updateAvgServiceTime,
        updateBusinessProfile,
        updateSubscription,
        searchTokens
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
