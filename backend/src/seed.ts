import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma";

async function main() {
  const templates = [
    { title: "Cinematic portrait", template: "cinematic portrait of {subject}, dramatic lighting, shallow depth of field", category: "Portrait" },
    { title: "Product shot", template: "studio product photo of {subject}, white background, soft shadows, commercial photography", category: "Product" },
    { title: "Fantasy landscape", template: "epic fantasy landscape, {subject}, golden hour, matte painting style", category: "Landscape" },
    { title: "Anime character", template: "anime style character, {subject}, vibrant colors, detailed line art", category: "Character" },
    { title: "Cyberpunk city", template: "cyberpunk city street, {subject}, neon lights, rain, night, 8k", category: "Landscape" },
  ];

  for (const t of templates) {
    await prisma.promptTemplate.upsert({
      where: { id: t.title },
      update: {},
      create: { id: t.title, ...t },
    });
  }

  const adminEmail = "admin@glyph.dev";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const hashed = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: { email: adminEmail, password: hashed, name: "Admin", role: "ADMIN", credits: 9999 },
    });
    console.log(`Seeded admin account → ${adminEmail} / admin123`);
  }

  console.log("Seed complete.");
}

main().finally(() => prisma.$disconnect());
