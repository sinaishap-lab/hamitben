// Seed data – spec §12
// Run with: npx prisma db seed
import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type GemachSeed = {
  name: string;
  description: string;
  address: string;
  lat: number;
  lng: number;
  managerName: string;
  managerPhone: string; // placeholder – replace before production
  managerEmail: string; // placeholder
};

const GEMACHS: GemachSeed[] = [
  {
    name: "גמח מזרח הגוש",
    description: "גמח כלי חקלאיים לקהילות מזרח גוש עציון",
    address: "מזרח גוש עציון",
    lat: 31.63,
    lng: 35.12,
    managerName: "מנהל מזרח הגוש",
    managerPhone: "0500000001",
    managerEmail: "mizrach@hamitben.co.il",
  },
  {
    name: "גמח תלם",
    description: "גמח כלי חקלאיים ביישוב תלם",
    address: "תלם, הר חברון",
    lat: 31.51,
    lng: 34.97,
    managerName: "מנהל תלם",
    managerPhone: "0500000002",
    managerEmail: "telem@hamitben.co.il",
  },
  {
    name: "גמח דרום הר חברון",
    description: "גמח כלי חקלאיים לקהילות דרום הר חברון",
    address: "דרום הר חברון",
    lat: 31.44,
    lng: 35.05,
    managerName: "מנהל דרום הר חברון",
    managerPhone: "0500000003",
    managerEmail: "darom@hamitben.co.il",
  },
];

async function main() {
  console.log("🌾 Seeding HaMatben...");

  // Root admin (env-driven)
  const adminPhone = process.env.ADMIN_PHONE || "0500000000";
  const adminEmail = process.env.ADMIN_EMAIL || "admin@hamitben.co.il";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe!2026";

  const admin = await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {},
    create: {
      name: "מנהל ראשי",
      phone: adminPhone,
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: UserRole.ADMIN,
      status: UserStatus.APPROVED,
      termsSignedAt: new Date(),
      termsVersion: process.env.TERMS_VERSION || "1.0",
    },
  });
  console.log(`✓ admin: ${admin.phone} (default password: ${adminPassword})`);

  // Three launch gemachs, each with a manager user
  for (const g of GEMACHS) {
    const manager = await prisma.user.upsert({
      where: { phone: g.managerPhone },
      update: {},
      create: {
        name: g.managerName,
        phone: g.managerPhone,
        email: g.managerEmail,
        passwordHash: await bcrypt.hash("ChangeMe!2026", 10),
        role: UserRole.GEMACH_MANAGER,
        status: UserStatus.APPROVED,
        termsSignedAt: new Date(),
        termsVersion: process.env.TERMS_VERSION || "1.0",
      },
    });

    await prisma.gemach.upsert({
      where: { name: g.name },
      update: {
        description: g.description,
        address: g.address,
        lat: g.lat,
        lng: g.lng,
      },
      create: {
        name: g.name,
        description: g.description,
        address: g.address,
        lat: g.lat,
        lng: g.lng,
        phone: g.managerPhone,
        managerId: manager.id,
      },
    });
    console.log(`✓ gemach: ${g.name}`);
  }

  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
