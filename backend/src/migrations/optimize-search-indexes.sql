-- Search Performance Optimization Indexes
-- Run this migration to improve search query performance

-- Index for hotel search by city and status
CREATE INDEX IF NOT EXISTS idx_hotels_city_status 
ON hotels (LOWER(city), status) 
WHERE status = 'APPROVED';

-- Index for hotel search by city, status, and hotel type
CREATE INDEX IF NOT EXISTS idx_hotels_city_status_type 
ON hotels (LOWER(city), status, hotel_type) 
WHERE status = 'APPROVED';

-- Composite index for room availability queries
CREATE INDEX IF NOT EXISTS idx_room_availability_room_date_count 
ON room_availability (room_id, date, available_count);

-- Index for room availability date range queries
CREATE INDEX IF NOT EXISTS idx_room_availability_date_range 
ON room_availability (room_id, date) 
WHERE available_count > 0;

-- Index for rooms by hotel
CREATE INDEX IF NOT EXISTS idx_rooms_hotel_occupancy 
ON rooms (hotel_id, max_occupancy);

-- Partial index for blocked availability
CREATE INDEX IF NOT EXISTS idx_room_availability_blocked 
ON room_availability (room_id, date) 
WHERE is_blocked = true;

-- Statistics update for better query planning
ANALYZE hotels;
ANALYZE rooms;
ANALYZE room_availability;

-- Performance monitoring views
CREATE OR REPLACE VIEW search_performance_stats AS
SELECT 
    'hotels_total' as metric,
    COUNT(*) as value
FROM hotels
UNION ALL
SELECT 
    'hotels_approved' as metric,
    COUNT(*) as value
FROM hotels 
WHERE status = 'APPROVED'
UNION ALL
SELECT 
    'rooms_total' as metric,
    COUNT(*) as value
FROM rooms
UNION ALL
SELECT 
    'availability_records' as metric,
    COUNT(*) as value
FROM room_availability
UNION ALL
SELECT 
    'available_room_days' as metric,
    COUNT(*) as value
FROM room_availability 
WHERE available_count > 0;

-- Query to check index usage
-- Run this periodically to monitor index effectiveness
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
*/