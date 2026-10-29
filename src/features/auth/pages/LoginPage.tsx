import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { ApiError } from "../../../api/client";
import { APP_BRANDING } from "../../../shared/config/app-branding";
import { useAuth } from "../AuthProvider";
import "./LoginPage.css";

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const LogoIcon = APP_BRANDING.logoIcon;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login({ email: email.trim(), password });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Ocurrió un error inesperado. Inténtalo de nuevo.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <section
        className="login-showcase"
        aria-label="Administración de torneos"
      >
        <div className="login-showcase-grid" aria-hidden="true" />

        <div className="login-brand">
          <span className="login-brand-mark">
            <LogoIcon size={22} strokeWidth={2.3} />
          </span>
          <span className="login-brand-name">
            {APP_BRANDING.namePrefix}
            <span>{APP_BRANDING.nameSuffix}</span>
          </span>
        </div>

        <div className="login-showcase-copy">
          <span className="login-eyebrow">
            <span className="login-eyebrow-dot" />
            TU TORNEO, BAJO CONTROL
          </span>

          <h1>
            La pasión se juega.
            <br />
            <span>La gestión se domina.</span>
          </h1>

          <p>
            Organiza equipos, coordina jornadas y lleva cada competición al
            siguiente nivel desde un solo lugar.
          </p>

          <div className="login-feature-list">
            <div className="login-feature">
              <span className="login-feature-icon">
                <Users size={18} />
              </span>
              <div>
                <strong>Todo tu torneo conectado</strong>
                <small>Equipos, jugadores y categorías en orden.</small>
              </div>
            </div>

            <div className="login-feature">
              <span className="login-feature-icon">
                <Zap size={18} />
              </span>
              <div>
                <strong>Menos administración. Más juego.</strong>
                <small>Partidos, resultados y fases en un solo panel.</small>
              </div>
            </div>
          </div>
        </div>

        <div className="login-showcase-footer">
          <span>
            <ShieldCheck size={15} /> Plataforma de administración
          </span>
          <span>HECHO PARA COMPETIR</span>
        </div>

        <div className="login-ball-art" aria-hidden="true">
          <div className="login-ball-ring login-ball-ring-one" />
          <div className="login-ball-ring login-ball-ring-two" />
          <div className="login-ball-core">
            <LogoIcon size={58} strokeWidth={1.1} />
          </div>
        </div>
      </section>

      <section className="login-form-side">
        <div className="login-mobile-brand">
          <span className="login-brand-mark">
            <LogoIcon size={20} />
          </span>
          <span className="login-brand-name">
            {APP_BRANDING.namePrefix}
            <span>{APP_BRANDING.nameSuffix}</span>
          </span>
        </div>

        <div className="login-form-wrap">
          <div className="login-heading">
            <span className="login-heading-kicker">BIENVENIDO DE VUELTA</span>
            <h2>Qué bueno verte.</h2>
            <p>Inicia sesión para continuar con tu torneo.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-label" htmlFor="login-email">
              Correo electrónico
            </label>

            <div className="login-input-wrap">
              <Mail size={18} aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                autoComplete="email"
                autoCapitalize="none"
                autoFocus
              />
            </div>

            <div className="login-password-heading">
              <label className="login-label" htmlFor="login-password">
                Contraseña
              </label>
            </div>

            <div className="login-input-wrap">
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                required
                autoComplete="current-password"
              />

              <button
                className="login-password-toggle"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <button
              className="login-submit"
              type="submit"
              disabled={submitting}
            >
              <span>
                {submitting ? "Iniciando sesión..." : "Iniciar sesión"}
              </span>
              {!submitting && <ArrowRight size={18} />}
              {submitting && (
                <span className="login-spinner" aria-hidden="true" />
              )}
            </button>
          </form>

          <div className="login-divider">
            <span>ACCESO A TU PANEL</span>
          </div>

          <p className="login-register">
            ¿Todavía no tienes una cuenta?{" "}
            <Link to="/register">
              Crear cuenta <ArrowRight size={14} />
            </Link>
          </p>

          <p className="login-security">
            <ShieldCheck size={15} /> Tu acceso está protegido y es privado.
          </p>
        </div>

        <footer className="login-bottom">
          <span>
            © {new Date().getFullYear()} {APP_BRANDING.name}
          </span>
          <span>{APP_BRANDING.tagline.toUpperCase()}</span>
        </footer>
      </section>
    </main>
  );
}
