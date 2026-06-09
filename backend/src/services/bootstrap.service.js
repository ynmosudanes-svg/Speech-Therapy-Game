const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const env = require('../config/env');
const { buildConfigFromLegacyGame } = require('../utils/gameConfig');

async function seedDefaultAdmin() {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return;
    }

    const hashedPassword = await bcrypt.hash('12345678', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@speech.com',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });
    console.log(`Default admin created: ${admin.email}`);
  } catch (error) {
    console.error('WARNING: Could not seed default admin:', error.message);
  }
}

const { exec } = require('child_process');

async function ensureUploadsDirectory() {
  if (!fs.existsSync(env.uploadsDir)) {
    fs.mkdirSync(env.uploadsDir, { recursive: true });
  }
}

function mapLegacyGame(legacyGame) {
  const mappedGame = {
    name: legacyGame.name || legacyGame.title || 'Untitled Game',
    title: legacyGame.title || legacyGame.name || null,
    titleAr: legacyGame.titleAr || legacyGame.nameAr || null,
    type: legacyGame.type,
    level: legacyGame.level || 1,
    isActive: true,
    questionText: legacyGame.questionText || null,
    questionTextAr: legacyGame.questionTextAr || null,
    questionAudio: legacyGame.questionAudio || null,
    instructionText: legacyGame.instructionText || null,
    instructionTextAr: legacyGame.instructionTextAr || null,
    instructionAudio: legacyGame.instructionAudio || null,
    targetImage: legacyGame.targetImage || null,
    options: legacyGame.options || null,
    items: legacyGame.items || null,
    successSound: legacyGame.successSound || null,
    failSound: legacyGame.failSound || null,
  };

  return {
    ...mappedGame,
    config: buildConfigFromLegacyGame(mappedGame),
  };
}

async function seedLegacyGames() {
  if (!env.enableLegacyGameSeed) {
    return;
  }

  const count = await prisma.game.count();

  if (count > 0 || !fs.existsSync(env.legacyDbPath)) {
    return;
  }

  const raw = fs.readFileSync(env.legacyDbPath, 'utf-8');
  const parsed = JSON.parse(raw);
  const legacyGames = Array.isArray(parsed.games) ? parsed.games : [];

  if (!legacyGames.length) {
    return;
  }

  await prisma.game.createMany({
    data: legacyGames.map(mapLegacyGame),
  });
}

async function bootstrapApplication() {
  await ensureUploadsDirectory();
  await seedDefaultAdmin();
  await seedLegacyGames();
}

module.exports = {
  bootstrapApplication,
};
