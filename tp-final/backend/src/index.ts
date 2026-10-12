import { createApp } from './app';
import { env } from './config/env';
import { logAiMode } from './lib/openai';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`🚀 Charla backend escuchando en el puerto ${env.PORT}`);
  logAiMode();
});
