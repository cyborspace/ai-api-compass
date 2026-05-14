import { createServer } from './server.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = parseInt(process.env.PORT || '8000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  const server = await createServer();

  try {
    await server.listen({ port: PORT, host: HOST });
    server.log.info(`Server listening on ${HOST}:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
