-- =====================================================
-- OVRMS Database Schema
-- Online Vehicle Rental and Management System
-- KCA University - Konza Technopolis
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: users
-- Stores system users (both community members and admins)
-- =====================================================
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'admin')),
    organization VARCHAR(100), -- e.g., KoTDA department
    employee_id VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- =====================================================
-- TABLE: mobility_hubs
-- Stores locations where vehicles can be picked up/dropped off
-- =====================================================
CREATE TABLE mobility_hubs (
    hub_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hub_name VARCHAR(100) UNIQUE NOT NULL,
    location_description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    capacity INT DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: vehicles
-- Stores the complete fleet inventory
-- =====================================================
CREATE TABLE vehicles (
    vehicle_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('car', 'bike')),
    vehicle_name VARCHAR(100) NOT NULL,
    plate_number VARCHAR(20) UNIQUE NOT NULL,
    current_hub_id UUID REFERENCES mobility_hubs(hub_id),
    vehicle_status VARCHAR(20) NOT NULL CHECK (vehicle_status IN ('available', 'rented', 'maintenance', 'damaged', 'retired')),
    daily_rate DECIMAL(10, 2) NOT NULL,
    vehicle_make VARCHAR(50),
    vehicle_model VARCHAR(50),
    year_of_manufacture INT,
    color VARCHAR(30),
    seating_capacity INT,
    fuel_type VARCHAR(20), -- petrol, electric, hybrid
    mileage_km DECIMAL(10, 2),
    last_service_date DATE,
    next_service_date DATE,
    insurance_expiry DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id)
);

-- =====================================================
-- TABLE: bookings
-- Stores all rental requests and their lifecycle
-- =====================================================
CREATE TABLE bookings (
    booking_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(vehicle_id),
    user_id UUID NOT NULL REFERENCES users(user_id),
    pickup_hub_id UUID NOT NULL REFERENCES mobility_hubs(hub_id),
    dropoff_hub_id UUID NOT NULL REFERENCES mobility_hubs(hub_id),
    
    -- Dates and times
    requested_start_date DATE NOT NULL,
    requested_end_date DATE NOT NULL,
    actual_pickup_datetime TIMESTAMP,
    actual_return_datetime TIMESTAMP,
    
    -- Status workflow
    booking_status VARCHAR(20) NOT NULL CHECK (booking_status IN ('pending', 'approved', 'rejected', 'active', 'completed', 'cancelled')),
    
    -- Approval tracking
    reviewed_by UUID REFERENCES users(user_id),
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    
    -- Financial
    estimated_cost DECIMAL(10, 2),
    actual_cost DECIMAL(10, 2),
    overdue_charges DECIMAL(10, 2) DEFAULT 0.00,
    is_overdue BOOLEAN DEFAULT false,
    payment_status VARCHAR(20) CHECK (payment_status IN ('unpaid', 'paid', 'waived')),
    
    -- Metadata
    purpose_of_rental TEXT,
    special_requirements TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_dates CHECK (requested_end_date >= requested_start_date)
);

-- =====================================================
-- TABLE: rental_transactions
-- Detailed log of vehicle issuance and returns
-- =====================================================
CREATE TABLE rental_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(booking_id),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('pickup', 'return')),
    transaction_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hub_id UUID REFERENCES mobility_hubs(hub_id),
    handled_by UUID REFERENCES users(user_id), -- Admin who processed
    vehicle_condition_before TEXT,
    vehicle_condition_after TEXT,
    fuel_level_before VARCHAR(20),
    fuel_level_after VARCHAR(20),
    mileage_before DECIMAL(10, 2),
    mileage_after DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: maintenance_records
