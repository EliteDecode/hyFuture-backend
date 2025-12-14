import * as bcrypt from 'bcrypt';

export async function hashData(data: string, saltRound = 12) {
  return await bcrypt.hash(data, saltRound);
}

export async function compareData(data: string, hashed: string) {
  return await bcrypt.compare(data, hashed);
}
