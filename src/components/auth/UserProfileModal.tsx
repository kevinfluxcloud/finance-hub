import React, { useState } from 'react';
import {
  Check,
  Copy,
  Key,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';
import { useAuth, SIMULATED_USERS } from '../../context/AuthContext';
import { Badge, Button, Input, Modal } from '../common/UIComponents';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, profile, updateProfile, signOut, simulateUser } = useAuth();

  const [fullName, setFullName] = useState(profile?.fullName || user?.user_metadata?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || user?.user_metadata?.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    await updateProfile({
      fullName: fullName.trim(),
      avatarUrl: avatarUrl.trim() || undefined,
    });

    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCopyUserId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleLogout = async () => {
    onClose();
    await signOut();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Perfil de Usuário & Segurança"
      subtitle="Gerencie suas informações e verifique o isolamento do seu ambiente financeiro"
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        {/* User Identity Header Card */}
        <div className="p-4 rounded-xl bg-[#0b1326] border border-[#334155] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#3b82f6]/20 border border-[#3b82f6]/50 flex items-center justify-center text-[#3b82f6] font-bold text-lg overflow-hidden shrink-0">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                profile?.fullName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#f8fafc]">
                  {profile?.fullName || user.email.split('@')[0]}
                </h3>
                <Badge variant="bullish">ATIVO</Badge>
              </div>
              <p className="text-xs text-[#94a3b8] flex items-center gap-1.5 mt-0.5">
                <Mail size={12} className="text-[#64748b]" />
                <span>{user.email}</span>
              </p>
            </div>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={handleLogout}
            icon={<LogOut size={13} />}
          >
            Sair
          </Button>
        </div>

        {/* Multi-Tenant Security Readout */}
        <div className="p-3 rounded bg-[#131b2e] border border-[#334155]/60 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#94a3b8] flex items-center gap-1.5 font-semibold">
              <ShieldCheck size={14} className="text-[#10b981]" />
              Identificador Único (Tenant UUID):
            </span>
            <button
              onClick={handleCopyUserId}
              className="text-[#3b82f6] hover:text-[#93c5fd] flex items-center gap-1 text-[11px] font-mono cursor-pointer"
            >
              {copiedId ? <Check size={12} /> : <Copy size={12} />}
              <span>{copiedId ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
          <div className="p-2 bg-[#070c18] border border-[#334155]/40 rounded font-mono text-[11px] text-[#dae2fd] break-all select-all">
            {user.id}
          </div>
          <p className="text-[10px] text-[#64748b]">
            Todas as suas contas, transações e metas estão criptografadas e vinculadas com exclusividade
            a este identificador. Outros usuários não têm permissão para ler ou modificar seus registros.
          </p>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSave} className="space-y-3 pt-1">
          <Input
            label="Nome Completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Seu nome completo"
            type="text"
            required
          />

          <Input
            label="URL do Avatar (Foto de Perfil Opcional)"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://exemplo.com/sua-foto.jpg"
            type="url"
            helper="Insira o link direto de uma imagem para personalizar seu avatar"
          />

          {savedSuccess && (
            <div className="p-2.5 rounded bg-[#22c55e]/15 border border-[#22c55e]/40 text-[#22c55e] text-xs flex items-center gap-2">
              <Check size={14} />
              <span>Perfil atualizado com sucesso!</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={saving}
              icon={saving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>

        {/* Quick Switch Test Bar (Section 8 Multi-user tests) */}
        <div className="pt-3 border-t border-[#334155]/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#f8fafc] flex items-center gap-1.5">
              <Users size={14} className="text-[#3b82f6]" />
              Alternar Ambiente de Teste (Multiusuário)
            </span>
            <Badge variant="accent">VALIDAÇÃO RLS</Badge>
          </div>
          <p className="text-[11px] text-[#94a3b8]">
            Alterne entre perfis de teste para comprovar que os dados de cada usuário ficam totalmente
            isolados:
          </p>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                simulateUser('A');
                onClose();
              }}
              className="p-2 bg-[#0b1326] hover:bg-[#1e293b] border border-[#334155] rounded text-left transition-colors cursor-pointer"
            >
              <span className="text-[10px] text-[#3b82f6] block font-mono font-bold">Usuário A</span>
              <span className="text-[11px] text-[#f8fafc] truncate block">
                {SIMULATED_USERS.A.profile.fullName}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                simulateUser('B');
                onClose();
              }}
              className="p-2 bg-[#0b1326] hover:bg-[#1e293b] border border-[#334155] rounded text-left transition-colors cursor-pointer"
            >
              <span className="text-[10px] text-[#22c55e] block font-mono font-bold">Usuário B</span>
              <span className="text-[11px] text-[#f8fafc] truncate block">
                {SIMULATED_USERS.B.profile.fullName}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                simulateUser('C');
                onClose();
              }}
              className="p-2 bg-[#0b1326] hover:bg-[#1e293b] border border-[#334155] rounded text-left transition-colors cursor-pointer"
            >
              <span className="text-[10px] text-[#f59e0b] block font-mono font-bold">Usuário C</span>
              <span className="text-[11px] text-[#f8fafc] truncate block">
                {SIMULATED_USERS.C.profile.fullName}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
