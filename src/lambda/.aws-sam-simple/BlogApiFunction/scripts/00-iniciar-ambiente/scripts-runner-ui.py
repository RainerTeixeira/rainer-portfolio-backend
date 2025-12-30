import argparse
import os
import queue
import subprocess
import sys
import threading
import tkinter as tk
from dataclasses import dataclass
from pathlib import Path
from tkinter import messagebox, ttk


@dataclass(frozen=True)
class ScriptOption:
    label: str
    file_relative: str


@dataclass(frozen=True)
class Action:
    key: str
    label: str
    category: str
    description: str
    options: tuple[ScriptOption, ...]
    parameter_kind: str | None = None
    parameter_label: str | None = None
    parameter_choices: tuple[str, ...] | None = None
    destructive: bool = False


def _repo_root_from_scripts_dir(scripts_dir: Path) -> Path:
    return scripts_dir.parent


def _windows_powershell_command(script_path: Path, extra_args: list[str]) -> list[str]:
    return [
        "powershell",
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        str(script_path),
        *extra_args,
    ]


def _windows_cmd_command(script_path: Path, extra_args: list[str]) -> list[str]:
    # For .bat/.cmd files.
    return ["cmd", "/c", str(script_path), *extra_args]


def _bash_command(script_path: Path, extra_args: list[str]) -> list[str]:
    return ["bash", str(script_path), *extra_args]


def build_actions(scripts_dir: Path) -> list[Action]:
    def label_from_filename(name: str) -> str:
        base = name
        for ext in (".ps1", ".bat", ".cmd", ".sh"):
            if base.lower().endswith(ext):
                base = base[: -len(ext)]
                break
        base = base.replace("_", " ").replace("-", " ").strip()
        return " ".join(part.capitalize() for part in base.split())

    def category_from_relpath(rel: str) -> str:
        parts = rel.split("/")
        if len(parts) >= 2 and parts[0] == "testes":
            return f"testes/{parts[1]}"
        if parts:
            return parts[0]
        return "scripts"

    def option_label_for_suffix(suffix: str) -> str:
        return {
            ".ps1": "PowerShell",
            ".bat": "CMD",
            ".cmd": "CMD",
            ".sh": "Bash",
        }.get(suffix.lower(), suffix)

    def is_script_file(p: Path) -> bool:
        return p.suffix.lower() in (".ps1", ".bat", ".cmd", ".sh")

    def looks_destructive(rel: str) -> bool:
        low = rel.lower()
        return any(token in low for token in ("limpar", "clean", "reset", "prune", "matar", "kill"))

    # Discover all scripts recursively (including testes/*).
    grouped: dict[tuple[str, str], dict[str, list[ScriptOption]]] = {}
    for p in scripts_dir.rglob("*"):
        if not p.is_file() or not is_script_file(p):
            continue

        rel = p.relative_to(scripts_dir).as_posix()

        # Ignore helper files that aren't meant to be run directly.
        if rel.lower().endswith("docker-entrypoint.sh"):
            continue

        key_dir = category_from_relpath(rel)
        key_name = label_from_filename(p.name)

        grouped.setdefault((key_dir, key_name), {})
        per_suffix = grouped[(key_dir, key_name)]
        opt = ScriptOption(option_label_for_suffix(p.suffix), rel)
        per_suffix.setdefault(p.suffix.lower(), []).append(opt)

    actions: list[Action] = []
    for (category, label), per_suffix in sorted(grouped.items(), key=lambda x: (x[0][0], x[0][1])):
        # Choose a deterministic order in the option list.
        option_order: list[ScriptOption] = []
        for suffix in (".ps1", ".bat", ".cmd", ".sh"):
            option_order.extend(sorted(per_suffix.get(suffix, []), key=lambda o: o.file_relative))

        # action key must be unique.
        canonical_rel = option_order[0].file_relative if option_order else f"{category}/{label}"
        action_key = canonical_rel

        destructive = looks_destructive(canonical_rel)
        parameter_kind: str | None = None
        parameter_label: str | None = None
        parameter_choices: tuple[str, ...] | None = None

        # Overrides for known scripts with parameters.
        low = canonical_rel.lower()
        if low.endswith("02-gerenciar-docker/gerenciar-docker.ps1") or low.endswith("02-gerenciar-docker/gerenciar-docker.sh"):
            parameter_kind = "choice"
            parameter_label = "Ação"
            parameter_choices = ("start", "stop", "restart", "status", "logs", "clean")
            destructive = True
        if low.endswith("03-alternar-banco-dados/alternar-banco.ps1") or low.endswith("03-alternar-banco-dados/alternar-banco.sh"):
            parameter_kind = "choice"
            parameter_label = "Provider"
            parameter_choices = ("status", "PRISMA", "DYNAMODB")

        actions.append(
            Action(
                key=action_key,
                label=label,
                category=category,
                description=canonical_rel,
                options=tuple(option_order),
                parameter_kind=parameter_kind,
                parameter_label=parameter_label,
                parameter_choices=parameter_choices,
                destructive=destructive,
            )
        )

    # If discovery returns nothing (unexpected), fall back to empty list.
    return actions


