import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge, Button, Input } from '../common/UIComponents';

export const AuthView: React.FC = () => {
  const {
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!email || !password) {
          setErrorMsg('Por favor, informe seu e-mail e senha.');
          setLoading(false);
          return;
        }

        const res = await signInWithEmail(email, password, rememberMe);
        if (!res.success) {
          setErrorMsg(res.error || 'Falha ao autenticar.');
        }
      } else if (mode === 'register') {
        if (!fullName || !email || !password) {
          setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setErrorMsg('A senha deve possuir pelo menos 6 caracteres.');
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setErrorMsg('As senhas digitadas não coincidem.');
          setLoading(false);
          return;
        }

        const res = await signUpWithEmail(email, password, fullName);
        if (!res.success) {
          setErrorMsg(res.error || 'Erro ao criar conta.');
        } else if (res.message) {
          setSuccessMsg(res.message);
        }
      } else if (mode === 'forgot') {
        if (!email) {
          setErrorMsg('Por favor, digite seu e-mail para receber as instruções.');
          setLoading(false);
          return;
        }

        const res = await resetPassword(email);
        if (!res.success) {
          setErrorMsg(res.error || 'Falha ao solicitar recuperação.');
        } else {
          setSuccessMsg(res.message || 'Instruções enviadas para seu e-mail.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado na operação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070c18] text-[#dae2fd] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-sans">
      {/* Background radial glowing ambient lights */}
      <div className="absolute top-[-15%] left-[20%] w-[500px] h-[500px] bg-[#3b82f6]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[20%] w-[500px] h-[500px] bg-[#10b981]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#3b82f6]/15 border border-[#3b82f6]/40 text-[#3b82f6] shadow-lg mb-2">
            <Sparkles size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#f8fafc]">
            PERSONAL FINANCE HUB
          </h1>
          <p className="text-xs text-[#94a3b8] max-w-sm mx-auto">
            Plataforma Multi-Tenant com Ambientes Seguros & Isolamento de Dados por Usuário
          </p>
        </div>

        {/* Security / Isolation Callout */}
        <div className="p-2.5 rounded bg-[#131b2e]/80 border border-[#334155]/60 flex items-center justify-between text-[11px] text-[#94a3b8]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#10b981]" />
            <span>Ambiente Privado Isolado</span>
          </div>
          <Badge variant="bullish">RLS ATIVO</Badge>
        </div>

        {/* Auth Card */}
        <div className="bg-[#131b2e] border border-[#334155]/80 rounded-xl p-6 sm:p-8 shadow-2xl space-y-5">
          {/* Tabs: Entrar vs Cadastrar */}
          {mode !== 'forgot' && (
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#0b1326] border border-[#334155]/60 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 text-xs font-semibold rounded transition-colors cursor-pointer ${
                  mode === 'login'
                    ? 'bg-[#3b82f6] text-white shadow-sm'
                    : 'text-[#94a3b8] hover:text-[#f8fafc]'
                }`}
              >
                Acessar Conta
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 text-xs font-semibold rounded transition-colors cursor-pointer ${
                  mode === 'register'
                    ? 'bg-[#3b82f6] text-white shadow-sm'
                    : 'text-[#94a3b8] hover:text-[#f8fafc]'
                }`}
              >
                Criar Nova Conta
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="flex items-center justify-between border-b border-[#334155]/60 pb-3">
              <h2 className="text-sm font-bold text-[#f8fafc] flex items-center gap-2">
                <KeyRound size={16} className="text-[#3b82f6]" />
                <span>Recuperação de Senha</span>
              </h2>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-xs text-[#3b82f6] hover:underline cursor-pointer"
              >
                Voltar ao Login
              </button>
            </div>
          )}

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3 rounded bg-[#ef4444]/15 border border-[#ef4444]/40 text-[#ef4444] text-xs flex items-start gap-2 animate-fadeIn">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded bg-[#22c55e]/15 border border-[#22c55e]/40 text-[#22c55e] text-xs flex items-start gap-2 animate-fadeIn">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <Input
                label="Nome Completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Carlos Eduardo Mendes"
                type="text"
                required
              />
            )}

            <Input
              label="Endereço de E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
              type="email"
              required
            />

            {mode !== 'forgot' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                    Senha de Acesso
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] text-[#3b82f6] hover:underline cursor-pointer"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#0b1326] border border-[#334155] rounded px-3 py-1.5 pr-9 text-xs text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#f8fafc] cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                  Confirme a Senha
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#0b1326] border border-[#334155] rounded px-3 py-1.5 text-xs text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
                />
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#334155] bg-[#0b1326] text-[#3b82f6] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="rememberMe" className="text-xs text-[#94a3b8] cursor-pointer">
                  Permanecer conectado neste navegador
                </label>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full py-2.5 font-bold shadow-md"
              icon={loading ? undefined : <ArrowRight size={15} />}
            >
              {loading
                ? 'Processando...'
                : mode === 'login'
                ? 'Entrar no Sistema'
                : mode === 'register'
                ? 'Criar Meu Ambiente Financeiro'
                : 'Enviar Link de Recuperação'}
            </Button>
          </form>
        </div>

        {/* Footer Note */}
        <p className="text-[11px] text-[#64748b] text-center">
          Row Level Security (RLS) habilitado • Isolamento criptográfico por identificador UUID
        </p>
      </div>
    </div>
  );
};
