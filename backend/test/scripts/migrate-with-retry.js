const { spawnSync } = require('child_process');

const maxAttempts = 8;
const delayMs = 5000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runMigrate = () =>
  spawnSync('npx dotenv -e .env.test -- prisma migrate deploy', {
    stdio: 'inherit',
    shell: true,
  });

const main = async () => {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = runMigrate();

    if (result.status === 0) {
      process.exit(0);
    }

    if (result.error) {
      console.error(`[test:prepare] erro de execução: ${result.error.message}`);
    }

    if (attempt < maxAttempts) {
      console.log(
        `[test:prepare] migrate falhou na tentativa ${attempt}/${maxAttempts}. Tentando novamente em ${
          delayMs / 1000
        }s...`
      );
      await sleep(delayMs);
      continue;
    }
  }

  process.exit(1);
};

main();
