import { existsSync, readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const appDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(appDir, "../..")

function parseEnvFile(path) {
  if (!existsSync(path)) return {}
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const eq = line.indexOf("=")
        const key = line.slice(0, eq).trim()
        const value = line.slice(eq + 1).trim().replace(/^(['"])(.*)\1$/, "$2")
        return [key, value]
      }),
  )
}

const rootEnv = {
  ...parseEnvFile(resolve(repoRoot, ".env")),
  ...parseEnvFile(resolve(repoRoot, ".env.local")),
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  env: Object.fromEntries(
    Object.entries(rootEnv)
      .filter(([key]) => key.startsWith("NEXT_PUBLIC_"))
      .map(([key, value]) => [key, value || process.env[key]]),
  ),
}

export default nextConfig
