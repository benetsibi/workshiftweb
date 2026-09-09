-- ShiftTracker PostgreSQL Schema DDL
-- Run this script in PostgreSQL (psql -d shifttracker -f schema.sql)

CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    code VARCHAR(32) NOT NULL UNIQUE,
    color VARCHAR(32) DEFAULT '#6366f1',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(32) DEFAULT 'EMPLOYEE' CHECK (role IN ('ADMIN', 'EMPLOYEE')),
    title VARCHAR(120),
    phone VARCHAR(64),
    avatar_url TEXT,
    hourly_rate NUMERIC(10, 2) DEFAULT 25.00,
    department_id VARCHAR(64) REFERENCES departments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shifts (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id VARCHAR(64) NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    break_minutes INT DEFAULT 30,
    location VARCHAR(120) DEFAULT 'Main Facility',
    notes TEXT,
    status VARCHAR(32) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'TRADED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trade_requests (
    id VARCHAR(64) PRIMARY KEY,
    requester_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requester_shift_id VARCHAR(64) NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    target_user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_shift_id VARCHAR(64) NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    reason TEXT,
    status VARCHAR(32) DEFAULT 'PENDING_PEER' CHECK (status IN ('PENDING_PEER', 'PEER_ACCEPTED', 'PEER_DECLINED', 'ADMIN_APPROVED', 'ADMIN_DENIED', 'CANCELLED')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    actor_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for optimal querying
CREATE INDEX IF NOT EXISTS idx_shifts_user_time ON shifts(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_shifts_dept ON shifts(department_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trade_requests(status);
CREATE INDEX IF NOT EXISTS idx_trades_target ON trade_requests(target_user_id);
CREATE INDEX IF NOT EXISTS idx_trades_requester ON trade_requests(requester_id);

-- Initial Startup Seed Data: Developer, Designer, Testing
INSERT INTO departments (id, name, code, color, description) VALUES
('dept-dev', 'Developer', 'DEV', '#4f46e5', 'Core product engineering, full-stack web applications, REST/GraphQL APIs, and architecture'),
('dept-design', 'Designer', 'DESIGN', '#ec4899', 'UI/UX wireframing, design system components, user journey research, and interactive prototyping'),
('dept-qa', 'Testing', 'TEST', '#06b6d4', 'End-to-end automated test suites, QA regression cycles, cross-device testing, and bug tracking')
ON CONFLICT (id) DO NOTHING;

-- Initial Startup Team Members (Pass: admin123 for admin, employee123 for employees)
INSERT INTO users (id, email, password_hash, name, role, title, phone, hourly_rate, department_id) VALUES
('usr-admin-1', 'admin@shifttracker.com', '$2b$10$9YJhLP/ImT4JaOiyU/6seeocYGD8BBKAKVCg3YDSMVpFHjlgUn1pa', 'Elena Vance', 'ADMIN', 'Co-Founder & Technical Lead', '+1 (555) 234-5678', 75.00, 'dept-dev'),
('usr-emp-1', 'sarah@shifttracker.com', '$2b$10$m6d47z6Dq11qVlG3Qd9VDeBvW9aO8r2P9e1L6t5G3oU6r0W0T2O12', 'Sarah Jenkins', 'EMPLOYEE', 'Senior Full-Stack Developer', '+1 (555) 345-6789', 55.00, 'dept-dev'),
('usr-emp-2', 'alex@shifttracker.com', '$2b$10$m6d47z6Dq11qVlG3Qd9VDeBvW9aO8r2P9e1L6t5G3oU6r0W0T2O12', 'Alex Rivera', 'EMPLOYEE', 'Lead UI/UX Product Designer', '+1 (555) 456-7890', 52.00, 'dept-design'),
('usr-emp-3', 'marcus@shifttracker.com', '$2b$10$m6d47z6Dq11qVlG3Qd9VDeBvW9aO8r2P9e1L6t5G3oU6r0W0T2O12', 'Marcus Chen', 'EMPLOYEE', 'Frontend & Mobile Developer', '+1 (555) 567-8901', 48.00, 'dept-dev'),
('usr-emp-4', 'priya@shifttracker.com', '$2b$10$m6d47z6Dq11qVlG3Qd9VDeBvW9aO8r2P9e1L6t5G3oU6r0W0T2O12', 'Priya Patel', 'EMPLOYEE', 'Lead QA & Automation Test Engineer', '+1 (555) 678-9012', 50.00, 'dept-qa'),
('usr-emp-5', 'david@shifttracker.com', '$2b$10$m6d47z6Dq11qVlG3Qd9VDeBvW9aO8r2P9e1L6t5G3oU6r0W0T2O12', 'David Miller', 'EMPLOYEE', 'Visual & Brand Product Designer', '+1 (555) 789-0123', 46.00, 'dept-design')
ON CONFLICT (id) DO NOTHING;

