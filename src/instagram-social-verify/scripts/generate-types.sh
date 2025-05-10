
#!/usr/bin/env bash
set -e

# 1) ACIR (JSON) derle / güncelle – gerekiyorsa
nargo compile --package instagram_example    

# 2) TypeScript tiplerini üret (JSON'dan)
pnpm noir-codegen \
  ./target/*.json \
  --out-dir ./src/__generated__