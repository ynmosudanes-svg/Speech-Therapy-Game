const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

function getArg(name, fallback = '') {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) {
    return fallback;
  }

  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) {
    return fallback;
  }

  return value;
}

async function main() {
  const name = getArg('name', '').trim();
  const email = getArg('email', '').trim().toLowerCase();
  const password = getArg('password', '').trim();

  if (!name || !email || !password) {
    throw new Error('Missing required args. Use --name, --email, and --password.');
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`User already exists: ${email}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log(`Created super admin: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
