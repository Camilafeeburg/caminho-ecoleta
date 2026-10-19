import fs from 'node:fs'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootEnv = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '.env')
const appEnv = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env')

// Um único .env na raiz do projeto, com fallback caso colocado em app/.env.
export const ENV_FILE = fs.existsSync(rootEnv) ? rootEnv : appEnv

dotenv.config({ path: ENV_FILE })
