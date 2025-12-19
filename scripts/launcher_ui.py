import argparse
import os
import platform
import queue
import shutil
import subprocess
import sys
import threading
import time
import tkinter as tk
from dataclasses import dataclass
from pathlib import Path
from tkinter import messagebox, simpledialog, ttk
from urllib.error import URLError
from urllib.request import Request, urlopen


@dataclass(frozen=True)
class RunnerConfig:
    start_dev_server: bool
    open_prisma_studio: bool
    open_dynamodb_admin: bool
    seed_mongodb: bool
    create_dynamodb_tables: bool
    seed_dynamodb: bool


class CommandError(RuntimeError):
    pass


@dataclass(frozen=True)
class ActionDef:
    key: str
    category: str
    label: str
    description: str
    parameter_kind: str | None = None
    parameter_label: str | None = None
    parameter_choices: tuple[str, ...] | None = None
    destructive: bool = False


def repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def is_windows() -> bool:
    return platform.system().lower().startswith("win")


def which_any(candidates: list[str]) -> str | None:
    for c in candidates:
        if shutil.which(c):
            return c
    return None


def docker_compose_base_cmd() -> list[str]:
    # Prefer classic docker-compose if available (project scripts use it), fallback to docker compose.
    if shutil.which("docker-compose"):
        return ["docker-compose"]
    if shutil.which("docker"):
        return ["docker", "compose"]
    raise CommandError("Docker não encontrado (docker/docker-compose). Instale e inicie o Docker Desktop.")


def package_manager_cmd() -> list[str]:
    # Repo uses pnpm, but fallback to npm.
    if shutil.which("pnpm"):
        return ["pnpm"]
    if shutil.which("npm"):
        return ["npm"]
    raise CommandError("pnpm/npm não encontrado. Instale Node.js e pnpm (recomendado).")


def run_stream(
    cmd: list[str],
    cwd: Path,
    env: dict[str, str] | None,
    log: callable,
    check: bool = True,
) -> int:
    log(f"$ {' '.join(cmd)}\n")
    proc = subprocess.Popen(
        cmd,
        cwd=str(cwd),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        universal_newlines=True,
    )

    assert proc.stdout is not None
    for line in proc.stdout:
        log(line)

    code = proc.wait()
    if check and code != 0:
        raise CommandError(f"Comando falhou (exit_code={code}): {' '.join(cmd)}")
    return code


def spawn_background(cmd: list[str], cwd: Path, env: dict[str, str] | None, log: callable) -> subprocess.Popen[str]:
    log(f"[bg] $ {' '.join(cmd)}\n")
    proc = subprocess.Popen(
        cmd,
        cwd=str(cwd),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        universal_newlines=True,
    )
    return proc


def _read_bg_output(proc: subprocess.Popen[str], prefix: str, log: callable) -> None:
    if proc.stdout is None:
        return
    try:
        for line in proc.stdout:
            log(f"{prefix}{line}")
    except Exception as e:
        log(f"{prefix}[erro lendo stdout bg] {e}\n")


def ensure_env_file(root: Path, log: callable) -> None:
    env_file = root / ".env"
    template = root / ".env.example"

    if env_file.exists():
        log(".env já existe.\n")
        return

    if not template.exists():
        raise CommandError("Não encontrei .env.example na raiz do projeto.")

    shutil.copyfile(template, env_file)
    log(".env criado a partir de .env.example.\n")


def update_env_value(root: Path, key: str, value: str, log: callable) -> None:
    env_file = root / ".env"
    if not env_file.exists():
        raise CommandError(".env não encontrado (rode criar/garantir .env primeiro).")

    lines = env_file.read_text(encoding="utf-8").splitlines()
    out: list[str] = []
    found = False

    for line in lines:
        if line.strip().startswith("#") or "=" not in line:
            out.append(line)
            continue

        k = line.split("=", 1)[0].strip()
        if k == key:
            out.append(f"{key}={value}")
            found = True
        else:
            out.append(line)

    if not found:
        out.append(f"{key}={value}")

    env_file.write_text("\n".join(out) + "\n", encoding="utf-8")
    log(f".env atualizado: {key}={value}\n")


def read_env_port(root: Path) -> str:
    env_file = root / ".env"
    if not env_file.exists():
        return "4000"

    for line in env_file.read_text(encoding="utf-8").splitlines():
        if line.strip().startswith("#"):
            continue
        if line.strip().startswith("PORT") and "=" in line:
            return line.split("=", 1)[1].strip() or "4000"

    return "4000"


