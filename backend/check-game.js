const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGame() {
  const gameId = 'cmq5lm1ry0006ph2by01i4dv8';
  try {
    const game = await prisma.game.findUnique({
      where: { id: gameId }
    });
    console.log(JSON.stringify(game, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGame();
