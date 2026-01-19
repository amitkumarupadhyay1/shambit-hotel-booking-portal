const { Client } = require('pg');
require('dotenv').config();

async function initializeAvailability() {
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

    // Get all rooms that need availability initialization
    const rooms = await client.query(`
      SELECT r.id, r.name, r.quantity, h.name as hotel_name
      FROM rooms r
      JOIN hotels h ON r."hotelId" = h.id
      ORDER BY h.name, r.name
    `);

    console.log(`\n🔄 Initializing availability for ${rooms.rows.length} rooms...`);

    for (const room of rooms.rows) {
      console.log(`\n📅 Processing: ${room.hotel_name} - ${room.name}`);
      
      // Check if room already has future availability data
      const existingCount = await client.query(`
        SELECT COUNT(*) as count
        FROM room_availability 
        WHERE "roomId" = $1 AND date >= CURRENT_DATE
      `, [room.id]);

      if (existingCount.rows[0].count > 0) {
        console.log(`   ✓ Already has ${existingCount.rows[0].count} future availability records`);
        continue;
      }

      // Initialize availability for next 365 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 365);

      const availabilityRecords = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        availabilityRecords.push({
          roomId: room.id,
          date: new Date(currentDate),
          availableCount: room.quantity,
          isBlocked: false
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log(`   📊 Creating ${availabilityRecords.length} availability records...`);

      // Insert in batches to avoid memory issues
      const batchSize = 50;
      for (let i = 0; i < availabilityRecords.length; i += batchSize) {
        const batch = availabilityRecords.slice(i, i + batchSize);
        
        const values = batch.map((record, index) => {
          const paramIndex = index * 4;
          return `($${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4})`;
        }).join(', ');

        const params = batch.flatMap(record => [
          record.roomId,
          record.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
          record.availableCount,
          record.isBlocked
        ]);

        const query = `
          INSERT INTO room_availability ("roomId", date, "availableCount", "isBlocked")
          VALUES ${values}
          ON CONFLICT ("roomId", date) DO NOTHING
        `;

        await client.query(query, params);
      }

      // Verify insertion
      const newCount = await client.query(`
        SELECT COUNT(*) as count
        FROM room_availability 
        WHERE "roomId" = $1 AND date >= CURRENT_DATE
      `, [room.id]);

      console.log(`   ✅ Created ${newCount.rows[0].count} availability records`);
    }

    // Final verification
    console.log('\n📊 Final verification:');
    const totalRooms = await client.query('SELECT COUNT(*) as count FROM rooms');
    const roomsWithAvailability = await client.query(`
      SELECT COUNT(DISTINCT "roomId") as count
      FROM room_availability 
      WHERE date >= CURRENT_DATE
    `);

    console.log(`Total rooms: ${totalRooms.rows[0].count}`);
    console.log(`Rooms with availability data: ${roomsWithAvailability.rows[0].count}`);

    if (totalRooms.rows[0].count === roomsWithAvailability.rows[0].count) {
      console.log('✅ All rooms now have availability data!');
    } else {
      console.log('⚠️  Some rooms still missing availability data');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
  }
}

initializeAvailability();