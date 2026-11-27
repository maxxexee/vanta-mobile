import { defineConfig } from '@neon/config/v1';

export default defineConfig({
  functions: {
    push: {
      name: 'push sender',
      source: 'src/index.ts',
      env: {
        VAPID_PUBLIC_KEY: { value: process.env.VAPID_PUBLIC_KEY, required: true },
        VAPID_PRIVATE_KEY: { value: process.env.VAPID_PRIVATE_KEY, required: true },
        VAPID_SUBJECT: { value: process.env.VAPID_SUBJECT, required: true },
        SOLANA_RPC_URL: { value: process.env.SOLANA_RPC_URL, required: true },
        ALLOWED_ORIGIN: { value: process.env.ALLOWED_ORIGIN, required: true },
      },
    },
  },
  triggers: {
    'watch-deposits': {
      type: 'schedule',
      function: 'push',
      cron: '* * * * *',
      functionPath: '/cron',
    },
  },
});