-- Track vehicle maintenance and service history
-- =====================================================
CREATE TABLE maintenance_records (
    maintenance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(vehicle_id),
    maintenance_type VARCHAR(50) NOT NULL, -- routine, repair, inspection, etc.
    description TEXT NOT NULL,
    service_date DATE NOT NULL,
    cost DECIMAL(10, 2),
    service_provider VARCHAR(100),
    performed_by UUID REFERENCES users(user_id),
    next_service_due DATE,
    parts_replaced TEXT,
    vehicle_unavailable_from TIMESTAMP,
    vehicle_unavailable_to TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: audit_logs
-- Complete audit trail of all system actions
-- =====================================================
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id),
    action_type VARCHAR(50) NOT NULL, -- login, booking_created, booking_approved, etc.
    entity_type VARCHAR(50), -- booking, vehicle, user
    entity_id UUID,
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: system_settings
-- Configuration and rate settings
-- =====================================================
CREATE TABLE system_settings (
    setting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_description TEXT,
    updated_by UUID REFERENCES users(user_id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES for Performance Optimization
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Vehicles indexes
CREATE INDEX idx_vehicles_status ON vehicles(vehicle_status);
CREATE INDEX idx_vehicles_type ON vehicles(vehicle_type);
CREATE INDEX idx_vehicles_hub ON vehicles(current_hub_id);
CREATE INDEX idx_vehicles_plate ON vehicles(plate_number);

-- Bookings indexes
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_vehicle ON bookings(vehicle_id);
CREATE INDEX idx_bookings_status ON bookings(booking_status);
CREATE INDEX idx_bookings_dates ON bookings(requested_start_date, requested_end_date);
CREATE INDEX idx_bookings_overdue ON bookings(is_overdue) WHERE is_overdue = true;

-- Audit logs indexes
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action_type);
CREATE INDEX idx_audit_date ON audit_logs(created_at);

-- =====================================================
-- VIEWS for Common Queries
-- =====================================================

-- View: Available vehicles with hub details
CREATE VIEW available_vehicles AS
SELECT 
    v.vehicle_id,
    v.vehicle_type,
    v.vehicle_name,
    v.plate_number,
    v.daily_rate,
    v.vehicle_make,
    v.vehicle_model,
    v.color,
    h.hub_name,
    h.hub_id,
    h.latitude,
    h.longitude
FROM vehicles v
LEFT JOIN mobility_hubs h ON v.current_hub_id = h.hub_id
WHERE v.vehicle_status = 'available' AND v.is_active = true;

-- View: Pending approval queue
CREATE VIEW pending_approvals AS
SELECT 
    b.booking_id,
    b.created_at as submitted_at,
    u.full_name as user_name,
    u.email as user_email,
    u.phone_number,
    v.vehicle_name,
    v.plate_number,
    v.vehicle_type,
    pickup.hub_name as pickup_hub,
    dropoff.hub_name as dropoff_hub,
    b.requested_start_date,
    b.requested_end_date,
    b.purpose_of_rental,
    b.estimated_cost
FROM bookings b
JOIN users u ON b.user_id = u.user_id
JOIN vehicles v ON b.vehicle_id = v.vehicle_id
JOIN mobility_hubs pickup ON b.pickup_hub_id = pickup.hub_id
JOIN mobility_hubs dropoff ON b.dropoff_hub_id = dropoff.hub_id
WHERE b.booking_status = 'pending'
ORDER BY b.created_at ASC;

-- View: Active rentals
CREATE VIEW active_rentals AS
SELECT 
    b.booking_id,
    u.full_name as user_name,
    u.phone_number,
    v.vehicle_name,
    v.plate_number,
    b.actual_pickup_datetime,
    b.requested_end_date,
    CASE 
        WHEN b.requested_end_date < CURRENT_DATE THEN true 
        ELSE false 
    END as is_overdue,
    CURRENT_DATE - b.requested_end_date as days_overdue,
    pickup.hub_name as pickup_hub,
    dropoff.hub_name as expected_dropoff_hub
FROM bookings b
JOIN users u ON b.user_id = u.user_id
JOIN vehicles v ON b.vehicle_id = v.vehicle_id
JOIN mobility_hubs pickup ON b.pickup_hub_id = pickup.hub_id
JOIN mobility_hubs dropoff ON b.dropoff_hub_id = dropoff.hub_id
WHERE b.booking_status = 'active';

-- =====================================================
-- FUNCTIONS for Business Logic
-- =====================================================

-- Function to calculate rental cost
CREATE OR REPLACE FUNCTION calculate_rental_cost(
    p_vehicle_id UUID,
    p_start_date DATE,
    p_end_date DATE
) RETURNS DECIMAL AS $$
DECLARE
    v_daily_rate DECIMAL;
    v_days INT;
    v_total_cost DECIMAL;
BEGIN
    -- Get vehicle daily rate
    SELECT daily_rate INTO v_daily_rate
    FROM vehicles
    WHERE vehicle_id = p_vehicle_id;
    
    -- Calculate number of days
    v_days := p_end_date - p_start_date + 1;
    
    -- Calculate total
    v_total_cost := v_daily_rate * v_days;
    
    RETURN v_total_cost;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate overdue charges
CREATE OR REPLACE FUNCTION calculate_overdue_charges(
    p_booking_id UUID
) RETURNS DECIMAL AS $$
DECLARE
    v_daily_rate DECIMAL;
    v_end_date DATE;
    v_days_overdue INT;
    v_overdue_charge DECIMAL;
    v_penalty_multiplier DECIMAL := 1.5; -- 50% penalty
BEGIN
    -- Get booking details
    SELECT v.daily_rate, b.requested_end_date
    INTO v_daily_rate, v_end_date
    FROM bookings b
    JOIN vehicles v ON b.vehicle_id = v.vehicle_id
    WHERE b.booking_id = p_booking_id;
    
    -- Calculate days overdue
    v_days_overdue := CURRENT_DATE - v_end_date;
    
    -- Only calculate if overdue
    IF v_days_overdue > 0 THEN
        v_overdue_charge := v_daily_rate * v_penalty_multiplier * v_days_overdue;
    ELSE
        v_overdue_charge := 0;
    END IF;
    
    RETURN v_overdue_charge;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS for Automated Actions
-- =====================================================

-- Trigger to update timestamp on record modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to log all booking status changes
CREATE OR REPLACE FUNCTION log_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.booking_status != NEW.booking_status THEN
        INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description)
        VALUES (
            NEW.reviewed_by,
            'booking_status_changed',
            'booking',
            NEW.booking_id,
            format('Status changed from %s to %s', OLD.booking_status, NEW.booking_status)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_status_change_log AFTER UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION log_booking_status_change();

-- Trigger to update vehicle status when booking is activated
CREATE OR REPLACE FUNCTION update_vehicle_status_on_booking()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_status = 'active' AND OLD.booking_status = 'approved' THEN
        UPDATE vehicles
        SET vehicle_status = 'rented'
        WHERE vehicle_id = NEW.vehicle_id;
    END IF;
    
    IF NEW.booking_status = 'completed' AND OLD.booking_status = 'active' THEN
        UPDATE vehicles
        SET vehicle_status = 'available'
        WHERE vehicle_id = NEW.vehicle_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vehicle_status_sync AFTER UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_vehicle_status_on_booking();

-- =====================================================
-- INITIAL DATA SEEDING
-- =====================================================

-- Insert default mobility hubs
INSERT INTO mobility_hubs (hub_name, location_description, latitude, longitude) VALUES
    ('Main Hub', 'Konza Main Gate - Primary mobility center', -1.0945, 37.0960),
    ('North Hub', 'Northern sector near residential area', -1.0920, 37.0965),
    ('South Hub', 'Southern sector near commercial zone', -1.0970, 37.0955),
    ('East Hub', 'Eastern sector innovation center', -1.0945, 37.0985);

-- Insert system settings
INSERT INTO system_settings (setting_key, setting_value, setting_description) VALUES
    ('overdue_penalty_rate', '1.5', 'Multiplier for overdue charges (1.5 = 150% of daily rate)'),
    ('max_booking_days', '14', 'Maximum number of days allowed per booking'),
    ('advance_booking_days', '30', 'How many days in advance users can book'),
    ('system_email', 'ovrms@konza.go.ke', 'System notification email'),
    ('support_phone', '+254700000000', 'Support contact number');

-- Insert sample admin user (password: admin123 - CHANGE IN PRODUCTION)
INSERT INTO users (username, email, password_hash, full_name, phone_number, role, organization)
VALUES (
    'admin',
    'admin@konza.go.ke',
    '$2b$10$rVQXhHPrIr0xqL7x.x7XNeWQ8LhVJLM5Y5hN5ZY5x5x5x5x5x5x5x', -- Replace with actual bcrypt hash
    'System Administrator',
    '+254712345678',
    'admin',
    'KoTDA Operations'
);

-- =====================================================
-- SECURITY: Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Users can only view their own data (unless admin)
CREATE POLICY user_isolation_policy ON users
    FOR SELECT
    USING (
        user_id = current_setting('app.current_user_id')::UUID 
        OR 
        'admin' = (SELECT role FROM users WHERE user_id = current_setting('app.current_user_id')::UUID)
    );

-- Users can only view their own bookings (unless admin)
CREATE POLICY booking_isolation_policy ON bookings
    FOR SELECT
    USING (
        user_id = current_setting('app.current_user_id')::UUID
        OR
        'admin' = (SELECT role FROM users WHERE user_id = current_setting('app.current_user_id')::UUID)
    );

-- =====================================================
-- STORED PROCEDURES for Common Operations
-- =====================================================

-- Procedure to approve a booking
CREATE OR REPLACE FUNCTION approve_booking(
    p_booking_id UUID,
    p_admin_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_vehicle_id UUID;
    v_is_available BOOLEAN;
BEGIN
    -- Get vehicle ID
    SELECT vehicle_id INTO v_vehicle_id
    FROM bookings
    WHERE booking_id = p_booking_id;
    
    -- Check if vehicle is still available
    SELECT (vehicle_status = 'available') INTO v_is_available
    FROM vehicles
    WHERE vehicle_id = v_vehicle_id;
    
    IF NOT v_is_available THEN
        RETURN FALSE;
    END IF;
    
    -- Update booking status
    UPDATE bookings
    SET booking_status = 'approved',
        reviewed_by = p_admin_id,
        reviewed_at = CURRENT_TIMESTAMP
    WHERE booking_id = p_booking_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Procedure to reject a booking
CREATE OR REPLACE FUNCTION reject_booking(
    p_booking_id UUID,
    p_admin_id UUID,
    p_reason TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE bookings
    SET booking_status = 'rejected',
        reviewed_by = p_admin_id,
        reviewed_at = CURRENT_TIMESTAMP,
        rejection_reason = p_reason
    WHERE booking_id = p_booking_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ANALYTICS VIEWS
-- =====================================================

-- Fleet utilization statistics
CREATE VIEW fleet_statistics AS
SELECT 
    vehicle_type,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE vehicle_status = 'available') as available_count,
    COUNT(*) FILTER (WHERE vehicle_status = 'rented') as rented_count,
    COUNT(*) FILTER (WHERE vehicle_status = 'maintenance') as maintenance_count,
    ROUND(AVG(daily_rate), 2) as avg_daily_rate
FROM vehicles
WHERE is_active = true
GROUP BY vehicle_type;

-- Booking trends
CREATE VIEW booking_trends AS
SELECT 
    DATE_TRUNC('day', created_at) as booking_date,
    COUNT(*) as total_bookings,
    COUNT(*) FILTER (WHERE booking_status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE booking_status = 'approved') as approved_count,
    COUNT(*) FILTER (WHERE booking_status = 'rejected') as rejected_count,
    COUNT(*) FILTER (WHERE booking_status = 'active') as active_count,
    COUNT(*) FILTER (WHERE booking_status = 'completed') as completed_count
FROM bookings
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY booking_date DESC;

-- Revenue tracking
CREATE VIEW revenue_report AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as completed_rentals,
    SUM(actual_cost) as rental_revenue,
    SUM(overdue_charges) as overdue_revenue,
    SUM(actual_cost + overdue_charges) as total_revenue
FROM bookings
WHERE booking_status = 'completed'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- =====================================================
-- BACKUP AND MAINTENANCE QUERIES
-- =====================================================

-- Query to find vehicles needing service
SELECT 
    vehicle_id,
    vehicle_name,
    plate_number,
    last_service_date,
    next_service_date,
    next_service_date - CURRENT_DATE as days_until_service
FROM vehicles
WHERE next_service_date <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY next_service_date;

-- Query to identify inactive users (no login in 90 days)
SELECT 
    user_id,
    username,
    full_name,
    email,
    last_login,
    CURRENT_DATE - last_login::DATE as days_inactive
FROM users
WHERE last_login < CURRENT_DATE - INTERVAL '90 days'
AND is_active = true;

-- =====================================================
-- COMMENTS for Documentation
-- =====================================================

COMMENT ON TABLE users IS 'System users including community members and administrators';
COMMENT ON TABLE vehicles IS 'Complete fleet inventory of cars and bicycles';
COMMENT ON TABLE bookings IS 'All rental requests and their complete lifecycle';
COMMENT ON TABLE mobility_hubs IS 'Physical locations for vehicle pickup and dropoff';
COMMENT ON TABLE rental_transactions IS 'Detailed log of vehicle issuance and returns';
COMMENT ON TABLE maintenance_records IS 'Vehicle service and maintenance history';
COMMENT ON TABLE audit_logs IS 'Complete audit trail of all system actions';

-- =====================================================
-- END OF SCHEMA
-- =====================================================
