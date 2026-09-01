import app from "./app.js";
import { env } from "./config/env.js";

app.listen(env.port, "0.0.0.0", () => {
  console.log(`Event Bulletin Board API running on http://localhost:${env.port}`);
  console.log(`Network API available on port ${env.port}`);
});
