import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, BirthDateVisibility } from '../types';
import { ArrowLeft, AlertCircle, CheckCircle2, MapPin, Cake } from 'lucide-react';

interface AuthViewProps {
  onNavigate: (view: string) => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onNavigate, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [identifier, setIdentifier] = useState(''); // username or email
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthDateVisibility, setBirthDateVisibility] = useState<BirthDateVisibility>('full');
  const [regLink, setRegLink] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let loginEmail = identifier.trim().toLowerCase();

      // If identifier doesn't contain '@', look up email from username
      if (!loginEmail.includes('@')) {
        const cleanUsername = loginEmail.replace(/^@/, '');
        const { data: userLookup, error: lookupErr } = await supabase
          .from('users')
          .select('email')
          .eq('username', cleanUsername)
          .maybeSingle();

        if (lookupErr || !userLookup || !userLookup.email) {
          throw new Error('No encontramos una cuenta con ese nombre de usuario. Probá con tu email.');
        }
        loginEmail = userLookup.email;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password
      });

      if (error) throw error;
      if (data.user) {
        // Fetch or create profile
        const { data: prof } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        onLoginSuccess(prof || {
          id: data.user.id,
          username: data.user.email?.split('@')[0] || 'usuario',
          email: data.user.email
        });
        onNavigate('feed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Credenciales incorrectas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    if (cleanUsername.length < 4 || cleanUsername.length > 32) {
      setErrorMsg('El nombre de usuario debe tener entre 4 y 32 caracteres.');
      setIsLoading(false);
      return;
    }

    const filteredLinks = regLink.trim() ? [regLink.trim().startsWith('http') ? regLink.trim() : `https://${regLink.trim()}`] : [];
    const cleanBio = bio.trim().slice(0, 150);
    const cleanLocation = location.trim().slice(0, 100);
    const cleanBirthDate = birthDate ? birthDate.trim() : null;
    const cleanBirthDateVis: BirthDateVisibility = cleanBirthDate ? birthDateVisibility : 'none';

    try {
      // Check if username is already taken
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (existing) {
        throw new Error('Ese nombre de usuario ya está en uso. Elegí otro.');
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            username: cleanUsername,
            bio: cleanBio,
            links: filteredLinks,
            location: cleanLocation || null,
            birth_date: cleanBirthDate,
            birth_date_visibility: cleanBirthDateVis
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Ensure profile row (try full payload, fallback if column missing)
        try {
          await supabase.from('users').upsert({
            id: data.user.id,
            username: cleanUsername,
            email: email.trim().toLowerCase(),
            bio: cleanBio || null,
            links: filteredLinks.length > 0 ? filteredLinks : null,
            location: cleanLocation || null,
            birth_date: cleanBirthDate,
            birth_date_visibility: cleanBirthDateVis
          });
        } catch (e) {
          try {
            await supabase.from('users').upsert({
              id: data.user.id,
              username: cleanUsername,
              email: email.trim().toLowerCase(),
              bio: cleanBio || null,
              links: filteredLinks.length > 0 ? filteredLinks : null
            });
          } catch (err) {}
        }

        // Persistent fallback in localStorage
        try {
          localStorage.setItem(`omniboxd_profile_extra_${data.user.id}`, JSON.stringify({
            location: cleanLocation || null,
            birth_date: cleanBirthDate,
            birth_date_visibility: cleanBirthDateVis
          }));
        } catch (e) {}

        if (data.session) {
          onLoginSuccess({
            id: data.user.id,
            username: cleanUsername,
            email: email.trim().toLowerCase(),
            bio: cleanBio || null,
            links: filteredLinks.length > 0 ? filteredLinks : null,
            location: cleanLocation || null,
            birth_date: cleanBirthDate,
            birth_date_visibility: cleanBirthDateVis
          });
          onNavigate('feed');
        } else {
          setSuccessMsg('¡Cuenta creada! Te enviamos un enlace a tu email para confirmarla.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear la cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setErrorMsg('Ingresá tu correo electrónico.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/perfil`
      });

      if (error) throw error;

      setSuccessMsg('Te enviamos un correo con las instrucciones para restablecer tu contraseña. Revisá tu casilla o spam.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al solicitar el restablecimiento de contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al conectar con Google');
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col justify-center items-center px-4 py-8 pb-20">
      <div className="w-full max-w-md">
        <button
          onClick={() => onNavigate('feed')}
          className="flat-btn text-xs py-1.5 px-3 mb-4 hover:text-amber-400 cursor-pointer inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al inicio</span>
        </button>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-xl w-full">
        {/* Brand header */}
        <div className="text-center mb-6">
          <img
            src="/img/isotipo-omniboxd.svg"
            alt="omniboxd logo"
            className="w-16 h-16 rounded-full mx-auto mb-2.5 shadow-[0_0_16px_rgba(245,200,66,0.3)] bg-white object-contain"
          />
          <h2 className="font-display font-bold text-xl text-[var(--text)] tracking-tight">
            omniboxd
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            El diario de viajes en ómnibus uruguayos
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-[var(--surface-2)] p-1 rounded-xl border border-[var(--border)] mb-5">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 text-xs font-display font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-[var(--surface)] text-amber-400 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 text-xs font-display font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-[var(--surface)] text-amber-400 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            Crear cuenta
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Forgot Password */}
        {mode === 'forgot' ? (
          <form onSubmit={handleForgotPassword} className="space-y-3.5">
            <div className="text-left">
              <h3 className="text-sm font-display font-bold text-[var(--text)] mb-1">
                Recuperar contraseña
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Ingresá el correo electrónico asociado a tu cuenta de omniboxd y te enviaremos un enlace seguro para restablecerla.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                Email registrado
              </label>
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="vos@email.com"
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-display font-bold text-xs tracking-wide transition-all shadow-md cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Enviando correo…' : 'Enviar enlace de recuperación'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
                className="text-xs text-[var(--text-muted)] hover:text-amber-400 transition-colors cursor-pointer"
              >
                ← Volver al inicio de sesión
              </button>
            </div>
          </form>
        ) : mode === 'login' ? (
          /* Form Login */
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                Usuario o Email
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="@usuario o vos@email.com"
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setErrorMsg(null); setSuccessMsg(null); }}
                  className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-display font-bold text-xs tracking-wide transition-all shadow-md cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Entrando…' : 'Entrar a omniboxd'}
            </button>
          </form>
        ) : (
          /* Form Register */
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                Nombre de usuario
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="tu_usuario"
                maxLength={32}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
              />
              <span className="text-[10px] text-[var(--text-dim)]">4 a 32 caracteres (letras, números, _ y .)</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vos@email.com"
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Bio corta (Opcional)
                </label>
                <span className={`text-[10px] font-mono ${bio.length >= 140 ? 'text-amber-400 font-bold' : 'text-[var(--text-dim)]'}`}>
                  {bio.length} / 150
                </span>
              </div>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Viajero frecuente del 183…"
                maxLength={150}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* Ubicación (Opcional) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ubicación (Opcional)</span>
                </label>
                <span className="text-[10px] text-[var(--text-dim)] font-mono">{location.length}/100</span>
              </div>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ej: Montevideo, Uruguay"
                maxLength={100}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
              />
              <span className="text-[10px] text-[var(--text-dim)]">Tu ciudad o zona donde viajás habitualmente</span>
            </div>

            {/* Fecha de nacimiento (Opcional) */}
            <div>
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Cake className="w-3.5 h-3.5 text-amber-400" />
                <span>Fecha de nacimiento (Opcional)</span>
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
              />
              
              {birthDate && (
                <div className="mt-2 p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] space-y-1.5 animate-in fade-in duration-150">
                  <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                    ¿Cómo querés que se muestre en tu perfil?
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBirthDateVisibility('full')}
                      className={`text-[11px] py-1.5 px-2 rounded-md border text-left transition-all cursor-pointer ${
                        birthDateVisibility === 'full'
                          ? 'border-amber-400 bg-amber-400/10 text-amber-300 font-semibold'
                          : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      <span className="block font-medium">Toda la fecha</span>
                      <span className="text-[9px] text-[var(--text-dim)] block">Día, mes y año</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBirthDateVisibility('month_year')}
                      className={`text-[11px] py-1.5 px-2 rounded-md border text-left transition-all cursor-pointer ${
                        birthDateVisibility === 'month_year'
                          ? 'border-amber-400 bg-amber-400/10 text-amber-300 font-semibold'
                          : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      <span className="block font-medium">Mes y año</span>
                      <span className="text-[9px] text-[var(--text-dim)] block">Ej: Octubre de 1998</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBirthDateVisibility('year')}
                      className={`text-[11px] py-1.5 px-2 rounded-md border text-left transition-all cursor-pointer ${
                        birthDateVisibility === 'year'
                          ? 'border-amber-400 bg-amber-400/10 text-amber-300 font-semibold'
                          : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      <span className="block font-medium">Solo el año</span>
                      <span className="text-[9px] text-[var(--text-dim)] block">Ej: 1998</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBirthDateVisibility('none')}
                      className={`text-[11px] py-1.5 px-2 rounded-md border text-left transition-all cursor-pointer ${
                        birthDateVisibility === 'none'
                          ? 'border-amber-400 bg-amber-400/10 text-amber-300 font-semibold'
                          : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      <span className="block font-medium">No mostrar</span>
                      <span className="text-[9px] text-[var(--text-dim)] block">Privada</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Enlace de perfil (1 link) */}
            <div>
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                Enlace en tu perfil (Opcional)
              </label>
              <input
                type="url"
                value={regLink}
                onChange={(e) => setRegLink(e.target.value)}
                placeholder="https://instagram.com/tu_cuenta"
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
              />
              <span className="text-[10px] text-[var(--text-dim)]">Podrás modificar tu enlace en cualquier momento desde tu perfil</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-display font-bold text-xs tracking-wide transition-all shadow-md cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Creando cuenta…' : 'Registrarme'}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-[11px] text-[var(--text-dim)] uppercase">o</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        {/* Google OAuth */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full flat-btn py-2 text-xs font-medium justify-center hover:text-[var(--text)] cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <span>Continuar con Google</span>
        </button>
      </div>
    </div>
  </div>
);
};
