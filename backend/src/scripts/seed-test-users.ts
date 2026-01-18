import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User, UserRole, UserStatus } from '../modules/users/entities/user.entity';
import { Hotel } from '../modules/hotels/entities/hotel.entity';
import { Room } from '../modules/rooms/entities/room.entity';
import { Booking } from '../modules/bookings/entities/booking.entity';
import { RoomAvailability } from '../modules/availability/entities/room-availability.entity';
import { AuditLog } from '../modules/audit/entities/audit-log.entity';

// Load environment variables
dotenv.config();

async function seedTestUsers() {
  console.log('🔄 Connecting to database...');
  
  // Create DataSource with environment variables
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [User, AuditLog, Hotel, Room, Booking, RoomAvailability],
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('');
    console.log('🔧 Please check:');
    console.log('   1. PostgreSQL is running');
    console.log('   2. Database credentials in .env file');
    console.log('   3. Database "shambit_hotels" exists');
    console.log('');
    console.log('💡 Current connection settings:');
    console.log(`   Host: ${process.env.DATABASE_HOST || 'localhost'}`);
    console.log(`   Port: ${process.env.DATABASE_PORT || '5432'}`);
    console.log(`   Username: ${process.env.DATABASE_USERNAME}`);
    console.log(`   Database: ${process.env.DATABASE_NAME}`);
    process.exit(1);
  }

  console.log('🗑️  Clearing existing data...');
  
  // Clear all tables in the correct order (respecting foreign key constraints)
  await dataSource.query('TRUNCATE TABLE audit_logs CASCADE');
  await dataSource.query('TRUNCATE TABLE room_availability CASCADE');
  await dataSource.query('TRUNCATE TABLE bookings CASCADE');
  await dataSource.query('TRUNCATE TABLE rooms CASCADE');
  await dataSource.query('TRUNCATE TABLE hotels CASCADE');
  await dataSource.query('TRUNCATE TABLE users CASCADE');

  console.log('✅ Database cleared successfully');

  const userRepository = dataSource.getRepository(User);
  const bcryptRounds = 12;

  console.log('👥 Creating test users...');

  // 1. Admin User
  const adminPassword = await bcrypt.hash('Admin123!', bcryptRounds);
  const adminUser = userRepository.create({
    name: 'System Administrator',
    email: 'admin@shambithotels.com',
    password: adminPassword,
    phone: '+91-9876543210',
    roles: [UserRole.ADMIN],
    isEmailVerified: true,
    status: UserStatus.ACTIVE,
  });

  // 2. Hotel Owner/Seller User
  const sellerPassword = await bcrypt.hash('Seller123!', bcryptRounds);
  const sellerUser = userRepository.create({
    name: 'Hotel Owner',
    email: 'owner@example.com',
    password: sellerPassword,
    phone: '+91-9876543211',
    roles: [UserRole.SELLER],
    isEmailVerified: true,
    status: UserStatus.ACTIVE,
  });

  // 3. Customer/Buyer User
  const buyerPassword = await bcrypt.hash('Customer123!', bcryptRounds);
  const buyerUser = userRepository.create({
    name: 'John Customer',
    email: 'customer@example.com',
    password: buyerPassword,
    phone: '+91-9876543212',
    roles: [UserRole.BUYER],
    isEmailVerified: true,
    status: UserStatus.ACTIVE,
  });

  // Save all users
  const savedUsers = await userRepository.save([adminUser, sellerUser, buyerUser]);

  console.log('✅ Test users created successfully:');
  console.log('');
  console.log('🔐 ADMIN USER:');
  console.log('   Email: admin@shambithotels.com');
  console.log('   Password: Admin123!');
  console.log('   Role: ADMIN');
  console.log('');
  console.log('🏨 HOTEL OWNER/SELLER:');
  console.log('   Email: owner@example.com');
  console.log('   Password: Seller123!');
  console.log('   Role: SELLER');
  console.log('');
  console.log('🛒 CUSTOMER/BUYER:');
  console.log('   Email: customer@example.com');
  console.log('   Password: Customer123!');
  console.log('   Role: BUYER');
  console.log('');
  console.log('📝 All users have verified emails and active status');
  console.log('🔒 Passwords are securely hashed with bcrypt');

  await dataSource.destroy();
  console.log('');
  console.log('🎉 Database seeding completed successfully!');
}

// Run the seeding function
seedTestUsers()
  .then(() => {
    console.log('✅ Seeding process finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  });