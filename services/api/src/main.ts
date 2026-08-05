import 'reflect-metadata';
import { createApp } from './app.factory';

async function bootstrap(): Promise<void> {
  const app = await createApp();
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(
    `[${process.env.NODE_ENV ?? 'development'}] AUTHENTIC J.A. API → http://localhost:${port}/api/v1`,
  );
}

void bootstrap();