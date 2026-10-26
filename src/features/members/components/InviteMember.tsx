import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { Button } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import {
  useCreateMemberAccount,
  useInviteMember,
  useLookupUser,
} from "../hooks";
import { getMemberErrorMessage, isUserNotFound } from "../utils/errors";

type Mode = "invite" | "create";

const field =
  "w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

// Contraseña temporal para compartir por fuera con la persona invitada
// (no hay proveedor de correo, así que no hay invitación por email).
function generatePassword(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/[+/=]/g, "")
    .slice(0, 12);
}

export function InviteMember({
  tournamentId,
  onDone,
}: {
  tournamentId: string;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<Mode>("invite");

  const [email, setEmail] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const lookup = useLookupUser(searchEmail);
  const invite = useInviteMember(tournamentId);

  const [createEmail, setCreateEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const createAccount = useCreateMemberAccount(tournamentId);

  function switchToCreate(prefillEmail: string) {
    setCreateEmail(prefillEmail);
    setMode("create");
  }

  async function handleCopyPassword() {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
  }

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    createAccount.mutate(
      {
        email: createEmail.trim(),
        displayName: displayName.trim(),
        password,
      },
      { onSuccess: onDone },
    );
  }

  return (
    <Card className="mb-6 p-5 sm:p-6">
      <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1 text-sm font-medium">
        {(
          [
            ["invite", "Invitar cuenta existente"],
            ["create", "Crear cuenta nueva"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`flex-1 rounded-md px-3 py-1.5 transition-colors ${
              mode === value
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "invite" && (
        <div>
          <p className="mb-3 text-sm text-slate-500">
            Busca a alguien que ya tenga cuenta en la plataforma.
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setSearchEmail(email.trim());
                }
              }}
              placeholder="correo@ejemplo.com"
              className={field}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSearchEmail(email.trim())}
              disabled={!email.trim()}
            >
              <Search size={16} />
              Buscar
            </Button>
          </div>

          <div className="mt-4 min-h-16">
            {lookup.isLoading && (
              <p className="text-sm text-slate-400">Buscando…</p>
            )}

            {lookup.error && (
              <div>
                <p className="text-sm text-red-600">
                  {isUserNotFound(lookup.error)
                    ? "No existe ninguna cuenta con ese correo"
                    : getMemberErrorMessage(lookup.error)}
                </p>
                {isUserNotFound(lookup.error) && (
                  <button
                    type="button"
                    onClick={() => switchToCreate(searchEmail)}
                    className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Crear cuenta nueva con este correo
                  </button>
                )}
              </div>
            )}

            {lookup.user && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                    {lookup.user.displayName.slice(0, 2).toUpperCase()}
                  </span>
                  <p className="truncate text-sm font-medium text-slate-900">
                    {lookup.user.displayName}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() =>
                    invite.mutate(lookup.user!.id, { onSuccess: onDone })
                  }
                  disabled={invite.isPending}
                  className="shrink-0"
                >
                  Invitar como Admin
                </Button>
              </div>
            )}

            {invite.isError && (
              <p className="mt-2 text-sm text-red-600">
                {getMemberErrorMessage(invite.error)}
              </p>
            )}
          </div>
        </div>
      )}

      {mode === "create" && (
        <form onSubmit={handleCreate} className="space-y-4">
          <p className="text-sm text-slate-500">
            Crea una cuenta y agrégala como Admin de este torneo.
          </p>

          <div>
            <label
              htmlFor="member-email"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Correo
            </label>
            <input
              id="member-email"
              type="email"
              required
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className={field}
            />
          </div>

          <div>
            <label
              htmlFor="member-name"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Nombre
            </label>
            <input
              id="member-name"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nombre y apellido"
              autoComplete="off"
              className={field}
            />
          </div>

          <div>
            <label
              htmlFor="member-password"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Contraseña temporal
            </label>
            <div className="flex gap-2">
              <input
                id="member-password"
                type="text"
                required
                minLength={8}
                maxLength={128}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setCopied(false);
                }}
                placeholder="Mínimo 8 caracteres"
                autoComplete="off"
                className={field}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setPassword(generatePassword());
                  setCopied(false);
                }}
              >
                Generar
              </Button>
            </div>
            {password && (
              <button
                type="button"
                onClick={handleCopyPassword}
                className="mt-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                {copied ? "Copiada ✓" : "Copiar contraseña"}
              </button>
            )}
            <p className="mt-1 text-xs text-slate-500">
              Compártela con la persona por fuera de la plataforma; no se envía
              por correo.
            </p>
          </div>

          {createAccount.isError && (
            <p className="text-sm text-red-600">
              {getMemberErrorMessage(createAccount.error)}
            </p>
          )}

          <Button type="submit" disabled={createAccount.isPending}>
            {createAccount.isPending ? "Creando…" : "Crear y agregar"}
          </Button>
        </form>
      )}
    </Card>
  );
}
