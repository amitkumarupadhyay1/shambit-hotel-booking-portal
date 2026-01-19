const { Client } = require('pg');
require('dotenv').config();

async function testAvailabilityAPI() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });

  try {
    await client.connect();
    console.log('✓ Connected to database');

    // Test 1: Get hotels with availability
    console.log('\n🧪 Test 1: Search for available hotels');
    
    const checkIn = '2026-01-20';
    const checkOut = '2026-01-22';
    const guests = 2;

    // First get all hotels
    const hotels = await client.query(`
      SELECT h.id, h.name, h.city, h.state
      FROM hotels h
      WHERE h.status = 'APPROVED'
      ORDER BY h.name
    `);

    console.log(`Found ${hotels.rows.length} approved hotels`);

    // For each hotel, check if it has available rooms
    for (const hotel of hotels.rows) {
      console.log(`\n🏨 Checking: ${hotel.name} (${hotel.city})`);
      
      // Get rooms for this hotel
      const rooms = await client.query(`
        SELECT r.id, r.name, r."roomType", r."maxOccupancy", r.quantity
        FROM rooms r
        WHERE r."hotelId" = $1
      `, [hotel.id]);

      console.log(`  Found ${rooms.rows.length} rooms`);

      let hasAvailableRooms = false;

      for (const room of rooms.rows) {
        // Check if room can accommodate guests
        if (room.maxOccupancy < guests) {
          console.log(`    ❌ ${room.name}: Max occupancy ${room.maxOccupancy} < ${guests} guests`);
          continue;
        }

        // Check availability for the date range (excluding checkout date)
        const endDate = new Date(checkOut);
        endDate.setDate(endDate.getDate() - 1);

        const unavailableDates = await client.query(`
          SELECT COUNT(*) as count
          FROM room_availability 
          WHERE "roomId" = $1 
          AND date >= $2 
          AND date <= $3 
          AND ("availableCount" = 0 OR "isBlocked" = true)
        `, [room.id, checkIn, endDate.toISOString().split('T')[0]]);

        const isAvailable = unavailableDates.rows[0].count === '0';

        if (isAvailable) {
          console.log(`    ✅ ${room.name} (${room.roomType}): Available`);
          hasAvailableRooms = true;
        } else {
          console.log(`    ❌ ${room.name} (${room.roomType}): Not available (${unavailableDates.rows[0].count} blocked dates)`);
        }
      }

      if (hasAvailableRooms) {
        console.log(`  🎉 Hotel ${hotel.name} has available rooms!`);
      } else {
        console.log(`  😞 Hotel ${hotel.name} has no available rooms`);
      }
    }

    // Test 2: Test specific room availability
    console.log('\n🧪 Test 2: Check specific room availability');
    
    const sampleRoom = await client.query(`
      SELECT r.id, r.name, h.name as hotel_name
      FROM rooms r
      JOIN hotels h ON r."hotelId" = h.id
      LIMIT 1
    `);

    if (sampleRoom.rows.length > 0) {
      const room = sampleRoom.rows[0];
      console.log(`Testing room: ${room.hotel_name} - ${room.name}`);

      const availability = await client.query(`
        SELECT date, "availableCount", "isBlocked", "blockReason"
        FROM room_availability 
        WHERE "roomId" = $1 
        AND date >= $2 
        AND date <= $3
        ORDER BY date
      `, [room.id, checkIn, checkOut]);

      console.log('Availability for date range:');
      availability.rows.forEach(day => {
        const status = day.isBlocked ? `🚫 BLOCKED (${day.blockReason || 'No reason'})` : `✅ Available: ${day.availableCount}`;
        console.log(`  ${day.date.toISOString().split('T')[0]}: ${status}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

testAvailabilityAPI();