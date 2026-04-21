import 'dotenv/config';

import { app } from './app';
import { logInfo } from './utils/logger';

const PORT = Number(process.env.PORT || 3333);

app.listen(PORT, () => {
  logInfo('server.started', { port: PORT });
});
