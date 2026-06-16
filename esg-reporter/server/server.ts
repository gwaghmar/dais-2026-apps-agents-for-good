import { createApp, lakebase, server, serving } from '@databricks/appkit';
import { setupEsgRoutes } from './routes/esg-routes';

createApp({
  plugins: [
    lakebase(),
    server(),
    serving(),
  ],
  async onPluginsReady(appkit) {
    await setupEsgRoutes(appkit);
  },
}).catch(console.error);
