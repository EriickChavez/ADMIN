import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { ApiError } from "../../../api/client";
import { useAuth } from "../AuthProvider";

export function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login({ email: email.trim(), password });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No pudimos iniciar sesión. Inténtalo de nuevo.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="tl-login">
      <style>{`
        .tl-login {
          --tl-primary: #2563eb;
          --tl-secondary: #4f46e5;
          --tl-ink: #172033;
          --tl-muted: #64748b;
          --tl-border: #e5eaf2;
          --tl-success: #059669;
          display: grid;
          grid-template-columns: minmax(0, 1.04fr) minmax(0, .96fr);
          min-height: 100vh;
          min-height: 100svh;
          width: 100%;
          color: var(--tl-ink);
          background: #fff;
          font-family: inherit;
          overflow-wrap: anywhere;
        }

        .tl-login *,
        .tl-login *::before,
        .tl-login *::after {
          box-sizing: border-box;
        }

        .tl-login button,
        .tl-login input {
          font: inherit;
        }

        .tl-login button:focus-visible,
        .tl-login a:focus-visible,
        .tl-login input:focus-visible {
          outline: 3px solid rgba(37, 99, 235, .32);
          outline-offset: 3px;
        }

        .tl-login__visual {
          position: relative;
          isolation: isolate;
          display: flex;
          min-width: 0;
          flex-direction: column;
          justify-content: space-between;
          padding: clamp(26px, 4vw, 58px);
          overflow: hidden;
          color: #fff;
          background:
            radial-gradient(ellipse at 8% 85%, rgba(37, 99, 235, .32), transparent 42%),
            radial-gradient(ellipse at 100% 0%, rgba(99, 102, 241, .27), transparent 42%),
            linear-gradient(145deg, #101827, #172033 58%, #111827);
        }

        .tl-login__visual::before {
          position: absolute;
          z-index: -1;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.055) 1px, transparent 1px);
          background-size: 44px 44px;
          mask-image: linear-gradient(to bottom right, #000, transparent 82%);
          content: "";
          pointer-events: none;
        }

        .tl-login__orb {
          position: absolute;
          z-index: -1;
          top: 25%;
          right: -210px;
          width: 440px;
          aspect-ratio: 1;
          border: 1px solid rgba(147, 197, 253, .16);
          border-radius: 50%;
          box-shadow:
            0 0 0 42px rgba(147, 197, 253, .025),
            0 0 0 85px rgba(147, 197, 253, .025),
            0 0 0 128px rgba(147, 197, 253, .02);
          pointer-events: none;
        }

        .tl-login__brand {
          display: flex;
          align-items: center;
          gap: 13px;
          width: fit-content;
          min-width: 0;
          text-decoration: none;
          color: inherit;
        }

        .tl-login__brand-mark {
          display: grid;
          width: 46px;
          height: 46px;
          flex: 0 0 auto;
          place-items: center;
          border: 1px solid rgba(255,255,255,.17);
          border-radius: 15px;
          background: linear-gradient(135deg, #3b82f6, #4f46e5);
          box-shadow: 0 9px 28px rgba(37, 99, 235, .3);
        }

        .tl-login__brand-title {
          font-size: 14px;
          font-weight: 850;
          letter-spacing: 1.8px;
        }

        .tl-login__brand-subtitle {
          margin-top: 5px;
          color: #9eacc1;
          font-size: 9px;
          font-weight: 650;
          letter-spacing: 1.8px;
        }

        .tl-login__hero {
          width: 100%;
          max-width: 570px;
          margin: clamp(50px, 8vh, 100px) auto;
        }

        .tl-login__eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          max-width: 100%;
          padding: 9px 12px;
          border: 1px solid rgba(147, 197, 253, .2);
          border-radius: 999px;
          color: #bfdbfe;
          background: rgba(37, 99, 235, .12);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.2px;
        }

        .tl-login__eyebrow-dot {
          width: 7px;
          height: 7px;
          flex: 0 0 auto;
          border-radius: 50%;
          background: #60a5fa;
          box-shadow: 0 0 0 4px rgba(96, 165, 250, .13);
        }

        .tl-login__hero h1 {
          margin: 27px 0 19px;
          font-size: clamp(36px, 4.1vw, 64px);
          font-weight: 850;
          line-height: 1.08;
          letter-spacing: -.055em;
          overflow-wrap: normal;
        }

        .tl-login__gradient-text {
          color: #93c5fd;
          background: linear-gradient(90deg, #60a5fa, #a5b4fc);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .tl-login__hero-copy {
          max-width: 415px;
          margin: 0;
          color: #aab6c8;
          font-size: 13px;
          line-height: 1.95;
        }

        .tl-login__features {
          display: grid;
          gap: 22px;
          margin-top: 39px;
        }

        .tl-login__feature {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .tl-login__feature-icon {
          display: grid;
          width: 44px;
          height: 44px;
          flex: 0 0 auto;
          place-items: center;
          border: 1px solid rgba(147, 197, 253, .15);
          border-radius: 13px;
          color: #93c5fd;
          background: rgba(37, 99, 235, .13);
        }

        .tl-login__feature-title {
          color: #f8fafc;
          font-size: 12px;
          font-weight: 750;
        }

        .tl-login__feature-copy {
          margin-top: 5px;
          color: #9ba9bc;
          font-size: 10px;
          line-height: 1.7;
        }

        .tl-login__visual-footer,
        .tl-login__form-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .65px;
        }

        .tl-login__visual-footer {
          color: #8796ad;
        }

        .tl-login__visual-footer span:first-child {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .tl-login__form-side {
          display: flex;
          min-width: 0;
          min-height: 100vh;
          min-height: 100svh;
          flex-direction: column;
          justify-content: space-between;
          padding: clamp(24px, 4vw, 54px) clamp(24px, 5.5vw, 84px) 24px;
          background:
            radial-gradient(ellipse at 100% 0%, rgba(37, 99, 235, .045), transparent 35%),
            #fff;
        }

        .tl-login__mobile-brand {
          display: none;
        }

        .tl-login__form-wrap {
          width: 100%;
          max-width: 390px;
          margin: auto;
          padding: 44px 0;
        }

        .tl-login__form-eyebrow {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 20px;
          color: var(--tl-primary);
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 1.6px;
        }

        .tl-login__form-eyebrow::before {
          width: 24px;
          height: 2px;
          border-radius: 2px;
          background: var(--tl-primary);
          content: "";
        }

        .tl-login__form-title {
          margin: 0;
          color: #111827;
          font-size: clamp(29px, 3vw, 38px);
          font-weight: 850;
          line-height: 1.18;
          letter-spacing: -.055em;
          overflow-wrap: normal;
        }

        .tl-login__form-subtitle {
          margin: 13px 0 32px;
          color: #718096;
          font-size: 12px;
          line-height: 1.9;
        }

        .tl-login__form {
          display: grid;
          gap: 0;
        }

        .tl-login__label {
          display: block;
          margin-bottom: 9px;
          color: #334155;
          font-size: 11px;
          font-weight: 750;
        }

        .tl-login__field {
          display: flex;
          min-width: 0;
          min-height: 54px;
          align-items: center;
          gap: 11px;
          padding: 0 14px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          color: #94a3b8;
          background: #fafbfe;
          transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
        }

        .tl-login__field:focus-within {
          border-color: var(--tl-primary);
          background: #fff;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, .09);
        }

        .tl-login__field input {
          width: 100%;
          min-width: 0;
          min-height: 50px;
          padding: 0;
          border: 0;
          outline: 0;
          color: #172033;
          background: transparent;
          font-size: 12px;
        }

        .tl-login__field input::placeholder {
          color: #a1aaba;
        }

        .tl-login__field input:focus-visible {
          outline: none;
        }

        .tl-login__field-icon {
          flex: 0 0 auto;
        }

        .tl-login__password-label {
          margin-top: 21px;
        }

        .tl-login__visibility {
          display: grid;
          width: 34px;
          height: 34px;
          flex: 0 0 auto;
          place-items: center;
          border: 0;
          border-radius: 8px;
          color: #64748b;
          background: transparent;
          cursor: pointer;
          transition: color .18s ease, background .18s ease;
        }

        .tl-login__visibility:hover {
          color: var(--tl-primary);
          background: #eff6ff;
        }

        .tl-login__error {
          margin-top: 15px;
          padding: 12px 14px;
          border: 1px solid #fecaca;
          border-radius: 10px;
          color: #b91c1c;
          background: #fef2f2;
          font-size: 11px;
          line-height: 1.7;
        }

        .tl-login__submit {
          display: flex;
          width: 100%;
          min-height: 54px;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 25px;
          padding: 0 18px;
          border: 0;
          border-radius: 12px;
          color: #fff;
          background: linear-gradient(110deg, #2563eb, #4f46e5);
          box-shadow: 0 9px 22px rgba(37, 99, 235, .19);
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: transform .18s ease, box-shadow .18s ease, opacity .18s ease;
        }

        .tl-login__submit-label {
          flex: 1;
          text-align: center;
        }

        .tl-login__submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 27px rgba(37, 99, 235, .27);
        }

        .tl-login__submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .tl-login__submit:disabled {
          cursor: wait;
          opacity: .75;
        }

        .tl-login__spinner {
          width: 16px;
          height: 16px;
          flex: 0 0 auto;
          border: 2px solid rgba(255, 255, 255, .4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: tl-login-spin .7s linear infinite;
        }

        .tl-login__divider {
          display: flex;
          align-items: center;
          gap: 13px;
          margin: 29px 0 23px;
          color: #94a3b8;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.4px;
        }

        .tl-login__divider::before,
        .tl-login__divider::after {
          height: 1px;
          flex: 1;
          background: #e9edf4;
          content: "";
        }

        .tl-login__register {
          margin: 0;
          color: #718096;
          text-align: center;
          font-size: 11px;
          line-height: 1.9;
        }

        .tl-login__register a {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-left: 3px;
          color: var(--tl-primary);
          font-weight: 800;
          text-decoration: none;
        }

        .tl-login__register a:hover {
          color: var(--tl-secondary);
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .tl-login__security {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 29px;
          color: #8b97a9;
          font-size: 10px;
          line-height: 1.6;
          text-align: center;
        }

        .tl-login__security svg {
          flex: 0 0 auto;
          color: var(--tl-success);
        }

        .tl-login__form-footer {
          color: #94a3b8;
          font-size: 8px;
          letter-spacing: .4px;
        }

        @keyframes tl-login-spin {
          to { transform: rotate(360deg); }
        }

        @media (min-width: 1500px) {
          .tl-login {
            grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr);
          }

          .tl-login__hero {
            max-width: 620px;
          }

          .tl-login__form-side {
            padding-right: clamp(70px, 7vw, 120px);
            padding-left: clamp(70px, 7vw, 120px);
          }
        }

        @media (max-width: 1000px) {
          .tl-login {
            grid-template-columns: minmax(0, .95fr) minmax(0, 1.05fr);
          }

          .tl-login__visual {
            padding: 30px;
          }

          .tl-login__hero h1 {
            font-size: clamp(34px, 4.3vw, 46px);
          }

          .tl-login__form-side {
            padding-right: clamp(24px, 4vw, 42px);
            padding-left: clamp(24px, 4vw, 42px);
          }

          .tl-login__orb {
            right: -280px;
          }
        }

        @media (max-width: 760px) {
          .tl-login {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            min-height: 100svh;
          }

          .tl-login__visual {
            display: none;
          }

          .tl-login__form-side {
            min-height: 100vh;
            min-height: 100svh;
            padding: 22px clamp(20px, 6vw, 36px) 20px;
          }

          .tl-login__mobile-brand {
            display: flex;
            align-items: center;
            gap: 11px;
            width: fit-content;
          }

          .tl-login__mobile-brand .tl-login__brand-mark {
            width: 40px;
            height: 40px;
            border-radius: 12px;
          }

          .tl-login__mobile-brand .tl-login__brand-title {
            color: #172033;
            font-size: 12px;
          }

          .tl-login__mobile-brand .tl-login__brand-subtitle {
            color: #64748b;
            font-size: 8px;
          }

          .tl-login__form-wrap {
            max-width: 430px;
            padding: 43px 0;
          }

          .tl-login__form-title {
            font-size: clamp(30px, 7vw, 38px);
          }

          .tl-login__form-subtitle {
            margin-bottom: 30px;
          }
        }

        @media (max-width: 380px) {
          .tl-login__form-side {
            padding-right: 18px;
            padding-left: 18px;
          }

          .tl-login__form-wrap {
            padding: 32px 0;
          }

          .tl-login__form-eyebrow {
            font-size: 8px;
            letter-spacing: 1.2px;
          }

          .tl-login__form-footer span:last-child {
            display: none;
          }
        }

        @media (max-height: 680px) and (min-width: 761px) {
          .tl-login__hero {
            margin-top: 32px;
            margin-bottom: 32px;
          }

          .tl-login__features {
            gap: 13px;
            margin-top: 24px;
          }

          .tl-login__feature-icon {
            width: 38px;
            height: 38px;
          }

          .tl-login__form-wrap {
            padding: 24px 0;
          }

          .tl-login__form-subtitle {
            margin-bottom: 22px;
          }

          .tl-login__divider {
            margin-top: 20px;
            margin-bottom: 17px;
          }

          .tl-login__security {
            margin-top: 20px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .tl-login *,
          .tl-login *::before,
          .tl-login *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      <section className="tl-login__visual" aria-label="Sobre la plataforma">
        <div className="tl-login__orb" aria-hidden="true" />

        <div className="tl-login__brand" aria-label="Tournament">
          <span className="tl-login__brand-mark">
            <Trophy size={23} strokeWidth={2} />
          </span>
          <span>
            <span className="tl-login__brand-title">TOURNAMENT</span>
            <span
              className="tl-login__brand-subtitle"
              style={{ display: "block" }}
            >
              ADMINISTRATION PANEL
            </span>
          </span>
        </div>

        <div className="tl-login__hero">
          <div className="tl-login__eyebrow">
            <span className="tl-login__eyebrow-dot" />
            TU COMPETICIÓN, UNA NUEVA EXPERIENCIA
          </div>

          <h1>
            El juego sucede.
            <br />
            Tú tienes el{" "}
            <span className="tl-login__gradient-text">control.</span>
          </h1>

          <p className="tl-login__hero-copy">
            Todo lo que necesitas para gestionar tu torneo, desde la primera
            categoría hasta la gran final. Organizado, conectado y listo para
            competir.
          </p>

          <div className="tl-login__features">
            <div className="tl-login__feature">
              <span className="tl-login__feature-icon">
                <Users size={19} />
              </span>
              <div>
                <div className="tl-login__feature-title">
                  Equipos y categorías
                </div>
                <div className="tl-login__feature-copy">
                  Toda tu competición organizada en un solo lugar.
                </div>
              </div>
            </div>

            <div className="tl-login__feature">
              <span className="tl-login__feature-icon">
                <Zap size={19} />
              </span>
              <div>
                <div className="tl-login__feature-title">Fases y partidos</div>
                <div className="tl-login__feature-copy">
                  Administra encuentros y sigue cada resultado.
                </div>
              </div>
            </div>

            <div className="tl-login__feature">
              <span className="tl-login__feature-icon">
                <ShieldCheck size={19} />
              </span>
              <div>
                <div className="tl-login__feature-title">
                  Gestión centralizada
                </div>
                <div className="tl-login__feature-copy">
                  Tus herramientas de administración, siempre a mano.
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="tl-login__visual-footer">
          <span>
            <ShieldCheck size={14} />
            PLATAFORMA DE ADMINISTRACIÓN DEPORTIVA
          </span>
          <span>HECHO PARA COMPETIR</span>
        </footer>
      </section>

      <section className="tl-login__form-side">
        <div className="tl-login__mobile-brand">
          <span className="tl-login__brand-mark">
            <Trophy size={20} />
          </span>
          <span>
            <span className="tl-login__brand-title">TOURNAMENT</span>
            <span
              className="tl-login__brand-subtitle"
              style={{ display: "block" }}
            >
              ADMINISTRATION PANEL
            </span>
          </span>
        </div>

        <div className="tl-login__form-wrap">
          <div className="tl-login__form-eyebrow">
            <Sparkles size={14} />
            BIENVENIDO DE VUELTA
          </div>

          <h2 className="tl-login__form-title">
            Tu torneo
            <br />
            te está esperando.
          </h2>

          <p className="tl-login__form-subtitle">
            Accede a tu cuenta y continúa donde lo dejaste.
          </p>

          <form className="tl-login__form" onSubmit={handleSubmit}>
            <label className="tl-login__label" htmlFor="tl-login-email">
              Correo electrónico
            </label>

            <div className="tl-login__field">
              <Mail className="tl-login__field-icon" size={18} />
              <input
                id="tl-login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@correo.com"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required
              />
            </div>

            <label
              className="tl-login__label tl-login__password-label"
              htmlFor="tl-login-password"
            >
              Contraseña
            </label>

            <div className="tl-login__field">
              <LockKeyhole className="tl-login__field-icon" size={18} />
              <input
                id="tl-login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Ingresa tu contraseña"
                autoComplete="current-password"
                required
              />
              <button
                className="tl-login__visibility"
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
              <div className="tl-login__error" role="alert">
                {error}
              </div>
            )}

            <button
              className="tl-login__submit"
              type="submit"
              disabled={submitting}
            >
              <span className="tl-login__submit-label">
                {submitting ? "Iniciando sesión..." : "Iniciar sesión"}
              </span>

              {submitting ? (
                <span className="tl-login__spinner" aria-hidden="true" />
              ) : (
                <ArrowRight size={18} />
              )}
            </button>
          </form>

          <div className="tl-login__divider">ACCESO A TU PANEL</div>

          <p className="tl-login__register">
            ¿Todavía no tienes cuenta?
            <Link to="/register">
              Crear cuenta <ArrowDownRight size={14} />
            </Link>
          </p>

          <div className="tl-login__security">
            <ShieldCheck size={16} />
            Tu acceso está protegido y es privado.
          </div>
        </div>

        <footer className="tl-login__form-footer">
          <span>© {new Date().getFullYear()} Tournament</span>
          <span>ADMINISTRACIÓN DEPORTIVA</span>
        </footer>
      </section>
    </main>
  );
}
