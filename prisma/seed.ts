// import { PrismaClient, Prisma } from '@prisma/client';
// import { Pool } from 'pg';
// import { PrismaPg } from '@prisma/adapter-pg';
// import { config } from 'dotenv';
// import { readFileSync } from 'fs';
// import path from 'path';

// // Load environment variables
// config();

// const databaseUrl = process.env.DATABASE_URL;

// if (!databaseUrl) {
//   throw new Error(
//     'DATABASE_URL environment variable is not set. Please check your .env file.',
//   );
// }

// const pool = new Pool({ connectionString: databaseUrl });
// const adapter = new PrismaPg(pool);

// const prisma = new PrismaClient({ adapter });

// type RawCountry = {
//   id?: string;
//   name: string;
//   code: string;
//   phoneCode: string;
//   logo: string;
//   region: string;
// };

// const REGION_MAP: Record<string, Region> = {
//   AFRICA: 'AFRICA',
//   AMERICAS: 'AMERICAS',
//   ASIA: 'ASIA',
//   EUROPE: 'EUROPE',
//   OCEANIA: 'OCEANIA',
// };

// const countriesFilePath = path.resolve(process.cwd(), 'countries.json');

// function normalizeRegion(region: string): Region {
//   const key = region.trim().toUpperCase();
//   const mapped = REGION_MAP[key];

//   if (!mapped) {
//     throw new Error(`Unsupported region "${region}" found in countries.json`);
//   }

//   return mapped;
// }

// async function main() {
//   console.log('🌱 Seeding countries...');

//   const rawCountries = JSON.parse(
//     readFileSync(countriesFilePath, 'utf-8'),
//   ) as RawCountry[];

//   if (!Array.isArray(rawCountries) || rawCountries.length === 0) {
//     throw new Error(
//       'countries.json is empty or not an array. Ensure it contains at least one country.',
//     );
//   }

//   const countriesPayload: Prisma.CountryCreateManyInput[] = rawCountries.map(
//     (country) => ({
//       name: country.name.trim(),
//       code: country.code.trim().toUpperCase(),
//       phoneCode: country.phoneCode.trim(),
//       logo: country.logo.trim(),
//       region: normalizeRegion(country.region),
//     }),
//   );

//   const result = await prisma.country.createMany({
//     data: countriesPayload,
//     skipDuplicates: true,
//   });

//   console.log(`✅ Inserted ${result.count} countries (duplicates skipped).`);
// }

// main()
//   .catch(console.error)
//   .finally(async () => {
//     await prisma.$disconnect();
//     await pool.end();
//   });
