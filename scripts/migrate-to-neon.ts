/**
 * Script de migration Google Sheets → Neon PostgreSQL
 *
 * Usage:
 *   npx tsx scripts/migrate-to-neon.ts
 *
 * Requires:
 *   - .env.local with DATABASE_URL, GOOGLE_SHEET_ID, GOOGLE_CREDS
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables (try .env.local first, then .env)
dotenv.config({ path: resolve(__dirname, '../.env.local') });
dotenv.config({ path: resolve(__dirname, '../.env') });

import { GoogleSheetsService } from '../src/lib/google-sheets';
import { DatabaseService } from '../src/lib/database';

async function migrate() {
  console.log('🚀 Starting migration from Google Sheets to Neon PostgreSQL...\n');

  // Validate environment
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is required in .env or .env.local');
    process.exit(1);
  }
  if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_CREDS) {
    console.error('❌ GOOGLE_SHEET_ID and GOOGLE_CREDS are required in .env.local');
    process.exit(1);
  }

  const sheets = new GoogleSheetsService(
    process.env.GOOGLE_SHEET_ID!,
    process.env.GOOGLE_CREDS!
  );
  const db = new DatabaseService(process.env.DATABASE_URL!);

  // ===== MIGRATE SERVICES =====
  console.log('📋 Fetching services from Google Sheets...');
  const services = await sheets.getServices();
  console.log(`   Found ${services.length} services\n`);

  console.log('💾 Inserting services into PostgreSQL...');
  let serviceCount = 0;
  let serviceErrors = 0;

  for (const service of services) {
    try {
      await db.createService({
        webflow_id: service.webflow_id,
        webflow_slug: service.webflow_slug,
        service_name: service.service_name,
        bookla_service_id: service.bookla_service_id,
        duration_minutes: service.duration_minutes,
        price_eur: service.price_eur,
        category_slug: service.category_slug,
        bookla_category_id: service.bookla_category_id,
        resource_slug: service.resource_slug,
        bookla_resource_id: service.bookla_resource_id,
        capacity_spots: service.capacity_spots,
        visible: service.visible,
        option_extra_slug: service.option_extra_slug,
        option_extra_price: service.option_extra_price,
        option_extra_duration: service.option_extra_duration,
        bookla_updated_at: service.bookla_updated_at,
        notes_internal: service.notes_internal,
        service_type: service.service_type,
        service_type_id: service.service_type_id,
        description_short: service.description_short,
        description_long: service.description_long,
        image_url: service.image_url,
      });
      serviceCount++;
      process.stdout.write(`\r   Inserted ${serviceCount}/${services.length} services`);
    } catch (error: any) {
      serviceErrors++;
      console.error(`\n   ❌ Error inserting service "${service.service_name}": ${error.message}`);
    }
  }
  console.log(`\n   ✅ Services inserted: ${serviceCount}, Errors: ${serviceErrors}\n`);

  // ===== MIGRATE BOOKINGS =====
  console.log('📋 Fetching bookings from Google Sheets...');
  let bookings: any[] = [];
  try {
    bookings = await sheets.getPendingBookings();
    console.log(`   Found ${bookings.length} pending bookings\n`);
  } catch (error) {
    console.log('   No bookings sheet found or empty\n');
  }

  if (bookings.length > 0) {
    console.log('💾 Inserting bookings into PostgreSQL...');
    let bookingCount = 0;
    let bookingErrors = 0;

    for (const booking of bookings) {
      try {
        await db.addBooking({
          bookingId: booking.bookingId,
          clientEmail: booking.clientEmail,
          amount: booking.amount,
          status: booking.status,
          createdAt: booking.createdAt,
          checkoutUrl: booking.checkoutUrl,
        });
        bookingCount++;
        process.stdout.write(`\r   Inserted ${bookingCount}/${bookings.length} bookings`);
      } catch (error: any) {
        bookingErrors++;
        console.error(`\n   ❌ Error inserting booking "${booking.bookingId}": ${error.message}`);
      }
    }
    console.log(`\n   ✅ Bookings inserted: ${bookingCount}, Errors: ${bookingErrors}\n`);
  }

  // ===== VERIFICATION =====
  console.log('🔍 Verifying migration...');
  const dbServiceCount = await db.countServices();
  const dbBookingCount = await db.countBookings();

  console.log(`   Services in Google Sheets: ${services.length}`);
  console.log(`   Services in PostgreSQL:    ${dbServiceCount}`);
  console.log(`   Bookings in Google Sheets: ${bookings.length}`);
  console.log(`   Bookings in PostgreSQL:    ${dbBookingCount}`);

  if (dbServiceCount === services.length) {
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Update .env.local with DATABASE_URL');
    console.log('   2. Test the app locally: npm run dev');
    console.log('   3. Once verified, you can remove GOOGLE_SHEET_ID and GOOGLE_CREDS');
  } else {
    console.log('\n⚠️  Migration completed with some discrepancies.');
    console.log('   Please review the errors above.');
  }
}

migrate().catch((error) => {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
});
