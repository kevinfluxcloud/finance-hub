import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  HardDrive,
  Key,
  RefreshCcw,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  Users,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { useAuth, SIMULATED_USERS } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { exportToCSV, exportToExcel, exportToJSON } from '../../utils/storage';
import { Badge, Button, Card, CardHeader, ConfirmModal } from '../common/UIComponents';
import { SupabaseModal } from '../supabase/SupabaseModal';
import { UserProfileModal } from '../auth/UserProfileModal';
import { getStoredSupabaseConfig } from '../../lib/supabase';

export const SettingsView: React.FC = () => {
  const {
    data,
    resetToSampleData,
    clearAllData,
    importData,
    isSupabaseConnected,
    isSupabaseSyncing,
    lastSupabaseSync,
    syncFromSupabase,
    syncToSupabase,
    refreshSupabaseConnection,
  } = useFinance();
  const { user, profile, simulateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isDemoConfirmOpen, setIsDemoConfirmOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const supabaseConfig = getStoredSupabaseConfig();

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.contas && Array.isArray(json.contas)) {
          importData(json);
          showNotification('Dados importados com sucesso a partir do arquivo JSON!', 'success');
        } else {
          showNotification('Arquivo JSON inválido ou incompatível com o formato Personal Finance Hub.', 'error');
        }
      } catch (err) {
        showNotification('Erro ao processar o arquivo JSON selecionado.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-4 border-b border-[#334155]/60">
        <h1 className="text-xl font-bold tracking-tight text-[#f8fafc]">
          Configurações, Persistência & Backup
        </h1>
        <p className="text-xs text-[#94a3b8] mt-0.5">
          Conformidade com o SPEC v1.0: Armazenamento local (LocalStorage) e exportação/importação JSON & Excel
        </p>
      </div>

      {notification && (
        <div
          className={`p-3 rounded text-xs flex items-center gap-2 border ${
            notification.type === 'success'
              ? 'bg-[#22c55e]/15 border-[#22c55e]/40 text-[#22c55e]'
              : 'bg-[#ef4444]/15 border-[#ef4444]/40 text-[#ef4444]'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Active User & Multi-Tenant Security Card */}
      {user && (
        <Card className="border-[#3b82f6]/50 bg-gradient-to-r from-[#111c35] to-[#131b2e]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#3b82f6]/20 border border-[#3b82f6]/50 flex items-center justify-center text-[#3b82f6] font-bold text-lg overflow-hidden shrink-0">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  profile?.fullName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-[#f8fafc]">
                    {profile?.fullName || user.email.split('@')[0]}
                  </h3>
                  <Badge variant="accent">MULTI-TENANT ATIVO</Badge>
                </div>
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  Ambiente financeiro independente vinculado ao Tenant UUID:{' '}
                  <span className="font-mono text-[#dae2fd] text-[11px]">{user.id}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsProfileModalOpen(true)}
                icon={<ShieldCheck size={14} className="text-[#10b981]" />}
              >
                Gerenciar Perfil
              </Button>
            </div>
          </div>

          {/* Quick Simulation Bar for Section 8 Multi-user tests */}
          <div className="mt-4 pt-3 border-t border-[#334155]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="text-[#94a3b8] flex items-center gap-1.5 font-semibold">
              <Users size={14} className="text-[#3b82f6]" />
              Alternar para outro usuário (Teste de Isolamento):
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  simulateUser('A');
                  showNotification('Ambiente alternado para Usuário A (Carlos Eduardo Mendes)', 'success');
                }}
                className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                  user.id === SIMULATED_USERS.A.user.id
                    ? 'bg-[#3b82f6]/20 border-[#3b82f6] text-[#93c5fd] font-bold'
                    : 'bg-[#0b1326] border-[#334155] text-[#94a3b8] hover:text-[#f8fafc]'
                }`}
              >
                Usuário A
              </button>
              <button
                type="button"
                onClick={() => {
                  simulateUser('B');
                  showNotification('Ambiente alternado para Usuário B (Dra. Beatriz Sampaio)', 'success');
                }}
                className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                  user.id === SIMULATED_USERS.B.user.id
                    ? 'bg-[#22c55e]/20 border-[#22c55e] text-[#86efac] font-bold'
                    : 'bg-[#0b1326] border-[#334155] text-[#94a3b8] hover:text-[#f8fafc]'
                }`}
              >
                Usuário B
              </button>
              <button
                type="button"
                onClick={() => {
                  simulateUser('C');
                  showNotification('Ambiente alternado para Usuário C (Roberto Albuquerque)', 'success');
                }}
                className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                  user.id === SIMULATED_USERS.C.user.id
                    ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#fde68a] font-bold'
                    : 'bg-[#0b1326] border-[#334155] text-[#94a3b8] hover:text-[#f8fafc]'
                }`}
              >
                Usuário C
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Storage & Architecture Telemetry */}
      <Card className="border-[#3b82f6]/40 bg-gradient-to-r from-[#131b2e] to-[#171f33]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#3b82f6]/20 border border-[#3b82f6]/40 flex items-center justify-center text-[#3b82f6]">
              <Database size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#f8fafc]">
                Arquitetura de Dados Local & Privada
              </h3>
              <p className="text-xs text-[#94a3b8]">
                Seus dados financeiros permanecem 100% no seu navegador (LocalStorage) sem envio para servidores externos.
              </p>
            </div>
          </div>
          <Badge variant="bullish">OFFLINE READY</Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-[#334155]/60 text-xs">
          <div>
            <span className="text-[10px] text-[#94a3b8] uppercase font-mono block">Contas Cadastradas</span>
            <span className="font-bold text-[#f8fafc] font-mono-numbers">{data.contas.length}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#94a3b8] uppercase font-mono block">Transações Registradas</span>
            <span className="font-bold text-[#f8fafc] font-mono-numbers">
              {data.receitas.length + data.despesas.length}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#94a3b8] uppercase font-mono block">Ativos de Investimento</span>
            <span className="font-bold text-[#f8fafc] font-mono-numbers">{data.investimentos.length}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#94a3b8] uppercase font-mono block">Dívidas & Metas</span>
            <span className="font-bold text-[#f8fafc] font-mono-numbers">
              {data.dividas.length} dívidas • {data.metas.length} metas
            </span>
          </div>
        </div>
      </Card>

      {/* Supabase Cloud Database & Realtime Sync Card */}
      <Card className="border-[#10b981]/40 bg-gradient-to-r from-[#0d1e1f] to-[#131b2e]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded flex items-center justify-center shrink-0 border ${
              isSupabaseConnected
                ? 'bg-[#10b981]/20 border-[#10b981]/50 text-[#10b981]'
                : 'bg-[#334155]/30 border-[#334155] text-[#94a3b8]'
            }`}>
              <Zap size={22} className={isSupabaseConnected ? 'fill-[#10b981]/20' : ''} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#f8fafc]">
                  Banco de Dados em Nuvem Supabase (PostgreSQL)
                </h3>
                <Badge variant={isSupabaseConnected ? 'bullish' : 'neutral'}>
                  {isSupabaseConnected ? 'ONLINE • TEMPO REAL' : 'DESCONECTADO'}
                </Badge>
              </div>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                {isSupabaseConnected
                  ? `Conectado ao Supabase. Sincronização automática em tempo real e carregamento contínuo ativos.`
                  : 'Conecte seu banco de dados Supabase para carregar dados em qualquer dispositivo e sincronizar em tempo real.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isSupabaseConnected && (
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  try {
                    await syncFromSupabase();
                    showNotification('Dados atualizados com sucesso do Supabase!', 'success');
                  } catch (err: any) {
                    showNotification('Erro ao recarregar do Supabase', 'error');
                  }
                }}
                disabled={isSupabaseSyncing}
                icon={<RefreshCw size={14} className={isSupabaseSyncing ? 'animate-spin' : ''} />}
              >
                {isSupabaseSyncing ? 'Atualizando...' : 'Recarregar'}
              </Button>
            )}

            <Button
              variant={isSupabaseConnected ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setIsSupabaseModalOpen(true)}
              icon={<Key size={14} />}
              className="w-full sm:w-auto"
            >
              {isSupabaseConnected ? 'Gerenciar Conexão' : 'Conectar ao Supabase'}
            </Button>
          </div>
        </div>

        {isSupabaseConnected && (
          <div className="flex flex-wrap items-center justify-between text-xs text-[#94a3b8] mt-4 pt-3 border-t border-[#334155]/60 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
              <span>Canal Realtime Ativo (escutando mudanças na nuvem)</span>
            </div>
            {lastSupabaseSync && (
              <span className="font-mono text-[11px]">
                Última sincronização: {lastSupabaseSync.toLocaleTimeString('pt-BR')}
              </span>
            )}
          </div>
        )}
      </Card>

      {/* Backup & Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title="Exportação de Dados"
            subtitle="Baixe cópias dos seus dados financeiros em múltiplos formatos"
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#0b1326] rounded border border-[#334155]">
              <div>
                <p className="font-bold text-xs text-[#f8fafc]">Planilha Excel Completa (.xlsx)</p>
                <p className="text-[11px] text-[#94a3b8]">
                  Exporta abas formatadas de Contas, Receitas, Despesas, Investimentos, Dívidas e Metas.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  exportToExcel(data);
                  showNotification('Planilha Excel gerada e baixada com sucesso!');
                }}
                icon={<FileSpreadsheet size={14} />}
              >
                Baixar Excel
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#0b1326] rounded border border-[#334155]">
              <div>
                <p className="font-bold text-xs text-[#f8fafc]">Backup Completo JSON (.json)</p>
                <p className="text-[11px] text-[#94a3b8]">
                  Arquivo estruturado para restauração segura de todo o seu ecossistema.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  exportToJSON(data);
                  showNotification('Backup JSON exportado com sucesso!');
                }}
                icon={<Download size={14} />}
              >
                Baixar JSON
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#0b1326] rounded border border-[#334155]">
              <div>
                <p className="font-bold text-xs text-[#f8fafc]">Extrato Financeiro CSV (.csv)</p>
                <p className="text-[11px] text-[#94a3b8]">
                  Tabela compatível com softwares externos de contabilidade e planilhas simples.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  exportToCSV(data);
                  showNotification('Extrato CSV baixado!');
                }}
                icon={<FileText size={14} />}
              >
                Baixar CSV
              </Button>
            </div>
          </div>
        </Card>

        {/* Restore & Management */}
        <Card>
          <CardHeader
            title="Restauração & Gerenciamento"
            subtitle="Recupere backups anteriores ou carregue perfis de demonstração"
          />

          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />

            <div className="flex items-center justify-between p-3 bg-[#0b1326] rounded border border-[#334155]">
              <div>
                <p className="font-bold text-xs text-[#f8fafc]">Restaurar Backup JSON</p>
                <p className="text-[11px] text-[#94a3b8]">
                  Selecione um arquivo .json exportado anteriormente para restaurar seus dados.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                icon={<Upload size={14} />}
              >
                Importar JSON
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#0b1326] rounded border border-[#334155]">
              <div>
                <p className="font-bold text-xs text-[#f8fafc]">Carregar Dados de Demonstração</p>
                <p className="text-[11px] text-[#94a3b8]">
                  Restaura o perfil executivo com carteira variada, parcelas, simulação de quitação e histórico.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsDemoConfirmOpen(true)}
                icon={<RefreshCcw size={14} className="text-[#3b82f6]" />}
              >
                Carregar Demo
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#ef4444]/10 rounded border border-[#ef4444]/30">
              <div>
                <p className="font-bold text-xs text-[#fca5a5]">Limpar Todos os Dados</p>
                <p className="text-[11px] text-[#ef4444]/80">
                  Apaga todas as contas, receitas, dívidas e investimentos do armazenamento local.
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsResetConfirmOpen(true)}
                icon={<Trash2 size={14} />}
              >
                Zerar Tudo
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Modal: Confirm Demo Data Load */}
      <ConfirmModal
        isOpen={isDemoConfirmOpen}
        onClose={() => setIsDemoConfirmOpen(false)}
        onConfirm={() => {
          resetToSampleData();
          showNotification('Dados de demonstração executiva carregados com sucesso!', 'success');
        }}
        title="Carregar Perfil de Demonstração"
        description="Deseja substituir seus dados atuais pela base executiva completa (contas, receitas, despesas, parcelamentos, carteira de investimentos e metas)?"
        confirmText="Sim, Carregar Perfil"
        variant="primary"
      />

      {/* Modal: Confirm Full Reset */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={() => {
          clearAllData();
          showNotification('Todos os dados foram resetados com sucesso!', 'success');
        }}
        title="Zerar Todos os Dados"
        description="ATENÇÃO: Deseja realmente excluir todas as contas, receitas, despesas, parcelamentos, dívidas e investimentos? Esta ação é irreversível."
        confirmText="Sim, Apagar Tudo Definitivamente"
        variant="danger"
      />

      {/* Supabase Connection Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        isConnected={isSupabaseConnected}
        isSyncing={isSupabaseSyncing}
        lastSyncTime={lastSupabaseSync}
        onPullFromSupabase={syncFromSupabase}
        onPushToSupabase={syncToSupabase}
        onConfigUpdated={refreshSupabaseConnection}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};
