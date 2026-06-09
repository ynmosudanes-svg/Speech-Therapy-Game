const prisma = require('../config/prisma');

function randomSegment(length) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let value = '';

  for (let index = 0; index < length; index += 1) {
    value += chars[Math.floor(Math.random() * chars.length)];
  }

  return value;
}

async function generateUniqueAccessCode(name = 'PATIENT') {
  const prefix = name
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 4)
    .padEnd(4, 'X');

  let code = '';
  let exists = true;

  while (exists) {
    code = `${prefix}${randomSegment(4)}`;
    exists = Boolean(await prisma.student.findUnique({ where: { accessCode: code } }));
  }

  return code;
}

module.exports = {
  generateUniqueAccessCode,
};
