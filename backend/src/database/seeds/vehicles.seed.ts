/**
 * Seed: Inserts the 6 production vehicles matching the frontend mock data.
 * Run via: npm run seed:vehicles
 *
 * Safe to run multiple times — uses ON CONFLICT DO NOTHING.
 */
import 'dotenv/config';
import { AppDataSource } from '../../config/data-source';
import { Vehicle, VehicleCategory, VehicleStatus, Transmission } from '../../vehicles/vehicle.entity';

const VEHICLES: Partial<Vehicle>[] = [
  {
    brand: 'Audi',
    model: 'A4',
    licensePlate: '22145-A-1',
    category: VehicleCategory.SEDAN,
    pricePerDayEurCents: 16000, // 160 EUR
    imageUrl: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80',
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80',
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0729?w=800&q=80',
    ],
    transmission: Transmission.AUTOMATIC,
    seats: 5,
    luggageCount: 2,
    features: ['SIM 5GB', 'Tag Jawaz', 'Seguro Todo Riesgo', 'Sin límite km'],
    status: VehicleStatus.AVAILABLE,
  },
  {
    brand: 'Mercedes',
    model: 'Clase C',
    licensePlate: '33112-B-7',
    category: VehicleCategory.SEDAN,
    pricePerDayEurCents: 19000,
    imageUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80',
      'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80',
      'https://images.unsplash.com/photo-1555353540-64580b51c258?w=800&q=80',
    ],
    transmission: Transmission.AUTOMATIC,
    seats: 5,
    luggageCount: 2,
    features: ['SIM 5GB', 'Tag Jawaz', 'Seguro Todo Riesgo', 'Sin límite km'],
    status: VehicleStatus.AVAILABLE,
  },
  {
    brand: 'Hyundai',
    model: 'Tucson',
    licensePlate: '44098-C-3',
    category: VehicleCategory.SUV,
    pricePerDayEurCents: 12000,
    imageUrl: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80',
      'https://images.unsplash.com/photo-1570733577524-3a047079e80d?w=800&q=80',
      'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80',
    ],
    transmission: Transmission.AUTOMATIC,
    seats: 5,
    luggageCount: 3,
    features: ['SIM 5GB', 'Tag Jawaz', 'Seguro Todo Riesgo'],
    status: VehicleStatus.AVAILABLE,
  },
  {
    brand: 'BMW',
    model: 'Serie 3',
    licensePlate: '55877-D-9',
    category: VehicleCategory.LUXURY,
    pricePerDayEurCents: 22000,
    imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80',
      'https://images.unsplash.com/photo-1616455579100-2ceaa4088152?w=800&q=80',
      'https://images.unsplash.com/photo-1523983388277-336a66bf9bcd?w=800&q=80',
    ],
    transmission: Transmission.AUTOMATIC,
    seats: 5,
    luggageCount: 2,
    features: ['SIM 5GB', 'Tag Jawaz', 'Seguro Todo Riesgo', 'Sin límite km', 'GPS integrado'],
    status: VehicleStatus.AVAILABLE,
  },
  {
    brand: 'Renault',
    model: 'Clio',
    licensePlate: '11904-E-2',
    category: VehicleCategory.COMPACT,
    pricePerDayEurCents: 6500,
    imageUrl: 'https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=800&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=800&q=80',
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80',
      'https://images.unsplash.com/photo-1522932467653-e48f79727abf?w=800&q=80',
    ],
    transmission: Transmission.MANUAL,
    seats: 5,
    luggageCount: 1,
    features: ['Tag Jawaz', 'Seguro Todo Riesgo'],
    status: VehicleStatus.AVAILABLE,
  },
  {
    brand: 'Land Rover',
    model: 'Range Rover Evoque',
    licensePlate: '66721-F-5',
    category: VehicleCategory.SUV,
    pricePerDayEurCents: 28000,
    imageUrl: 'https://images.unsplash.com/photo-1567343483408-c1e60e1f6af5?w=800&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1567343483408-c1e60e1f6af5?w=800&q=80',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80',
      'https://images.unsplash.com/photo-1625231338715-12d23b1c6c59?w=800&q=80',
    ],
    transmission: Transmission.AUTOMATIC,
    seats: 5,
    luggageCount: 3,
    features: ['SIM 5GB', 'Tag Jawaz', 'Seguro Todo Riesgo', 'Sin límite km', 'GPS integrado'],
    status: VehicleStatus.AVAILABLE,
  },
];

async function seed() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Vehicle);

  console.log('🌱 Seeding vehicles...');

  for (const data of VEHICLES) {
    // Check by brand+model to avoid duplicates
    const existing = await repo.findOne({
      where: { brand: data.brand, model: data.model },
    });

    if (existing) {
      console.log(`  ↩  ${data.brand} ${data.model} already exists — skipped.`);
      continue;
    }

    const vehicle = repo.create(data);
    await repo.save(vehicle);
    console.log(`  ✅ ${data.brand} ${data.model} inserted.`);
  }

  await AppDataSource.destroy();
  console.log('✅ Seed complete.');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
