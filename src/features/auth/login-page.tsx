import { useEffect, useState } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from 'lucide-react';
import { DEMO_CREDENTIALS } from '../../config/demo-account';
import { loginSchema, type LoginInput } from '../../types/auth';
import { useAuth } from './auth-context';
import { loginDestination, loginHref } from '../../lib/auth-navigation';
import { REMEMBER_SESSION_DAYS } from '../../lib/session';
import '../../styles/login.css';

function LoginIllustration() {
  return (
    <div className="login-illustration" aria-hidden="true">
      <svg className="login-orbit" viewBox="0 0 560 380" fill="none">
        <defs>
          <linearGradient
            id="login-ribbon"
            x1="105"
            y1="57"
            x2="441"
            y2="329"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#D5C0F2" />
            <stop offset=".28" stopColor="#A47ACA" />
            <stop offset=".55" stopColor="#73518F" />
            <stop offset=".78" stopColor="#B595D4" />
            <stop offset="1" stopColor="#E7D6F8" />
          </linearGradient>
          <filter id="login-orbit-shadow" x="-30%" y="-50%" width="160%" height="200%">
            <feDropShadow
              dx="0"
              dy="26"
              stdDeviation="16"
              floodColor="#110C1B"
              floodOpacity=".28"
            />
          </filter>
        </defs>
        <ellipse
          cx="280"
          cy="184"
          rx="185"
          ry="118"
          transform="rotate(-28 280 184)"
          stroke="url(#login-ribbon)"
          strokeWidth="51"
          filter="url(#login-orbit-shadow)"
        />
        <ellipse
          cx="280"
          cy="184"
          rx="210"
          ry="143"
          transform="rotate(-28 280 184)"
          stroke="#F4E6FF"
          strokeOpacity=".22"
        />
        <circle cx="454" cy="81" r="4" fill="#DAC3F0" />
        <circle cx="103" cy="302" r="3" fill="#AF90C8" />
        <path
          d="M68 115h10m-5-5v10M460 288h14m-7-7v14"
          stroke="#DEC8EE"
          strokeOpacity=".6"
        />
      </svg>
      <div className="login-board-peek">
        <div className="peek-header">
          <span className="peek-project-icon">
            <ArrowUpRight size={13} />
          </span>
          <strong>Platform launch</strong>
          <span className="peek-menu">···</span>
        </div>
        <div className="peek-board">
          <div className="peek-column">
            <span className="peek-column-title">
              <i />
              To Do<span>5</span>
            </span>
            <div className="peek-card">
              <small>SPR-101</small>
              <strong>Design the new onboarding flow</strong>
              <span className="peek-tag">Design</span>
            </div>
            <div className="peek-skeleton">
              <span />
              <span />
            </div>
          </div>
          <div className="peek-column">
            <span className="peek-column-title">
              <i className="peek-progress" />
              In Progress<span>5</span>
            </span>
            <div className="peek-card">
              <small>SPR-106</small>
              <strong>Build the project dashboard</strong>
              <span className="peek-tag peek-tag-blue">Frontend</span>
            </div>
            <div className="peek-skeleton">
              <span />
              <span />
            </div>
          </div>
          <div className="peek-column">
            <span className="peek-column-title">
              <i className="peek-done" />
              Done<span>4</span>
            </span>
            <div className="peek-card peek-complete">
              <small>SPR-111</small>
              <strong>Define the visual direction</strong>
              <span className="peek-tag peek-tag-green">Complete</span>
            </div>
            <div className="peek-skeleton">
              <span />
              <span />
            </div>
          </div>
        </div>
      </div>
      <div className="login-done-bubble">
        <span>
          <Check size={12} strokeWidth={2.5} />
        </span>
        Completed
      </div>
      <div className="login-highlight">
        <div>
          <span>SPR-110</span>
          <ArrowUpRight size={14} />
        </div>
        <strong>Polish responsive layouts</strong>
        <footer>
          <span>
            <i />
            In progress
          </span>
          <span className="peek-person">AM</span>
        </footer>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { user, signIn } = useAuth();
  const location = useLocation();
  const [params] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });
  const destination = loginDestination(params, location.hash);
  const canonicalHref = loginHref(destination);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Sign in · SprintBoard';
    return () => {
      document.title = previousTitle;
    };
  }, []);

  if (user) {
    return <Navigate to={destination} replace />;
  }

  if (
    params.has('next') &&
    `${location.pathname}${location.search}${location.hash}` !== canonicalHref
  ) {
    return <Navigate to={canonicalHref} replace />;
  }

  const submit = handleSubmit(async (values) => {
    clearErrors('root');

    try {
      await signIn(values);
    } catch (error) {
      setError('root', {
        message:
          error instanceof Error
            ? error.message
            : 'We couldn’t sign you in. Please try again.',
      });
    }
  });

  function fillDemo() {
    setValue('email', DEMO_CREDENTIALS.email);
    setValue('password', DEMO_CREDENTIALS.password);
    clearErrors();
    setFocus('password');
  }

  return (
    <main
      id="main-content"
      className="login-page"
      aria-labelledby="login-title"
      tabIndex={-1}
    >
      <section className="login-story" aria-label="SprintBoard">
        <div className="login-story-grain" aria-hidden="true" />
        <div className="login-brand">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          SprintBoard<span className="login-brand-period">.</span>
        </div>
        <LoginIllustration />
      </section>

      <section className="login-access" aria-labelledby="login-title">
        <div className="login-form-wrap">
          <h1 id="login-title">Sign in</h1>

          <form
            className="login-form"
            onSubmit={(event) => {
              void submit(event);
            }}
            noValidate
          >
            <fieldset className="login-fields" disabled={isSubmitting}>
              <div className="login-field">
                <label htmlFor="login-email">Email address</label>
                <div
                  className={`login-input-wrap ${errors.email ? 'login-input-invalid' : ''}`}
                >
                  <Mail size={17} />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="you@company.com"
                    {...register('email', { onChange: () => clearErrors('root') })}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'login-email-error' : undefined}
                  />
                </div>
                {errors.email && (
                  <p className="login-field-error" id="login-email-error" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="login-field">
                <label htmlFor="login-password">Password</label>
                <div
                  className={`login-input-wrap ${errors.password ? 'login-input-invalid' : ''}`}
                >
                  <LockKeyhole size={17} />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    {...register('password', { onChange: () => clearErrors('root') })}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                      errors.password ? 'login-password-error' : undefined
                    }
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="login-field-error" id="login-password-error" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div className="login-remember">
                <label htmlFor="login-remember">
                  <input
                    id="login-remember"
                    type="checkbox"
                    aria-describedby="login-remember-duration"
                    {...register('rememberMe')}
                  />
                  <span>Keep me signed in</span>
                </label>
                <span id="login-remember-duration">{REMEMBER_SESSION_DAYS} days</span>
              </div>
            </fieldset>
            {errors.root && (
              <div className="login-error" role="alert">
                <AlertCircle size={16} />
                <span>{errors.root.message}</span>
              </div>
            )}
            <button
              className="login-submit"
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <span className="login-submit-label">
                  <LoaderCircle size={17} className="animate-spin" />
                  Signing you in…
                </span>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight size={17} className="login-submit-arrow" />
                </>
              )}
            </button>
          </form>

          <div className="login-demo">
            <div className="login-demo-heading">
              <span>Demo credentials</span>
            </div>
            <div className="login-demo-details">
              <span>{DEMO_CREDENTIALS.email}</span>
              <span className="login-demo-divider" />
              <code>{DEMO_CREDENTIALS.password}</code>
            </div>
            <button type="button" onClick={fillDemo} disabled={isSubmitting}>
              Use demo credentials
              <ArrowUpRight size={13} />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
