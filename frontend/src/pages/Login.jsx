import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail, Stethoscope } from "lucide-react";
import { supabase } from "../supabase";

import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (authError) {
      setError("Email ou mot de passe incorrect.");
      return;
    }

    navigate("/dashboard");
  }

  return (
    <div className="login-page">
      <div className="login-decoration login-decoration-one" />
      <div className="login-decoration login-decoration-two" />

      <div className="login-container">
        <section className="login-brand-panel">
          <div className="login-brand">
            <div className="login-brand-icon">
              <Stethoscope size={30} />
            </div>

            <div>
              <h1>Tabibi</h1>
              <p>Smart Medical Assistant</p>
            </div>
          </div>

          <div className="login-introduction">
            <span className="login-label">ASSISTANT MÉDICAL INTELLIGENT</span>

            <h2>
              Simplifiez la gestion de votre cabinet médical.
            </h2>

            <p>
              Centralisez vos messages WhatsApp, vos rendez-vous et vos
              patients dans une seule plateforme professionnelle.
            </p>
          </div>

          <div className="login-features">
            <div className="login-feature">
              <span>✓</span>
              <p>Gestion centralisée des conversations</p>
            </div>

            <div className="login-feature">
              <span>✓</span>
              <p>Réponses automatiques assistées par IA</p>
            </div>

            <div className="login-feature">
              <span>✓</span>
              <p>Organisation des rendez-vous et des patients</p>
            </div>
          </div>
        </section>

        <section className="login-form-panel">
          <div className="login-form-wrapper">
            <div className="login-mobile-brand">
              <div className="login-brand-icon">
                <Stethoscope size={25} />
              </div>

              <div>
                <h2>Tabibi</h2>
                <p>Smart Medical Assistant</p>
              </div>
            </div>

            <div className="login-form-heading">
              <h2>Bienvenue 👋</h2>
              <p>Connectez-vous pour accéder à votre espace professionnel.</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="login-field">
                <label htmlFor="email">Adresse e-mail</label>

                <div className="login-input-wrapper">
                  <Mail size={19} />

                  <input
                    id="email"
                    type="email"
                    placeholder="docteur@email.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <div className="login-password-label">
                  <label htmlFor="password">Mot de passe</label>

                  <button type="button" className="forgot-password">
                    Mot de passe oublié ?
                  </button>
                </div>

                <div className="login-input-wrapper">
                  <LockKeyhole size={19} />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Entrez votre mot de passe"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
              </div>

              <label className="remember-option">
                <input type="checkbox" />
                <span>Se souvenir de moi</span>
              </label>

              {error && (
                <p className="login-error" role="alert">
                  {error}
                </p>
              )}

              <button
                className="login-submit-button"
                type="submit"
                disabled={loading}
              >
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>

            <p className="login-security-text">
              Vos données sont protégées et sécurisées.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Login;