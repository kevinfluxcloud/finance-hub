import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  CheckCircle2,
  Copy,
  Database,
  ExternalLink,
  Flame,
  Globe,
  Key,
  Layers,
  Power,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  clearSupabaseConfig,
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  SUPABASE_SQL_MIGRATION,
  testSupabaseConnection,
} from '../../lib/supabase';
import { Badge, Button, Input, Modal } from '../common/UIComponents';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  onPullFromSupabase: () => Promise<void>;
  onPushToSupabase: () => Promise<void>;
  onConfigUpdated: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  isConnected,
  isSyncing,
  lastSyncTime,
  onPullFromSupabase,
  onPushToSupabase,
  onConfigUpdated,
}) => {
  const currentConfig = getStoredSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [autoSync, setAutoSync] = useState(currentConfig.autoSync);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'conexao' | 'sql' | 'sincronizacao'>('conexao');
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ text: string; success: boolean } | null>(
    null
  );

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(url, anonKey);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Erro inesperado ao testar conexão.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = () => {
    saveSupabaseConfig({
      url: url.trim(),
      anonKey: anonKey.trim(),
      autoSync,
    });
    setTestResult({
      success: true,
      message: 'Configurações do Supabase salvas com sucesso!',
    });
    onConfigUpdated();
  };

  const handleDisconnect = () => {
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setTestResult(null);
    onConfigUpdated();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_MIGRATION);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleManualPull = async () => {
    setSyncStatusMsg(null);
    try {
      await onPullFromSupabase();
      setSyncStatusMsg({
        text: 'Dados carregados com sucesso diretamente do Supabase!',
        success: true,
      });
    } catch (err: any) {
      setSyncStatusMsg({
        text: err.message || 'Falha ao carregar dados do Supabase.',
        success: false,
      });
    }
  };

  const handleManualPush = async () => {
    setSyncStatusMsg(null);
    try {
      await onPushToSupabase();
      setSyncStatusMsg({
        text: 'Dados locais sincronizados e enviados para o Supabase com sucesso!',
        success: true,
      });
    } catch (err: any) {
      setSyncStatusMsg({
        text: err.message || 'Falha ao enviar dados para o Supabase.',
        success: false,
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Conexão com Banco de Dados Supabase"
      subtitle="Sincronização em tempo real e persistência em nuvem PostgreSQL"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Connection Status Banner */}
        <div
          className={`p-4 rounded border flex items-center justify-between ${
            isConnected
              ? 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#f8fafc]'
              : 'bg-[#1e293b]/60 border-[#334155] text-[#94a3b8]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isConnected
                  ? 'bg-[#22c55e]/20 text-[#22c55e]'
                  : 'bg-[#334155]/50 text-[#94a3b8]'
              }`}
            >
              {isConnected ? <Wifi size={20} className="animate-pulse" /> : <WifiOff size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#f8fafc]">
                  {isConnected ? 'Supabase Conectado' : 'Supabase Desconectado'}
                </span>
                <Badge variant={isConnected ? 'bullish' : 'neutral'}>
                  {isConnected ? 'TEMPO REAL ATIVO' : 'ARMAZENAMENTO LOCAL'}
                </Badge>
              </div>
              <p className="text-xs text-[#94a3b8]">
                {isConnected
                  ? `Sincronização bidirecional ativa. ${
                      lastSyncTime
                        ? `Último envio: ${lastSyncTime.toLocaleTimeString('pt-BR')}`
                        : 'Aguardando operações.'
                    }`
                  : 'Os dados estão operando via LocalStorage localmente no navegador.'}
              </p>
            </div>
          </div>

          {isSyncing && (
            <div className="flex items-center gap-1.5 text-xs text-[#3b82f6] animate-pulse">
              <RefreshCw size={14} className="animate-spin" />
              <span>Sincronizando...</span>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#334155]/80 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('conexao')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'conexao'
                ? 'border-[#3b82f6] text-[#3b82f6]'
                : 'border-transparent text-[#94a3b8] hover:text-[#f8fafc]'
            }`}
          >
            <Key size={14} />
            <span>Credenciais & Conexão</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sincronizacao')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sincronizacao'
                ? 'border-[#3b82f6] text-[#3b82f6]'
                : 'border-transparent text-[#94a3b8] hover:text-[#f8fafc]'
            }`}
          >
            <RefreshCw size={14} />
            <span>Sincronização Manual</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-[#3b82f6] text-[#3b82f6]'
                : 'border-transparent text-[#94a3b8] hover:text-[#f8fafc]'
            }`}
          >
            <Database size={14} />
            <span>Script SQL (Tabelas)</span>
          </button>
        </div>

        {/* Tab 1: Credenciais & Conexão */}
        {activeTab === 'conexao' && (
          <div className="space-y-4">
            <div className="text-xs text-[#94a3b8]">
              Insira a <strong className="text-[#f8fafc]">Project URL</strong> e a{' '}
              <strong className="text-[#f8fafc]">Anon Public Key</strong> do seu projeto Supabase
              (disponíveis em <em>Project Settings &gt; API</em> no painel do Supabase).
            </div>

            <Input
              label="Project URL do Supabase"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://exemplo-seu-projeto.supabase.co"
              type="text"
              helper="URL base do seu banco PostgreSQL gerenciado no Supabase"
            />

            <Input
              label="Anon Public Key (Chave Pública Anon)"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              type="password"
              helper="Chave pública segura para acesso no navegador com Row Level Security (RLS)"
            />

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="autoSync"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="rounded border-[#334155] bg-[#0b1326] text-[#3b82f6] focus:ring-0 cursor-pointer"
              />
              <label htmlFor="autoSync" className="text-xs text-[#f8fafc] cursor-pointer">
                Sincronizar alterações automaticamente em tempo real ao cadastrar ou editar itens
              </label>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded text-xs flex items-start gap-2 border ${
                  testResult.success
                    ? 'bg-[#22c55e]/15 border-[#22c55e]/40 text-[#22c55e]'
                    : 'bg-[#ef4444]/15 border-[#ef4444]/40 text-[#ef4444]'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#334155]/60">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={testing || !url || !anonKey}
                  icon={
                    testing ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <ShieldCheck size={14} />
                    )
                  }
                >
                  {testing ? 'Testando...' : 'Testar Conexão'}
                </Button>

                {currentConfig.url && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDisconnect}
                    icon={<Power size={14} />}
                  >
                    Desconectar
                  </Button>
                )}
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveConfig}
                disabled={!url || !anonKey}
                icon={<Check size={15} />}
              >
                Salvar & Conectar
              </Button>
            </div>
          </div>
        )}

        {/* Tab 2: Sincronização Manual */}
        {activeTab === 'sincronizacao' && (
          <div className="space-y-4">
            <div className="text-xs text-[#94a3b8]">
              Gerencie a carga de dados e o espelhamento entre o seu navegador e o banco de dados
              Supabase.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded bg-[#0b1326] border border-[#334155] flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-[#f8fafc]">
                    <ArrowDownToLine size={16} className="text-[#3b82f6]" />
                    <span>Carregar do Supabase</span>
                  </div>
                  <p className="text-xs text-[#94a3b8] mt-1">
                    Baixa todas as contas, receitas, despesas, investimentos e dívidas salvas no seu
                    banco Supabase e atualiza esta aplicação.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleManualPull}
                  disabled={!isConnected || isSyncing}
                  icon={<ArrowDownToLine size={14} />}
                  className="w-full"
                >
                  Carregar Dados Agora
                </Button>
              </div>

              <div className="p-4 rounded bg-[#0b1326] border border-[#334155] flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-[#f8fafc]">
                    <ArrowUpFromLine size={16} className="text-[#22c55e]" />
                    <span>Enviar para o Supabase</span>
                  </div>
                  <p className="text-xs text-[#94a3b8] mt-1">
                    Envia todos os dados locais atuais (contas, lançamentos, investimentos) para o
                    seu banco de dados Supabase na nuvem.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleManualPush}
                  disabled={!isConnected || isSyncing}
                  icon={<ArrowUpFromLine size={14} />}
                  className="w-full"
                >
                  Sincronizar Dados Locais
                </Button>
              </div>
            </div>

            {syncStatusMsg && (
              <div
                className={`p-3 rounded text-xs flex items-center gap-2 border ${
                  syncStatusMsg.success
                    ? 'bg-[#22c55e]/15 border-[#22c55e]/40 text-[#22c55e]'
                    : 'bg-[#ef4444]/15 border-[#ef4444]/40 text-[#ef4444]'
                }`}
              >
                {syncStatusMsg.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{syncStatusMsg.text}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Script SQL */}
        {activeTab === 'sql' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#f8fafc]">
                  Script de Criação de Tabelas & Realtime
                </h4>
                <p className="text-[11px] text-[#94a3b8]">
                  Execute este script no <strong>SQL Editor</strong> do seu painel Supabase para
                  habilitar a estrutura e as permissões.
                </p>
              </div>

              <Button
                variant={copiedSql ? 'primary' : 'secondary'}
                size="sm"
                onClick={handleCopySql}
                icon={copiedSql ? <Check size={14} /> : <Copy size={14} />}
              >
                {copiedSql ? 'Copiado!' : 'Copiar Script SQL'}
              </Button>
            </div>

            <div className="relative">
              <pre className="p-3 bg-[#070c18] border border-[#334155] rounded text-[11px] font-mono text-[#94a3b8] max-h-60 overflow-y-auto overflow-x-auto leading-relaxed select-all">
                {SUPABASE_SQL_MIGRATION}
              </pre>
            </div>

            <div className="p-3 rounded bg-[#1e293b]/40 border border-[#334155] text-xs text-[#94a3b8] space-y-1">
              <strong className="text-[#f8fafc] block">Instruções rápidas:</strong>
              <p>1. Acesse o painel do seu projeto no Supabase (supabase.com).</p>
              <p>2. No menu lateral esquerdo, clique em <strong>SQL Editor</strong> e crie uma <strong>New Query</strong>.</p>
              <p>3. Cole o script acima e clique no botão verde <strong>RUN</strong>.</p>
              <p>4. Volte aqui na aba <em>Credenciais & Conexão</em> e salve suas credenciais!</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
