import { createApp, lakebase, server, serving } from '@databricks/appkit';
import { setupFacilityRoutes } from './routes/facility-routes';

createApp({
  plugins: [
    lakebase(),
    server(),
    serving(),
  ],
  async onPluginsReady(appkit) {
    await setupFacilityRoutes(appkit);
  },
}).catch(console.error);
