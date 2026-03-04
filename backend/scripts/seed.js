// Usa ts-node para carregar as entidades TS direto (evita problemas de ESM em dist)
// Permite execução via: npx ts-node backend/scripts/seed.js
require("ts-node/register/transpile-only");
require("reflect-metadata");

const bcrypt = require("bcrypt");
const { AppDataSource } = require("../src/data-source");
const { UserEntity } = require("../src/modules/auth/user.entity");
const { SalonEntity } = require("../src/modules/salon/salon.entity");

async function seed() {
  const SALON_NAME = "SDM Piraquara";
  const ADMIN_EMAIL = "admin@hairanalysis.com";
  const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "admin1044";
  const PROF_EMAIL = "profissional@hairanalysis.com";
  const PROF_PASSWORD = process.env.SEED_PROF_PASSWORD || "prof123";
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10");

  const dataSource = await AppDataSource.initialize();
  const salonRepo = dataSource.getRepository(SalonEntity);
  const userRepo = dataSource.getRepository(UserEntity);

  let salon = await salonRepo.findOne({ where: { name: SALON_NAME } });
  if (!salon) {
    salon = salonRepo.create({ name: SALON_NAME });
    await salonRepo.save(salon);
  }

  let admin = await userRepo.findOne({ where: { email: ADMIN_EMAIL } });
  if (!admin) {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);
    admin = userRepo.create({
      email: ADMIN_EMAIL,
      password: hashed,
      fullName: "Administrador do Sistema",
      role: "ADMIN",
      salonId: salon.id,
    });
    await userRepo.save(admin);
  }

  let prof = await userRepo.findOne({ where: { email: PROF_EMAIL } });
  if (!prof) {
    const hashed = await bcrypt.hash(PROF_PASSWORD, saltRounds);
    prof = userRepo.create({
      email: PROF_EMAIL,
      password: hashed,
      fullName: "Profissional Demonstração",
      role: "PROFESSIONAL",
      salonId: salon.id,
    });
    await userRepo.save(prof);
  }

  await dataSource.destroy();
}

seed().catch((err) => {
  process.exit(1);
});