def resolve_existing_option(scripts_dir: Path, action: Action) -> ScriptOption | None:
    for opt in action.options:
        p = scripts_dir / opt.file_relative
        if p.exists():
            return opt
    return None


def build_command_for_option(
    scripts_dir: Path,
    option: ScriptOption,
    parameter: str | None,
) -> tuple[list[str], Path]:
    script_path = (scripts_dir / option.file_relative).resolve()

    extra_args: list[str] = []
    if parameter:
        extra_args.append(parameter)

    suffix = script_path.suffix.lower()
    if suffix == ".ps1":
        return _windows_powershell_command(script_path, extra_args), script_path
    if suffix in (".bat", ".cmd"):
        return _windows_cmd_command(script_path, extra_args), script_path
    if suffix == ".sh":
        return _bash_command(script_path, extra_args), script_path

    raise ValueError(f"Tipo de script não suportado: {script_path.name}")


class ScriptRunnerUI:
    def __init__(self, root: tk.Tk, scripts_dir: Path):
        self.root = root
        self.scripts_dir = scripts_dir
        self.repo_root = _repo_root_from_scripts_dir(scripts_dir)

        self.actions = build_actions(scripts_dir)
        self.actions_by_key = {a.key: a for a in self.actions}

        self.proc: subprocess.Popen[str] | None = None
        self.output_queue: queue.Queue[str] = queue.Queue()
        self.reader_thread: threading.Thread | None = None
        self.stop_requested = False

        self.selected_action_key = tk.StringVar(value="")
        self.selected_option_label = tk.StringVar(value="")
        self.parameter_value = tk.StringVar(value="")

        self._build_ui()
        self._populate_actions_tree()

        self.root.protocol("WM_DELETE_WINDOW", self._on_close)

    def _build_ui(self) -> None:
        self.root.title("Scripts Runner - rainer-portfolio-backend")
        self.root.geometry("1050x680")

        outer = ttk.Frame(self.root, padding=10)
        outer.grid(row=0, column=0, sticky="nsew")
        self.root.grid_rowconfigure(0, weight=1)
        self.root.grid_columnconfigure(0, weight=1)

        outer.grid_rowconfigure(0, weight=1)
        outer.grid_columnconfigure(0, weight=1)
        outer.grid_columnconfigure(1, weight=2)

        # Left: actions
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

        # Right: details + log
        right = ttk.Frame(outer)
        right.grid(row=0, column=1, sticky="nsew")
        right.grid_rowconfigure(2, weight=1)
        right.grid_columnconfigure(0, weight=1)

        details = ttk.LabelFrame(right, text="Detalhes", padding=10)
        details.grid(row=0, column=0, sticky="ew")
        details.grid_columnconfigure(1, weight=1)

        ttk.Label(details, text="Descrição").grid(row=0, column=0, sticky="nw")
        self.desc_label = ttk.Label(details, text="Selecione uma ação à esquerda.", wraplength=650)
        self.desc_label.grid(row=0, column=1, sticky="ew")

        ttk.Label(details, text="Script").grid(row=1, column=0, sticky="w", pady=(10, 0))
        self.option_combo = ttk.Combobox(details, textvariable=self.selected_option_label, state="readonly")
        self.option_combo.grid(row=1, column=1, sticky="ew", pady=(10, 0))
        self.option_combo.bind("<<ComboboxSelected>>", lambda _e: self._sync_parameter_ui())

        self.param_label = ttk.Label(details, text="")
        self.param_combo = ttk.Combobox(details, textvariable=self.parameter_value, state="readonly")

        buttons = ttk.Frame(right)
        buttons.grid(row=1, column=0, sticky="ew", pady=(10, 10))
        buttons.grid_columnconfigure(0, weight=1)

        self.run_btn = ttk.Button(buttons, text="Executar", command=self._run_selected)
        self.run_btn.grid(row=0, column=0, sticky="w")

        self.stop_btn = ttk.Button(buttons, text="Parar", command=self._stop_process, state="disabled")
        self.stop_btn.grid(row=0, column=1, sticky="w", padx=(10, 0))

        self.clear_btn = ttk.Button(buttons, text="Limpar log", command=self._clear_log)
        self.clear_btn.grid(row=0, column=2, sticky="w", padx=(10, 0))

        self.cwd_label = ttk.Label(buttons, text=f"CWD: {self.repo_root}")
        self.cwd_label.grid(row=0, column=3, sticky="e")

        log_frame = ttk.LabelFrame(right, text="Log", padding=8)
        log_frame.grid(row=2, column=0, sticky="nsew")
        log_frame.grid_rowconfigure(0, weight=1)
        log_frame.grid_columnconfigure(0, weight=1)

        self.log_text = tk.Text(log_frame, wrap="none", height=18)
        self.log_text.grid(row=0, column=0, sticky="nsew")
        self.log_text.configure(state="disabled")

        log_scroll = ttk.Scrollbar(log_frame, orient="vertical", command=self.log_text.yview)
        log_scroll.grid(row=0, column=1, sticky="ns")
        self.log_text.configure(yscrollcommand=log_scroll.set)

        # periodic UI update from queue
        self.root.after(100, self._poll_output)

    def _populate_actions_tree(self) -> None:
        self.tree.delete(*self.tree.get_children())
        categories: dict[str, str] = {}

        for action in self.actions:
            if action.category not in categories:
                node = self.tree.insert("", "end", text=action.category, open=True)
                categories[action.category] = node

            self.tree.insert(categories[action.category], "end", text=action.label, values=(action.key,))

    def _on_tree_select(self, _event: object) -> None:
        selection = self.tree.selection()
        if not selection:
            return

        item_id = selection[0]
        values = self.tree.item(item_id, "values")
        if not values:
            # category header
            return

        action_key = values[0]
        self.selected_action_key.set(action_key)
        action = self.actions_by_key[action_key]

        self.desc_label.configure(text=action.description)

        # options
        available_opts = [opt for opt in action.options if (self.scripts_dir / opt.file_relative).exists()]
        if not available_opts:
            self.selected_option_label.set("")
            self.option_combo["values"] = []
        else:
            self.option_combo["values"] = [opt.label for opt in available_opts]
            preferred = resolve_existing_option(self.scripts_dir, action)
            self.selected_option_label.set(preferred.label if preferred else available_opts[0].label)

        self._sync_parameter_ui()

    def _sync_parameter_ui(self) -> None:
        action_key = self.selected_action_key.get()
        if not action_key:
            self._hide_parameter()
            return

        action = self.actions_by_key[action_key]
        if action.parameter_kind == "choice" and action.parameter_choices:
            self.param_label.configure(text=action.parameter_label or "Parâmetro")
            self.param_label.grid(row=2, column=0, sticky="w", pady=(10, 0))

            self.param_combo["values"] = list(action.parameter_choices)
            if not self.parameter_value.get() or self.parameter_value.get() not in action.parameter_choices:
                self.parameter_value.set(action.parameter_choices[0])

            self.param_combo.grid(row=2, column=1, sticky="ew", pady=(10, 0))
        else:
            self._hide_parameter()

    def _hide_parameter(self) -> None:
        self.param_label.grid_forget()
        self.param_combo.grid_forget()
        self.parameter_value.set("")

    def _append_log(self, text: str) -> None:
        self.log_text.configure(state="normal")
        self.log_text.insert("end", text)
        self.log_text.see("end")
        self.log_text.configure(state="disabled")

    def _clear_log(self) -> None:
        self.log_text.configure(state="normal")
        self.log_text.delete("1.0", "end")
        self.log_text.configure(state="disabled")

    def _poll_output(self) -> None:
        try:
            while True:
                msg = self.output_queue.get_nowait()
                self._append_log(msg)
        except queue.Empty:
            pass

        if self.proc is not None:
            code = self.proc.poll()
            if code is not None:
                self.output_queue.put(f"\n[processo finalizado] exit_code={code}\n")
                self.proc = None
                self.run_btn.configure(state="normal")
                self.stop_btn.configure(state="disabled")

        self.root.after(100, self._poll_output)

    def _run_selected(self) -> None:
        if self.proc is not None:
            messagebox.showwarning("Em execução", "Já existe um script em execução. Pare antes de iniciar outro.")
            return

        action_key = self.selected_action_key.get()
        if not action_key:
            messagebox.showwarning("Seleção", "Selecione uma ação na lista.")
            return

        action = self.actions_by_key[action_key]

        # find chosen option
        chosen_label = self.selected_option_label.get()
        available_opts = [opt for opt in action.options if (self.scripts_dir / opt.file_relative).exists()]
        chosen_opt = next((o for o in available_opts if o.label == chosen_label), None)
        if not chosen_opt and available_opts:
            chosen_opt = available_opts[0]
        if not chosen_opt:
            messagebox.showerror("Script não encontrado", "Nenhum script disponível foi encontrado para essa ação.")
            return

        parameter = self.parameter_value.get().strip() if action.parameter_kind else ""
        if action.parameter_kind and not parameter:
            messagebox.showwarning("Parâmetro", "Selecione o parâmetro.")
            return

        # confirmations
        if action.destructive:
            if action.key == "docker_manage" and parameter != "clean":
                pass
            else:
                ok = messagebox.askyesno(
                    "Confirmação",
                    "Essa ação pode ser destrutiva (apagar dados/encerrar processos).\n\nDeseja continuar?",
                )
                if not ok:
                    return

        try:
            cmd, script_path = build_command_for_option(self.scripts_dir, chosen_opt, parameter if parameter else None)
        except Exception as e:
            messagebox.showerror("Erro", str(e))
            return

        env = os.environ.copy()
        env["PYTHONIOENCODING"] = "utf-8"

        self._append_log("\n" + "=" * 90 + "\n")
        self._append_log(f"Ação: {action.label}\n")
        self._append_log(f"Script: {script_path}\n")
        if parameter:
            self._append_log(f"Parâmetro: {parameter}\n")
        self._append_log(f"Comando: {' '.join(cmd)}\n")
        self._append_log("=" * 90 + "\n\n")

        self.stop_requested = False
        self.run_btn.configure(state="disabled")
        self.stop_btn.configure(state="normal")

        try:
            self.proc = subprocess.Popen(
                cmd,
                cwd=str(self.repo_root),
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True,
                env=env,
            )
        except FileNotFoundError as e:
            self.proc = None
            self.run_btn.configure(state="normal")
            self.stop_btn.configure(state="disabled")
            messagebox.showerror(
                "Falha ao executar",
                f"Não consegui executar o comando.\n\nDetalhes: {e}\n\n"
                "Dica: para scripts .ps1, é necessário ter o PowerShell disponível. Para .sh, é necessário ter bash.",
            )
            return

        self.reader_thread = threading.Thread(target=self._reader_loop, daemon=True)
        self.reader_thread.start()

    def _reader_loop(self) -> None:
        assert self.proc is not None
        assert self.proc.stdout is not None

        try:
            for line in self.proc.stdout:
                if self.stop_requested:
                    break
                self.output_queue.put(line)
        except Exception as e:
            self.output_queue.put(f"\n[erro lendo stdout] {e}\n")

    def _stop_process(self) -> None:
        if self.proc is None:
            return

        self.stop_requested = True
        try:
            self.proc.terminate()
        except Exception:
            pass

        self.output_queue.put("\n[solicitado] parar processo\n")

    def _on_close(self) -> None:
        if self.proc is not None:
            ok = messagebox.askyesno("Sair", "Existe um processo em execução. Deseja parar e sair?")
            if not ok:
                return
            self._stop_process()

        self.root.destroy()


def list_actions(scripts_dir: Path) -> int:
    actions = build_actions(scripts_dir)
    for a in actions:
        print(f"[{a.category}] {a.label} :: key={a.key}")
        for opt in a.options:
            p = scripts_dir / opt.file_relative
            exists = "OK" if p.exists() else "MISSING"
            print(f"  - {opt.label}: {opt.file_relative} ({exists})")
        if a.parameter_kind and a.parameter_choices:
            print(f"  - param: {a.parameter_label} -> {', '.join(a.parameter_choices)}")
        if a.destructive:
            print("  - destructive: true")
    return 0


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="UI para executar scripts do projeto")
    parser.add_argument("--list-actions", action="store_true", help="Lista ações detectadas e sai")
    args = parser.parse_args(argv)

    scripts_dir = Path(__file__).resolve().parent

    if args.list_actions:
        return list_actions(scripts_dir)

    root = tk.Tk()
    try:
        ttk.Style().theme_use("clam")
    except Exception:
        pass

    ScriptRunnerUI(root, scripts_dir)
    root.mainloop()
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
