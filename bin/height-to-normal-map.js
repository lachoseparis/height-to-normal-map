#!/usr/bin/env node
import execute from '../dist/launcher.js';
import { exit } from 'process';
await execute();
exit();
