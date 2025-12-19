const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function commandExists(command) {
  const isWin = process.platform === 'win32';
  const checker = isWin ? 'where' : 'which';
  const result = spawnSync(checker, [command], { stdio: 'ignore' });
  return result.status === 0;
}

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', ...options });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runWithOutput(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, { encoding: 'utf8', ...options });
  return {
    status: result.status ?? 1,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

function printUsage() {
  // eslint-disable-next-line no-console
  console.log('Uso:');
  // eslint-disable-next-line no-console
  console.log('  pnpm run sam:quick-start -- dev|staging|prod');
  // eslint-disable-next-line no-console
  console.log('  pnpm run sam:quick-start -- --env dev|staging|prod');
}

function parseArgs(argv) {
  const args = argv.slice();
  let env = 'dev';

  for (let i = 0; i < args.length; i++) {
    const a = args[i];

    if (a === '--help' || a === '-h') {
      return { help: true };
    }

    if (a === '--env') {
      const v = args[i + 1];
      if (!v) {
        // eslint-disable-next-line no-console
        console.error('Faltando valor para --env');
        process.exit(1);
      }
      env = String(v).toLowerCase();
      i++;
      continue;
    }

    if (a.startsWith('--env=')) {
      env = a.slice('--env='.length).toLowerCase();
      continue;
    }

    if (!a.startsWith('-')) {
      env = String(a).toLowerCase();
      continue;
    }

    // eslint-disable-next-line no-console
    console.error(`Argumento desconhecido: ${a}`);
    process.exit(1);
  }

  return { env };
}

function getStackName(env) {
  return `rainer-portfolio-backend-${env}`;
}

const parsed = parseArgs(process.argv.slice(2));
if (parsed.help) {
  printUsage();
  process.exit(0);
}

const env = parsed.env;
if (!['dev', 'staging', 'prod'].includes(env)) {
  // eslint-disable-next-line no-console
  console.error(`Ambiente inválido: ${env}`);
  printUsage();
  process.exit(1);
}

if (!commandExists('aws')) {
  // eslint-disable-next-line no-console
  console.error('AWS CLI não encontrado. Instale e configure antes de continuar.');
  process.exit(1);
}

if (!commandExists('sam')) {
  // eslint-disable-next-line no-console
  console.error('SAM CLI não encontrado. Instale e configure antes de continuar.');
  process.exit(1);
}

const caller = runWithOutput('aws', ['sts', 'get-caller-identity']);
if (caller.status !== 0) {
  // eslint-disable-next-line no-console
  console.error('Credenciais AWS não configuradas. Execute: aws configure');
  // eslint-disable-next-line no-console
  console.error(caller.stderr || caller.stdout);
  process.exit(1);
}

const repoRoot = path.resolve(__dirname, '..', '..');
const lambdaDir = path.resolve(__dirname);

// eslint-disable-next-line no-console
console.log(`Ambiente: ${env}`);
// eslint-disable-next-line no-console
console.log(`Stack: ${getStackName(env)}`);

const packageManager = commandExists('pnpm') ? 'pnpm' : 'npm';

// eslint-disable-next-line no-console
console.log(`Build: ${packageManager} run build`);
run(packageManager, ['run', 'build'], { cwd: repoRoot });

// Validate + build SAM
run('sam', ['validate'], { cwd: lambdaDir });
run('sam', ['build'], { cwd: lambdaDir });

const samconfigPath = path.join(lambdaDir, 'samconfig.toml');

if (fs.existsSync(samconfigPath)) {
  run('sam', ['deploy', '--config-env', env], { cwd: lambdaDir });
} else {
  const stackName = getStackName(env);
  run(
    'sam',
    [
      'deploy',
      '--guided',
      '--stack-name',
      stackName,
      '--parameter-overrides',
      `Environment=${env}`,
      '--capabilities',
      'CAPABILITY_IAM',
      '--resolve-s3',
    ],
    { cwd: lambdaDir },
  );
}

const stackName = getStackName(env);
const functionUrlResult = runWithOutput('aws', [
  'cloudformation',
  'describe-stacks',
  '--stack-name',
  stackName,
  '--query',
  'Stacks[0].Outputs[?OutputKey==`BlogApiFunctionUrl`].OutputValue',
  '--output',
  'text',
]);

const functionUrl = (functionUrlResult.stdout || '').trim();
if (functionUrl) {
  // eslint-disable-next-line no-console
  console.log(`Function URL: ${functionUrl}`);
  // eslint-disable-next-line no-console
  console.log(`Testar: curl ${functionUrl}api/health`);
} else {
  // eslint-disable-next-line no-console
  console.log('Não foi possível obter a Function URL. Verifique os Outputs no CloudFormation.');
  if (functionUrlResult.status !== 0) {
    // eslint-disable-next-line no-console
    console.log(functionUrlResult.stderr || functionUrlResult.stdout);
  }
}
