#!/usr/bin/env node
import { isMainModule, startServer } from "./server.js";

if (isMainModule(import.meta.url)) {
  startServer().catch(console.error);
}