def kill_node_processes(log: callable) -> None:
    if is_windows():
        # No psutil dependency.
        subprocess.run(["taskkill", "/F", "/IM", "node.exe"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        log("Processos node.exe finalizados (se existiam).\n")
    else:
        subprocess.run(["pkill", "-f", "node"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        log("Processos node finalizados (se existiam).\n")


def docker_up(services: list[str], root: Path, log: callable) -> None:
    base = docker_compose_base_cmd()
    run_stream([*base, "up", "-d", *services], cwd=root, env=None, log=log)


def run_package_script(script_name: str, log: callable, extra_args: list[str] | None = None, check: bool = True) -> None:
    root = repo_root()
    pm = package_manager_cmd()
    cmd = [*pm, "run", script_name]
    if extra_args:
        cmd.extend(extra_args)
    run_stream(cmd, cwd=root, env=None, log=log, check=check)


def start_mongodb_environment(cfg: RunnerConfig, log: callable) -> None:
    root = repo_root()

    log("=== Ambiente MongoDB (Prisma) ===\n")
    ensure_env_file(root, log)
    update_env_value(root, "DATABASE_PROVIDER", "PRISMA", log)

    kill_node_processes(log)

    docker_up(["mongodb"], root, log)
    log("Aguardando Replica Set (30s)...\n")
    time.sleep(30)

    pm = package_manager_cmd()
    run_stream([*pm, "run", "prisma:generate"], cwd=root, env=None, log=log)
    run_stream([*pm, "run", "prisma:push"], cwd=root, env=None, log=log)

    if cfg.seed_mongodb:
        run_stream([*pm, "run", "seed"], cwd=root, env=None, log=log)
    else:
        log("Seed MongoDB desativado (pelo UI).\n")

    bg_procs: list[tuple[subprocess.Popen[str], str]] = []

    if cfg.open_prisma_studio:
        p = spawn_background([*pm, "run", "prisma:studio"], cwd=root, env=None, log=log)
        bg_procs.append((p, "[prisma-studio] "))

    if cfg.start_dev_server:
        port = read_env_port(root)
        log(f"Iniciando servidor de desenvolvimento (PORT={port})...\n")
        run_stream([*pm, "run", "dev"], cwd=root, env=None, log=log, check=False)

    # Keep background readers alive as long as main thread exists.
    for proc, prefix in bg_procs:
        t = threading.Thread(target=_read_bg_output, args=(proc, prefix, log), daemon=True)
        t.start()


def start_dynamodb_environment(cfg: RunnerConfig, log: callable) -> None:
    root = repo_root()

    log("=== Ambiente DynamoDB Local ===\n")
    ensure_env_file(root, log)
    update_env_value(root, "DATABASE_PROVIDER", "DYNAMODB", log)

    kill_node_processes(log)

    docker_up(["dynamodb-local"], root, log)
    log("Aguardando DynamoDB estabilizar (5s)...\n")
    time.sleep(5)

    pm = package_manager_cmd()

    if cfg.create_dynamodb_tables:
        run_stream([*pm, "run", "dynamodb:create-tables"], cwd=root, env=None, log=log)
    else:
        log("Criação de tabelas DynamoDB desativada (pelo UI).\n")

    if cfg.seed_dynamodb:
        run_stream([*pm, "run", "dynamodb:seed"], cwd=root, env=None, log=log)
    else:
        log("Seed DynamoDB desativado (pelo UI).\n")

    bg_procs: list[tuple[subprocess.Popen[str], str]] = []

    if cfg.open_dynamodb_admin:
        env = os.environ.copy()
        env["DYNAMO_ENDPOINT"] = "http://localhost:8000"
        # The old script used: npx -y dynamodb-admin
        if not shutil.which("npx"):
            log("npx não encontrado; não foi possível abrir dynamodb-admin.\n")
        else:
            p = spawn_background(["npx", "-y", "dynamodb-admin"], cwd=root, env=env, log=log)
            bg_procs.append((p, "[dynamodb-admin] "))

    if cfg.start_dev_server:
        port = read_env_port(root)
        log(f"Iniciando servidor de desenvolvimento (PORT={port})...\n")
        run_stream([*pm, "run", "dev"], cwd=root, env=None, log=log, check=False)

    for proc, prefix in bg_procs:
        t = threading.Thread(target=_read_bg_output, args=(proc, prefix, log), daemon=True)
        t.start()


def start_complete_environment(cfg: RunnerConfig, log: callable) -> None:
    root = repo_root()

    log("=== Ambiente Completo (Mongo + Dynamo) ===\n")
    ensure_env_file(root, log)

    # In complete mode, scripts don't enforce provider here; keep whatever .env says.
    kill_node_processes(log)

    docker_up(["mongodb"], root, log)
    log("Aguardando MongoDB Replica Set (15s)...\n")
    time.sleep(15)

    docker_up(["dynamodb-local"], root, log)
    log("Aguardando DynamoDB estabilizar (5s)...\n")
    time.sleep(5)

    pm = package_manager_cmd()
    run_stream([*pm, "run", "prisma:generate"], cwd=root, env=None, log=log)
    run_stream([*pm, "run", "prisma:push"], cwd=root, env=None, log=log)

    if cfg.seed_mongodb:
        run_stream([*pm, "run", "seed"], cwd=root, env=None, log=log)
    else:
        log("Seed MongoDB desativado (pelo UI).\n")

    # DynamoDB tables are created in background in the original script.
    bg_procs: list[tuple[subprocess.Popen[str], str]] = []

    if cfg.create_dynamodb_tables:
        p_tables = spawn_background([*pm, "run", "dynamodb:create-tables"], cwd=root, env=None, log=log)
        bg_procs.append((p_tables, "[dynamodb:create-tables] "))

    if cfg.open_prisma_studio:
        p = spawn_background([*pm, "run", "prisma:studio"], cwd=root, env=None, log=log)
        bg_procs.append((p, "[prisma-studio] "))

    if cfg.open_dynamodb_admin:
        env = os.environ.copy()
        env["DYNAMO_ENDPOINT"] = "http://localhost:8000"
        if shutil.which("npx"):
            p = spawn_background(["npx", "-y", "dynamodb-admin"], cwd=root, env=env, log=log)
            bg_procs.append((p, "[dynamodb-admin] "))
        else:
            log("npx não encontrado; não foi possível abrir dynamodb-admin.\n")

    if cfg.start_dev_server:
        port = read_env_port(root)
        log(f"Iniciando servidor de desenvolvimento (PORT={port})...\n")
        run_stream([*pm, "run", "dev"], cwd=root, env=None, log=log, check=False)

    for proc, prefix in bg_procs:
        t = threading.Thread(target=_read_bg_output, args=(proc, prefix, log), daemon=True)
        t.start()


def start_dev_clean(cfg: RunnerConfig, log: callable) -> None:
    root = repo_root()

    log("=== Dev Limpo (matar Node + PORT=4000) ===\n")
    ensure_env_file(root, log)
    update_env_value(root, "PORT", "4000", log)

    kill_node_processes(log)

    pm = package_manager_cmd()

    if cfg.open_prisma_studio:
        p = spawn_background([*pm, "run", "prisma:studio"], cwd=root, env=None, log=log)
        t = threading.Thread(target=_read_bg_output, args=(p, "[prisma-studio] ", log), daemon=True)
        t.start()

    if cfg.start_dev_server:
        log("Iniciando servidor de desenvolvimento (PORT=4000)...\n")
        run_stream([*pm, "run", "dev"], cwd=root, env=None, log=log, check=False)


def _capture(cmd: list[str], cwd: Path | None = None) -> str:
    proc = subprocess.run(cmd, cwd=str(cwd) if cwd else None, capture_output=True, text=True)
    return (proc.stdout or "") + (proc.stderr or "")


def _is_admin_windows() -> bool:
    if not is_windows():
        return False
    # net session returns 0 only if admin.
    proc = subprocess.run(["net", "session"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return proc.returncode == 0


def _port_open(host: str, port: int, timeout: float = 0.3) -> bool:
    import socket

    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(timeout)
    try:
        return s.connect_ex((host, port)) == 0
    finally:
        s.close()


def _http_get(url: str, timeout: float = 3.0) -> str:
    req = Request(url, headers={"User-Agent": "launcher-ui"})
    with urlopen(req, timeout=timeout) as resp:
        data = resp.read()
    return data.decode("utf-8", errors="replace")


def verify_environment(log: callable) -> None:
    root = repo_root()
    log("=== Verificação do Ambiente ===\n")

    all_ok = True

    # Docker
    log("[1/6] Docker\n")
    try:
        run_stream(["docker", "ps"], cwd=root, env=None, log=log, check=True)
        log("✅ Docker está funcionando\n\n")
    except Exception:
        log("❌ Docker não está rodando\n\n")
        all_ok = False

    # Node
    log("[2/6] Node.js\n")
    if shutil.which("node"):
        log(f"✅ Node.js instalado - { _capture(['node','--version']).strip() }\n\n")
    else:
        log("❌ Node.js não encontrado\n\n")
        all_ok = False

    # npm/pnpm
    log("[3/6] Gerenciador de pacotes\n")
    pm = which_any(["pnpm", "npm"])
    if pm:
        log(f"✅ {pm} encontrado - { _capture([pm,'--version']).strip() }\n\n")
    else:
        log("❌ pnpm/npm não encontrado\n\n")
        all_ok = False

    # Ports
    log("[4/6] Portas\n")
    ports = {
        4000: "API",
        27017: "MongoDB",
        8000: "DynamoDB",
        5555: "Prisma Studio",
        8001: "DynamoDB Admin",
    }
    for p, name in ports.items():
        if _port_open("127.0.0.1", p):
            log(f"⚠️  Porta {p} ({name}) está em uso\n")
        else:
            log(f"✅ Porta {p} ({name}) está livre\n")
    log("\n")

    # Files
    log("[5/6] Arquivos\n")
    if (root / ".env").exists():
        env_content = (root / ".env").read_text(encoding="utf-8", errors="replace")
        log("✅ .env existe\n")
        if "DATABASE_PROVIDER=PRISMA" in env_content:
            log("🗄️  Configurado para: MongoDB + Prisma\n")
        if "DATABASE_PROVIDER=DYNAMODB" in env_content:
            log("📊 Configurado para: DynamoDB\n")
    else:
        log("⚠️  .env não existe\n")

    if (root / "node_modules").exists():
        log("✅ node_modules existe\n")
    else:
        log("⚠️  node_modules não existe (rode instalação)\n")

    if (root / "package.json").exists():
        log("✅ package.json existe\n\n")
    else:
        log("❌ package.json não encontrado\n\n")
        all_ok = False

    # Containers
    log("[6/6] Containers\n")
    try:
        out = _capture(["docker", "ps", "--filter", "name=rainer-blog-backend", "--format", "{{.Names}}: {{.Status}}"], cwd=root)
        if out.strip():
            log("✅ Containers encontrados:\n")
            for line in out.splitlines():
                log(f"- {line}\n")
        else:
            log("⚠️  Nenhum container do projeto rodando\n")
    except Exception:
        log("❌ Falha ao verificar containers\n")

    log("\n=== Resumo ===\n")
    if all_ok:
        log("✨ Ambiente pronto para uso\n")
    else:
        log("⚠️  Ambiente com problemas. Veja os itens acima.\n")


def docker_manage(action: str, log: callable) -> None:
    root = repo_root()
    base = docker_compose_base_cmd()

    if action == "start":
        log("=== Docker: start ===\n")
        run_stream([*base, "up", "-d", "mongodb", "dynamodb-local", "prisma-studio", "dynamodb-admin"], cwd=root, env=None, log=log)
        docker_manage("status", log)
        return

    if action == "stop":
        log("=== Docker: stop ===\n")
        run_stream([*base, "down"], cwd=root, env=None, log=log)
        return

    if action == "restart":
        log("=== Docker: restart ===\n")
        docker_manage("stop", log)
        time.sleep(2)
        docker_manage("start", log)
        return

    if action == "status":
        log("=== Docker: status ===\n")
        status_containers(log)
        return

    if action == "logs":
        log("=== Docker: logs (mongodb, dynamodb-local) ===\n")
        run_stream([*base, "logs", "-f", "mongodb", "dynamodb-local"], cwd=root, env=None, log=log, check=False)
        return

    if action == "clean":
        log("=== Docker: clean (down -v) ===\n")
        run_stream([*base, "down", "-v"], cwd=root, env=None, log=log)
        return

    raise CommandError(f"Ação docker inválida: {action}")


def switch_database_provider(provider: str, log: callable) -> None:
    root = repo_root()
    ensure_env_file(root, log)

    if provider == "status":
        env_content = (root / ".env").read_text(encoding="utf-8", errors="replace")
        if "DATABASE_PROVIDER=PRISMA" in env_content:
            log("Provider atual: PRISMA (MongoDB)\n")
        elif "DATABASE_PROVIDER=DYNAMODB" in env_content:
            log("Provider atual: DYNAMODB (DynamoDB)\n")
        else:
            log("Provider atual: não configurado\n")
        return

    if provider not in ("PRISMA", "DYNAMODB"):
        raise CommandError("Provider inválido. Use PRISMA, DYNAMODB ou status.")

    update_env_value(root, "DATABASE_PROVIDER", provider, log)
    log("Reinicie a aplicação para aplicar as mudanças.\n")


def status_containers(log: callable) -> None:
    root = repo_root()
    # Verify docker
    run_stream(["docker", "ps"], cwd=root, env=None, log=log, check=False)

    names = [
        ("rainer-blog-backend-mongodb", 27017, "MongoDB"),
        ("rainer-blog-backend-dynamodb", 8000, "DynamoDB Local"),
        ("rainer-blog-backend-prisma-studio", 5555, "Prisma Studio"),
        ("rainer-blog-backend-dynamodb-admin", 8001, "DynamoDB Admin"),
        ("rainer-blog-backend-api", 4000, "API"),
    ]

    log("\n=== Status containers (projeto) ===\n")
    running_out = _capture(["docker", "ps", "--format", "{{.Names}}"], cwd=root)
    running = set(line.strip() for line in running_out.splitlines() if line.strip())

    total = 0
    running_count = 0
    for name, port, label in names:
        total += 1
        if name in running:
            running_count += 1
            log(f"✅ {label} - Rodando (porta {port})\n")
        else:
            log(f"⚠️  {label} - Parado\n")

    log("\nResumo:\n")
    log(f"Total (conhecidos): {total}\n")
    log(f"Rodando: {running_count}\n")

    log("\nURLs:\n")
    if "rainer-blog-backend-mongodb" in running:
        log("- MongoDB: mongodb://localhost:27017\n")
    if "rainer-blog-backend-dynamodb" in running:
        log("- DynamoDB Local: http://localhost:8000\n")
    if "rainer-blog-backend-prisma-studio" in running:
        log("- Prisma Studio: http://localhost:5555\n")
    if "rainer-blog-backend-dynamodb-admin" in running:
        log("- DynamoDB Admin: http://localhost:8001\n")


def update_aws_credentials_ui(parent: tk.Tk, log: callable) -> None:
    root = repo_root()
    ensure_env_file(root, log)

    access_key = simpledialog.askstring("AWS", "Digite o AWS Access Key ID (AKIA...):", parent=parent)
    if not access_key:
        raise CommandError("Operação cancelada (Access Key vazio).")

    secret_key = simpledialog.askstring("AWS", "Digite o AWS Secret Access Key:", parent=parent, show="*")
    if secret_key is None or secret_key == "":
        raise CommandError("Operação cancelada (Secret vazio).")

    ok = messagebox.askyesno(
        "Confirmar",
        f"Atualizar .env com estas credenciais?\n\nAWS_ACCESS_KEY_ID: {access_key}\nAWS_SECRET_ACCESS_KEY: (oculto)",
        parent=parent,
    )
    if not ok:
        raise CommandError("Operação cancelada.")

    env_file = root / ".env"
    backup = root / f".env.backup.{int(time.time())}"
    shutil.copyfile(env_file, backup)
    log(f"Backup criado: {backup.name}\n")

    update_env_value(root, "AWS_ACCESS_KEY_ID", access_key, log)
    update_env_value(root, "AWS_SECRET_ACCESS_KEY", secret_key, log)
    log("✅ Credenciais AWS atualizadas.\n")


def finalize_configuration(log: callable) -> None:
    root = repo_root()
    log("=== Finalizar configuração (checklist) ===\n")

    log("[1/5] AWS CLI\n")
    if shutil.which("aws"):
        log("✅ AWS CLI encontrado\n")
        log(_capture(["aws", "--version"]).strip() + "\n\n")
    else:
        log("⚠️  AWS CLI não encontrado (instale se for usar AWS).\n\n")

    log("[2/5] Criando tabelas DynamoDB\n")
    run_package_script("dynamodb:create-tables", log, check=False)
    log("\n")

    log("[3/5] Populando MongoDB\n")
    run_package_script("mongodb:seed", log, check=False)
    log("\n")

    log("[4/5] Status containers\n")
    status_containers(log)
    log("\n")

    log("[5/5] Testando API (/health)\n")
    port = read_env_port(root)
    try:
        body = _http_get(f"http://localhost:{port}/health", timeout=3.0)
        log(f"✅ API respondeu na porta {port}\n")
        log(body + "\n")
    except URLError:
        log(f"⚠️  API não respondeu em http://localhost:{port}/health\n")
        log("Inicie com: pnpm run dev\n")


def _docker_list_ids(cmd: list[str], root: Path) -> list[str]:
    out = _capture(cmd, cwd=root)
    return [line.strip() for line in out.splitlines() if line.strip()]


def clean_environment_destructive(log: callable) -> None:
    root = repo_root()
    log("=== Limpar ambiente (DESTRUTIVO) ===\n")

    kill_node_processes(log)

    # Stop & remove containers
    ids = _docker_list_ids(["docker", "ps", "-aq"], root)
    if ids:
        for cid in ids:
            subprocess.run(["docker", "stop", cid], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            subprocess.run(["docker", "rm", "-f", cid], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        log("✅ Containers removidos\n")
    else:
        log("ℹ️  Nenhum container para remover\n")

    # Remove images
    images = _docker_list_ids(["docker", "images", "-q"], root)
    for img in images:
        subprocess.run(["docker", "rmi", "-f", img], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if images:
        log("✅ Imagens removidas\n")

    # Remove volumes
    vols = _docker_list_ids(["docker", "volume", "ls", "-q"], root)
    for v in vols:
        subprocess.run(["docker", "volume", "rm", "-f", v], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if vols:
        log("✅ Volumes removidos\n")

    subprocess.run(["docker", "system", "prune", "-a", "-f", "--volumes"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run(["docker", "network", "prune", "-f"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    log("✅ Docker system/network prune executado\n")

    # Project files
    nm = root / "node_modules"
    if nm.exists():
        shutil.rmtree(nm, ignore_errors=True)
        log("✅ node_modules removido\n")

    env_file = root / ".env"
    if env_file.exists():
        backup = root / f".env.backup.{int(time.time())}"
        shutil.copyfile(env_file, backup)
        env_file.unlink(missing_ok=True)
        log(f"✅ .env removido (backup: {backup.name})\n")

    logs_dir = root / "logs"
    if logs_dir.exists():
        shutil.rmtree(logs_dir, ignore_errors=True)
        log("✅ logs removido\n")

    for p in root.glob("*.log"):
        try:
            p.unlink()
        except Exception:
            pass
    for p in root.glob("*.tmp"):
        try:
            p.unlink()
        except Exception:
            pass
    log("✅ temporários removidos\n")

    if shutil.which("npm"):
        subprocess.run(["npm", "cache", "clean", "--force"], cwd=str(root), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        log("✅ cache do npm limpo\n")


def kill_node_processes_full(log: callable) -> None:
    root = repo_root()
    log("=== Matar processos Node/npm/pnpm e liberar portas ===\n")

    if is_windows():
        for exe in ("node.exe", "pnpm.exe", "npm.exe"):
            subprocess.run(["taskkill", "/F", "/IM", exe], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        for port in (3000, 4000, 5555, 6007):
            out = _capture(["netstat", "-ano"], cwd=root)
            pids: set[str] = set()
            for line in out.splitlines():
                if f":{port} " in line and "LISTENING" in line:
                    parts = [p for p in line.split(" ") if p]
                    if parts:
                        pids.add(parts[-1])
            for pid in pids:
                subprocess.run(["taskkill", "/F", "/PID", pid], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        log("✅ Processos finalizados (se existiam).\n")
    else:
        subprocess.run(["pkill", "-9", "node"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run(["pkill", "-9", "pnpm"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run(["pkill", "-9", "npm"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        log("✅ Processos finalizados (se existiam).\n")


def wsl_diagnose(log: callable) -> None:
    log("=== WSL diagnóstico ===\n")
    if not is_windows():
        log("WSL só faz sentido no Windows.\n")
        return

    log("wsl --status\n")
    out = _capture(["wsl", "--status"])
    log(out + "\n")

    for svc in ("LxssManager", "vmcompute"):
        log(f"sc query {svc}\n")
        log(_capture(["sc", "query", svc]) + "\n")


def wsl_fix_services(log: callable) -> None:
    log("=== WSL fix services (precisa Admin) ===\n")
    if not is_windows():
        log("WSL fix só no Windows.\n")
        return

    if not _is_admin_windows():
        raise CommandError("Para corrigir serviços, execute este launcher como Administrador.")

    for svc in ("LxssManager", "vmcompute"):
        subprocess.run(["sc", "config", svc, "start=", "auto"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run(["sc", "start", svc], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        log(f"✅ Serviço ajustado/iniciado: {svc}\n")


def wsl_restart(log: callable) -> None:
    log("=== WSL restart ===\n")
    if not is_windows():
        log("WSL restart só no Windows.\n")
        return
    run_stream(["wsl", "--shutdown"], cwd=repo_root(), env=None, log=log, check=False)
    time.sleep(3)
    wsl_diagnose(log)


def smoke_test_api_health(log: callable) -> None:
    root = repo_root()
    port = read_env_port(root)
    log(f"=== Smoke test: API /health (porta {port}) ===\n")
    try:
        body = _http_get(f"http://localhost:{port}/health", timeout=2.0)
        log("✅ OK\n")
        log(body + "\n")
    except Exception as e:
        log(f"⚠️  Falhou: {e}\n")


def smoke_test_ports(log: callable) -> None:
    log("=== Smoke test: portas ===\n")
    for p in (4000, 27017, 8000, 5555, 8001):
        log(f"- {p}: {'OPEN' if _port_open('127.0.0.1', p) else 'closed'}\n")


def memory_version_update(log: callable) -> None:
    log("=== Memória: atualizar versão (version:update) ===\n")
    run_package_script("version:update", log, check=True)


def memory_update(log: callable) -> None:
    log("=== Memória: atualizar memórias (memory:update) ===\n")
    run_package_script("memory:update", log, check=True)


def memory_sync(log: callable) -> None:
    log("=== Memória: sync (memory:sync) ===\n")
    run_package_script("memory:sync", log, check=True)


def sam_validate(log: callable) -> None:
    log("=== SAM: validate ===\n")
    run_package_script("sam:validate", log, check=False)


def sam_build(log: callable) -> None:
    log("=== SAM: build ===\n")
    run_package_script("sam:build", log, check=False)


def sam_deploy(env_name: str, log: callable) -> None:
    log(f"=== SAM: deploy ({env_name}) ===\n")
    if env_name == "default":
        run_package_script("sam:deploy", log, check=False)
        return
    if env_name == "dev":
        run_package_script("sam:deploy:dev", log, check=False)
        return
    if env_name == "staging":
        run_package_script("sam:deploy:staging", log, check=False)
        return
    if env_name == "prod":
        run_package_script("sam:deploy:prod", log, check=False)
        return
    raise CommandError(f"Ambiente SAM inválido: {env_name}")


def sam_logs(env_name: str, log: callable) -> None:
    log(f"=== SAM: logs ({env_name}) ===\n")
    if env_name == "dev":
        run_package_script("sam:logs:dev", log, check=False)
        return
    if env_name == "staging":
        run_package_script("sam:logs:staging", log, check=False)
        return
    if env_name == "prod":
        run_package_script("sam:logs:prod", log, check=False)
        return
    raise CommandError(f"Ambiente SAM inválido: {env_name}")


def sam_delete(env_name: str, log: callable) -> None:
    log(f"=== SAM: delete ({env_name}) ===\n")
    if env_name == "dev":
        run_package_script("sam:delete:dev", log, check=False)
        return
    if env_name == "staging":
        run_package_script("sam:delete:staging", log, check=False)
        return
    if env_name == "prod":
        run_package_script("sam:delete:prod", log, check=False)
        return
    raise CommandError(f"Ambiente SAM inválido: {env_name}")


class LauncherUI:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("Launcher Python - rainer-portfolio-backend")
        self.root.geometry("1150x760")

        self.log_queue: queue.Queue[str] = queue.Queue()
        self.worker: threading.Thread | None = None

        self.actions = self._build_actions()
        self.actions_by_key = {a.key: a for a in self.actions}

        self.selected_action_key = tk.StringVar(value="")
        self.parameter_value = tk.StringVar(value="")

        # Options reused by 00-iniciar-ambiente
        self.start_dev_server = tk.BooleanVar(value=True)
        self.open_prisma_studio = tk.BooleanVar(value=True)
        self.open_dynamodb_admin = tk.BooleanVar(value=True)
        self.seed_mongodb = tk.BooleanVar(value=True)
        self.create_dynamodb_tables = tk.BooleanVar(value=True)
        self.seed_dynamodb = tk.BooleanVar(value=False)

        self._build_ui()
        self._populate_actions_tree()
        self.root.after(80, self._poll_log)

    def _build_actions(self) -> list[ActionDef]:
        return [
            ActionDef(
                key="env_mongodb",
                category="00 - Iniciar Ambiente",
                label="Iniciar MongoDB (Prisma)",
                description="Setup MongoDB + Prisma + servidor",
                destructive=True,
            ),
            ActionDef(
                key="env_dynamodb",
                category="00 - Iniciar Ambiente",
                label="Iniciar DynamoDB Local",
                description="Setup DynamoDB + tabelas + servidor",
                destructive=True,
            ),
            ActionDef(
                key="env_complete",
                category="00 - Iniciar Ambiente",
                label="Iniciar Completo (Mongo + Dynamo)",
                description="Setup completo com Mongo + Dynamo + Prisma",
                destructive=True,
            ),
            ActionDef(
                key="env_dev_clean",
                category="00 - Iniciar Ambiente",
                label="Dev Limpo (matar Node + PORT=4000)",
                description="Finaliza processos Node e inicia dev",
                destructive=True,
            ),
            ActionDef(
                key="verify_env",
                category="01 - Verificar Ambiente",
                label="Verificar ambiente",
                description="Diagnóstico do ambiente (Docker/Node/ports/.env/containers)",
            ),
            ActionDef(
                key="docker_manage",
                category="02 - Gerenciar Docker",
                label="Gerenciar Docker (start/stop/restart/status/logs/clean)",
                description="Gerenciar docker-compose do ambiente local",
                parameter_kind="choice",
                parameter_label="Ação",
                parameter_choices=("start", "stop", "restart", "status", "logs", "clean"),
                destructive=True,
            ),
            ActionDef(
                key="switch_db",
                category="03 - Banco de Dados",
                label="Alternar banco (PRISMA/DYNAMODB/status)",
                description="Atualiza DATABASE_PROVIDER no .env",
                parameter_kind="choice",
                parameter_label="Provider",
                parameter_choices=("status", "PRISMA", "DYNAMODB"),
            ),
            ActionDef(
                key="status_containers",
                category="04 - Containers",
                label="Status containers",
                description="Exibe status e URLs do ambiente",
            ),
            ActionDef(
                key="aws_update",
                category="09 - AWS",
                label="Atualizar credenciais AWS no .env",
                description="Prompt de AccessKey/SecretKey e update no .env (com backup)",
                destructive=True,
            ),
            ActionDef(
                key="finalize",
                category="10 - Finalizar Configuração",
                label="Finalizar configuração (checklist)",
                description="Cria tabelas Dynamo, seed Mongo, status containers, testa /health",
                destructive=True,
            ),
            ActionDef(
                key="clean_all",
                category="11 - Limpar Ambiente",
                label="Reset completo (DESTRUTIVO)",
                description="Remove containers/imagens/volumes, apaga node_modules, remove .env",
                destructive=True,
            ),
            ActionDef(
                key="kill_node_full",
                category="12 - Utilitários",
                label="Matar processos Node/npm/pnpm (e portas)",
                description="Finaliza processos e libera portas comuns",
                destructive=True,
            ),
            ActionDef(
                key="wsl_diag",
                category="13 - WSL",
                label="WSL diagnóstico",
                description="Mostra status do WSL e serviços do Windows",
            ),
            ActionDef(
                key="wsl_fix",
                category="13 - WSL",
                label="WSL fix services (Admin)",
                description="Habilita/inicia serviços LxssManager/vmcompute",
                destructive=True,
            ),
            ActionDef(
                key="wsl_restart",
                category="13 - WSL",
                label="WSL restart",
                description="Executa wsl --shutdown e re-diagnóstico",
            ),
            ActionDef(
                key="test_ports",
                category="testes",
                label="Smoke test: portas",
                description="Checa se portas principais estão abertas",
            ),
            ActionDef(
                key="test_health",
                category="testes",
                label="Smoke test: /health",
                description="Chama http://localhost:<PORT>/health",
            ),
            ActionDef(
                key="memory_version_update",
                category="08 - Memória",
                label="Atualizar versão (version:update)",
                description="Executa: pnpm run version:update (tsx scripts/08-memoria/update-version.ts)",
                destructive=True,
            ),
            ActionDef(
                key="memory_update",
                category="08 - Memória",
                label="Atualizar memórias (memory:update)",
                description="Executa: pnpm run memory:update (tsx scripts/08-memoria/update-memory.ts)",
                destructive=True,
            ),
            ActionDef(
                key="memory_sync",
                category="08 - Memória",
                label="Sync memórias (memory:sync)",
                description="Executa: pnpm run memory:sync",
                destructive=True,
            ),
            ActionDef(
                key="sam_validate",
                category="SAM / Serverless",
                label="SAM validate",
                description="Executa: pnpm run sam:validate",
            ),
            ActionDef(
                key="sam_build",
                category="SAM / Serverless",
                label="SAM build",
                description="Executa: pnpm run sam:build",
                destructive=True,
            ),
            ActionDef(
                key="sam_deploy",
                category="SAM / Serverless",
                label="SAM deploy (default/dev/staging/prod)",
                description="Executa deploy via scripts sam:* do package.json",
                parameter_kind="choice",
                parameter_label="Ambiente",
                parameter_choices=("default", "dev", "staging", "prod"),
                destructive=True,
            ),
            ActionDef(
                key="sam_logs",
                category="SAM / Serverless",
                label="SAM logs (dev/staging/prod)",
                description="Tail de logs via scripts sam:logs:*",
                parameter_kind="choice",
                parameter_label="Ambiente",
                parameter_choices=("dev", "staging", "prod"),
            ),
            ActionDef(
                key="sam_delete",
                category="SAM / Serverless",
                label="SAM delete (dev/staging/prod)",
                description="Remove stack via scripts sam:delete:*",
                parameter_kind="choice",
                parameter_label="Ambiente",
                parameter_choices=("dev", "staging", "prod"),
                destructive=True,
            ),
        ]

    def _build_ui(self) -> None:
        outer = ttk.Frame(self.root, padding=10)
        outer.grid(row=0, column=0, sticky="nsew")
        self.root.grid_rowconfigure(0, weight=1)
        self.root.grid_columnconfigure(0, weight=1)

        outer.grid_rowconfigure(0, weight=1)
        outer.grid_columnconfigure(0, weight=1)
        outer.grid_columnconfigure(1, weight=2)

        left = ttk.Frame(outer)
        left.grid(row=0, column=0, sticky="nsew", padx=(0, 10))
        left.grid_rowconfigure(1, weight=1)
        left.grid_columnconfigure(0, weight=1)

        ttk.Label(left, text="Ações").grid(row=0, column=0, sticky="w")
        self.tree = ttk.Treeview(left, show="tree")
        self.tree.grid(row=1, column=0, sticky="nsew")
        self.tree.bind("<<TreeviewSelect>>", self._on_tree_select)

        yscroll = ttk.Scrollbar(left, orient="vertical", command=self.tree.yview)
        yscroll.grid(row=1, column=1, sticky="ns")
        self.tree.configure(yscrollcommand=yscroll.set)

        right = ttk.Frame(outer)
        right.grid(row=0, column=1, sticky="nsew")
        right.grid_rowconfigure(2, weight=1)
        right.grid_columnconfigure(0, weight=1)

        details = ttk.LabelFrame(right, text="Detalhes", padding=10)
        details.grid(row=0, column=0, sticky="ew")
        details.grid_columnconfigure(1, weight=1)

        ttk.Label(details, text="Descrição").grid(row=0, column=0, sticky="nw")
        self.desc_label = ttk.Label(details, text="Selecione uma ação.", wraplength=720)
        self.desc_label.grid(row=0, column=1, sticky="ew")

        self.param_label = ttk.Label(details, text="")
        self.param_combo = ttk.Combobox(details, textvariable=self.parameter_value, state="readonly")

        self.env_opts_frame = ttk.LabelFrame(details, text="Opções (Ambiente)", padding=8)
        self.env_opts_frame.grid(row=2, column=0, columnspan=2, sticky="ew", pady=(10, 0))

        ttk.Checkbutton(self.env_opts_frame, text="Iniciar servidor (pnpm dev)", variable=self.start_dev_server).grid(row=0, column=0, sticky="w")
        ttk.Checkbutton(self.env_opts_frame, text="Abrir Prisma Studio", variable=self.open_prisma_studio).grid(row=0, column=1, sticky="w", padx=(10, 0))
        ttk.Checkbutton(self.env_opts_frame, text="Abrir DynamoDB Admin", variable=self.open_dynamodb_admin).grid(row=0, column=2, sticky="w", padx=(10, 0))
        ttk.Checkbutton(self.env_opts_frame, text="Seed MongoDB", variable=self.seed_mongodb).grid(row=1, column=0, sticky="w", pady=(6, 0))
        ttk.Checkbutton(self.env_opts_frame, text="Criar tabelas DynamoDB", variable=self.create_dynamodb_tables).grid(row=1, column=1, sticky="w", padx=(10, 0), pady=(6, 0))
        ttk.Checkbutton(self.env_opts_frame, text="Seed DynamoDB", variable=self.seed_dynamodb).grid(row=1, column=2, sticky="w", padx=(10, 0), pady=(6, 0))

        buttons = ttk.Frame(right)
        buttons.grid(row=1, column=0, sticky="ew", pady=(10, 10))
        buttons.grid_columnconfigure(2, weight=1)

        self.run_btn = ttk.Button(buttons, text="Executar", command=self._on_run)
        self.run_btn.grid(row=0, column=0, sticky="w")

        self.clear_btn = ttk.Button(buttons, text="Limpar log", command=self._clear_log)
        self.clear_btn.grid(row=0, column=1, sticky="w", padx=(10, 0))

        self.cwd_label = ttk.Label(buttons, text=f"Repo: {repo_root()}")
        self.cwd_label.grid(row=0, column=3, sticky="e")

        log_frame = ttk.LabelFrame(right, text="Log", padding=8)
        log_frame.grid(row=2, column=0, sticky="nsew")
        log_frame.grid_rowconfigure(0, weight=1)
        log_frame.grid_columnconfigure(0, weight=1)

        self.log_text = tk.Text(log_frame, wrap="none")
        self.log_text.grid(row=0, column=0, sticky="nsew")
        self.log_text.configure(state="disabled")

        scroll = ttk.Scrollbar(log_frame, orient="vertical", command=self.log_text.yview)
        scroll.grid(row=0, column=1, sticky="ns")
        self.log_text.configure(yscrollcommand=scroll.set)

    def _populate_actions_tree(self) -> None:
        self.tree.delete(*self.tree.get_children())
        cats: dict[str, str] = {}

        for action in self.actions:
            if action.category not in cats:
                cats[action.category] = self.tree.insert("", "end", text=action.category, open=True)
            self.tree.insert(cats[action.category], "end", text=action.label, values=(action.key,))

    def _on_tree_select(self, _event: object) -> None:
        selection = self.tree.selection()
        if not selection:
            return

        item = selection[0]
        values = self.tree.item(item, "values")
        if not values:
            return

        key = values[0]
        self.selected_action_key.set(key)
        action = self.actions_by_key[key]
        self.desc_label.configure(text=action.description)

        if action.parameter_kind == "choice" and action.parameter_choices:
            self.param_label.configure(text=action.parameter_label or "Parâmetro")
            self.param_label.grid(row=1, column=0, sticky="w", pady=(10, 0))
            self.param_combo["values"] = list(action.parameter_choices)
            if self.parameter_value.get() not in action.parameter_choices:
                self.parameter_value.set(action.parameter_choices[0])
            self.param_combo.grid(row=1, column=1, sticky="ew", pady=(10, 0))
        else:
            self.param_label.grid_forget()
            self.param_combo.grid_forget()
            self.parameter_value.set("")

        is_env_action = key in {"env_mongodb", "env_dynamodb", "env_complete", "env_dev_clean"}
        if is_env_action:
            self.env_opts_frame.grid()
        else:
            self.env_opts_frame.grid_remove()

    def _log(self, text: str) -> None:
        self.log_queue.put(text)

    def _poll_log(self) -> None:
        try:
            while True:
                msg = self.log_queue.get_nowait()
                self.log_text.configure(state="normal")
                self.log_text.insert("end", msg)
                self.log_text.see("end")
                self.log_text.configure(state="disabled")
        except queue.Empty:
            pass
        self.root.after(80, self._poll_log)

    def _clear_log(self) -> None:
        self.log_text.configure(state="normal")
        self.log_text.delete("1.0", "end")
        self.log_text.configure(state="disabled")

    def _cfg(self) -> RunnerConfig:
        return RunnerConfig(
            start_dev_server=bool(self.start_dev_server.get()),
            open_prisma_studio=bool(self.open_prisma_studio.get()),
            open_dynamodb_admin=bool(self.open_dynamodb_admin.get()),
            seed_mongodb=bool(self.seed_mongodb.get()),
            create_dynamodb_tables=bool(self.create_dynamodb_tables.get()),
            seed_dynamodb=bool(self.seed_dynamodb.get()),
        )

    def _on_run(self) -> None:
        if self.worker and self.worker.is_alive():
            messagebox.showwarning("Em execução", "Já existe uma execução em andamento.")
            return

        key = self.selected_action_key.get()
        if not key:
            messagebox.showwarning("Seleção", "Selecione uma ação.")
            return

        action = self.actions_by_key[key]
        param = self.parameter_value.get().strip() if action.parameter_kind else ""

        if action.destructive:
            ok = messagebox.askyesno(
                "Confirmação",
                "Essa ação pode ser destrutiva (apagar dados/encerrar processos/alterar ambiente).\n\nDeseja continuar?",
            )
            if not ok:
                return

        self._clear_log()
        self._log("\n" + "=" * 90 + "\n")
        self._log(f"Ação: {action.category} :: {action.label}\n")
        if param:
            self._log(f"Parâmetro: {param}\n")
        self._log("=" * 90 + "\n\n")

        cfg = self._cfg()

        def work() -> None:
            try:
                if key == "env_mongodb":
                    start_mongodb_environment(cfg, self._log)
                elif key == "env_dynamodb":
                    start_dynamodb_environment(cfg, self._log)
                elif key == "env_complete":
                    start_complete_environment(cfg, self._log)
                elif key == "env_dev_clean":
                    start_dev_clean(cfg, self._log)
                elif key == "verify_env":
                    verify_environment(self._log)
                elif key == "docker_manage":
                    docker_manage(param or "status", self._log)
                elif key == "switch_db":
                    switch_database_provider(param or "status", self._log)
                elif key == "status_containers":
                    status_containers(self._log)
                elif key == "aws_update":
                    update_aws_credentials_ui(self.root, self._log)
                elif key == "finalize":
                    finalize_configuration(self._log)
                elif key == "clean_all":
                    clean_environment_destructive(self._log)
                elif key == "kill_node_full":
                    kill_node_processes_full(self._log)
                elif key == "wsl_diag":
                    wsl_diagnose(self._log)
                elif key == "wsl_fix":
                    wsl_fix_services(self._log)
                elif key == "wsl_restart":
                    wsl_restart(self._log)
                elif key == "test_ports":
                    smoke_test_ports(self._log)
                elif key == "test_health":
                    smoke_test_api_health(self._log)
                elif key == "memory_version_update":
                    memory_version_update(self._log)
                elif key == "memory_update":
                    memory_update(self._log)
                elif key == "memory_sync":
                    memory_sync(self._log)
                elif key == "sam_validate":
                    sam_validate(self._log)
                elif key == "sam_build":
                    sam_build(self._log)
                elif key == "sam_deploy":
                    sam_deploy(param or "default", self._log)
                elif key == "sam_logs":
                    sam_logs(param or "dev", self._log)
                elif key == "sam_delete":
                    sam_delete(param or "dev", self._log)
                else:
                    raise CommandError(f"Ação não implementada: {key}")
            except Exception as e:
                self._log(f"\n[ERRO] {e}\n")

        self.worker = threading.Thread(target=work, daemon=True)
        self.worker.start()


def self_check() -> int:
    root = repo_root()
    errors: list[str] = []

    if not (root / ".env.example").exists():
        errors.append(".env.example não encontrado na raiz")

    try:
        docker_compose_base_cmd()
    except Exception as e:
        errors.append(str(e))

    try:
        package_manager_cmd()
    except Exception as e:
        errors.append(str(e))

    if errors:
        print("SELF-CHECK: FAIL")
        for e in errors:
            print(f"- {e}")
        return 1

    print("SELF-CHECK: OK")
    return 0


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Launcher 100% Python (Tkinter) para o projeto")
    parser.add_argument("--self-check", action="store_true", help="Valida dependências (docker/pnpm/.env.example)")
    args = parser.parse_args(argv)

    if args.self_check:
        return self_check()

    root = tk.Tk()
    try:
        ttk.Style().theme_use("clam")
    except Exception:
        pass

    LauncherUI(root)
    root.mainloop()
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
