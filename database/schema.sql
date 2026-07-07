-- Database Schema for QueueFlow AI (PostgreSQL)
-- Supports Multi-Tenant Data Isolation and Scalability

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Business Types Enum
CREATE TYPE business_type_enum AS ENUM (
  'Hospital',
  'Clinic',
  'Bank',
  'Government Office',
  'Supermarket',
  'College',
  'University',
  'Restaurant',
  'Service Center',
  'Ticket Counter',
  'Salon',
  'Pharmacy',
  'Post Office'
);

-- Organization Status Enum
CREATE TYPE org_status_enum AS ENUM (
  'Pending Verification',
  'Active',
  'Suspended'
);

-- User Roles Enum
CREATE TYPE user_role_enum AS ENUM (
  'Super Admin',
  'Organization Admin',
  'Staff'
);

-- Token Status Enum
CREATE TYPE token_status_enum AS ENUM (
  'Waiting',
  'Serving',
  'Completed',
  'Skipped'
);

-- Notification Status Enum
CREATE TYPE notification_status_enum AS ENUM (
  'Pending',
  'Sent',
  'Failed'
);

-- Document Type Enum
CREATE TYPE document_type_enum AS ENUM (
  'Business Registration Document',
  'Identity Proof'
);

-- 1. Organizations Table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  business_type business_type_enum NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) NOT NULL,
  business_address TEXT NOT NULL,
  status org_status_enum NOT NULL DEFAULT 'Pending Verification',
  qr_code_url TEXT,
  logo_url TEXT,
  subscription_plan VARCHAR(50) NOT NULL DEFAULT 'Starter',
  payment_status VARCHAR(50) NOT NULL DEFAULT 'Unpaid',
  trial_status VARCHAR(50) NOT NULL DEFAULT 'Active',
  subscription_expiry TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on organization name & type for quick searches
CREATE INDEX idx_org_name ON organizations(name);
CREATE INDEX idx_org_type ON organizations(business_type);

-- 2. Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role_enum NOT NULL DEFAULT 'Staff',
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Row Level Security (RLS) or indices for tenant isolation
CREATE INDEX idx_users_org_id ON users(organization_id);

-- 3. Organization Documents Table (Verification documents)
CREATE TABLE organization_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_type document_type_enum NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_org_id ON organization_documents(organization_id);

-- 4. Business Settings Table
CREATE TABLE business_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  avg_service_time_minutes INT NOT NULL DEFAULT 15,
  is_queue_paused BOOLEAN NOT NULL DEFAULT FALSE,
  business_hours JSONB, -- Details on opening/closing times
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Queue Tokens Table
CREATE TABLE queue_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  token_number VARCHAR(10) NOT NULL, -- e.g. A001, B002
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_email VARCHAR(255),
  purpose_of_visit VARCHAR(500),
  status token_status_enum NOT NULL DEFAULT 'Waiting',
  sequence_number SERIAL, -- Global sequence for FIFO ordering
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tokens_org_status ON queue_tokens(organization_id, status);
CREATE INDEX idx_tokens_phone ON queue_tokens(customer_phone);

-- 6. Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  token_id UUID REFERENCES queue_tokens(id) ON DELETE CASCADE,
  customer_phone VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50) NOT NULL, -- '5_ahead', '2_ahead', 'current_turn'
  status notification_status_enum NOT NULL DEFAULT 'Pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_org ON notifications(organization_id);

-- 7. Queue History Table (For Reporting & Analytics)
CREATE TABLE queue_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_customers INT NOT NULL DEFAULT 0,
  completed_customers INT NOT NULL DEFAULT 0,
  skipped_customers INT NOT NULL DEFAULT 0,
  average_waiting_time_minutes DECIMAL(5,2) DEFAULT 0.00,
  peak_hour_start INT, -- 0-23 representation of hour
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_history_org_date ON queue_history(organization_id, date);
