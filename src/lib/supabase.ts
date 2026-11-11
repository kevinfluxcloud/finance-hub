import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_CONFIG_KEY = 'pfh_supabase_connection_config';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  autoSync: boolean;
}

// Retrieve configured credentials from localStorage or environment variables
export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return {
          url: parsed.url.trim(),
          anonKey: parsed.anonKey.trim(),
          autoSync: parsed.autoSync !== false,
        };
      }
    }
  } catch (err) {
    console.error('Erro ao ler configuração do Supabase:', err);
  }

  // Fallback to Vite environment variables or default configured project
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || 'https://lusealiklabshoogemfl.supabase.co').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_kuBq4MkvD4HOvd_buUikYQ_s8PVepmC').trim();

  return {
    url: envUrl,
    anonKey: envKey,
    autoSync: true,
  };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  try {
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
    // Reset client instance so it re-initializes on next call
    cachedClient = null;
  } catch (err) {
    console.error('Erro ao salvar configuração do Supabase:', err);
  }
}

export function clearSupabaseConfig(): void {
  try {
    localStorage.removeItem(SUPABASE_CONFIG_KEY);
    cachedClient = null;
  } catch (err) {
    console.error('Erro ao remover configuração do Supabase:', err);
  }
}

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();

  if (!config.url || !config.anonKey) {
    return null;
  }

  // Return cached client if credentials haven't changed
  if (cachedClient && lastUsedUrl === config.url && lastUsedKey === config.anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    lastUsedUrl = config.url;
    lastUsedKey = config.anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Falha ao inicializar cliente Supabase:', err);
    return null;
  }
}

// Diagnostics test to verify Supabase connectivity
export async function testSupabaseConnection(
  customUrl?: string,
  customKey?: string
): Promise<{ success: boolean; message: string; details?: { url: string; hasTables: boolean } }> {
  const url = (customUrl || getStoredSupabaseConfig().url).trim();
  const anonKey = (customKey || getStoredSupabaseConfig().anonKey).trim();

  if (!url || !anonKey) {
    return {
      success: false,
      message: 'URL do projeto e chave Anon pública são obrigatórias.',
    };
  }

  try {
    const tempClient = createClient(url, anonKey, {
      auth: { persistSession: false },
    });

    // Check if table finance_hub_data or contas exists
    const { data, error } = await tempClient.from('finance_hub_data').select('id').limit(1);

    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist yet, that's normal before running migration
      if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return {
          success: true,
          message: 'Conexão com o Supabase estabelecida com sucesso! Execute o script SQL para criar as tabelas.',
          details: { url, hasTables: false },
        };
      }
      return {
        success: false,
        message: `Falha na conexão: ${error.message} (${error.code || 'erro'})`,
      };
    }

    return {
      success: true,
      message: 'Conectado com sucesso ao banco de dados Supabase!',
      details: { url, hasTables: true },
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao testar conexão: ${err.message || 'Verifique se a URL e a Chave estão corretas.'}`,
    };
  }
}

// SQL Script generator for the user to run in Supabase SQL Editor
export const SUPABASE_SQL_MIGRATION = `-- ==========================================================
-- Personal Finance Hub - Estrutura Multi-Tenant & Supabase Auth
-- Copie e cole este script no painel: Supabase > SQL Editor > New Query > RUN
-- Preserva integralmente tabelas e dados existentes sem perda de compatibilidade.
-- ==========================================================

-- 1. Tabela de Perfis de Usuário (Integrada com Supabase Auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger Automático: Criação e Atualização de Perfil ao Cadastrar (Email ou Google OAuth)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.profiles.full_name),
      updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Tabela Unificada de Sincronização em Tempo Real (Por Usuário)
create table if not exists public.finance_hub_data (
  id text primary key,
  user_id uuid references auth.users(id) default auth.uid(),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Adiciona coluna user_id se tabela já existia
alter table public.finance_hub_data add column if not exists user_id uuid references auth.users(id) default auth.uid();

-- 3. Tabelas Relacionais Detalhadas (Multi-Tenant com user_id)
create table if not exists public.contas (
  id text primary key,
  user_id uuid references auth.users(id) default auth.uid(),
  nome text not null,
  instituicao text not null,
  saldo numeric not null default 0,
  tipo text not null,
  cor text,
  icone text,
  updated_at timestamptz not null default now()
);
alter table public.contas add column if not exists user_id uuid references auth.users(id) default auth.uid();

create table if not exists public.receitas (
  id text primary key,
  user_id uuid references auth.users(id) default auth.uid(),
  descricao text not null,
  valor numeric not null default 0,
  data text not null,
  conta_id text,
  categoria text not null,
  recorrente boolean default false,
  status text not null default 'recebido',
  observacao text,
  updated_at timestamptz not null default now()
);
alter table public.receitas add column if not exists user_id uuid references auth.users(id) default auth.uid();

create table if not exists public.despesas (
  id text primary key,
  user_id uuid references auth.users(id) default auth.uid(),
  descricao text not null,
  valor numeric not null default 0,
  data text not null,
  conta_id text,
  categoria text not null,
  recorrente boolean default false,
  status text not null default 'pago',
  observacao text,
  updated_at timestamptz not null default now()
);
alter table public.despesas add column if not exists user_id uuid references auth.users(id) default auth.uid();

create table if not exists public.parcelamentos (
  id text primary key,
  user_id uuid references auth.users(id) default auth.uid(),
  descricao text not null,
  valor_total numeric not null default 0,
  parcelas_total int not null,
  parcela_atual int not null,
  valor_parcela numeric not null default 0,
  categoria text not null,
  conta_id text,
  data_inicio text not null,
  status text not null default 'ativo',
  observacao text,
  historico_parcelas jsonb,
  updated_at timestamptz not null default now()
);
alter table public.parcelamentos add column if not exists user_id uuid references auth.users(id) default auth.uid();

create table if not exists public.investimentos (
  id text primary key,
  user_id uuid references auth.users(id) default auth.uid(),
  nome text not null,
  codigo text,
  categoria text not null,
  valor_investido numeric not null default 0,
  valor_atual numeric not null default 0,
  aportes numeric default 0,
  resgates numeric default 0,
  rentabilidade numeric,
  historico jsonb,
  data_inicio text not null,
  instituicao text not null,
  updated_at timestamptz not null default now()
);
alter table public.investimentos add column if not exists user_id uuid references auth.users(id) default auth.uid();

create table if not exists public.dividas (
  id text primary key,
  user_id uuid references auth.users(id) default auth.uid(),
  nome text not null,
  credor text not null,
  saldo_inicial numeric not null default 0,
  saldo_atual numeric not null default 0,
  taxa_juros_mensal numeric not null default 0,
  valor_parcela numeric not null default 0,
  parcelas_restantes int not null default 0,
  plano text not null default 'avalanche',
  data_vencimento text,
  categoria text,
  updated_at timestamptz not null default now()
);
alter table public.dividas add column if not exists user_id uuid references auth.users(id) default auth.uid();

create table if not exists public.metas (
  id text primary key,
  user_id uuid references auth.users(id) default auth.uid(),
  titulo text not null,
  valor_alvo numeric not null default 0,
  acumulado numeric not null default 0,
  prazo text not null,
  categoria text not null,
  prioridade text not null default 'media',
  status text not null default 'em_andamento',
  cor text,
  updated_at timestamptz not null default now()
);
alter table public.metas add column if not exists user_id uuid references auth.users(id) default auth.uid();

-- 4. Habilitar Row Level Security (RLS) em Todas as Tabelas
alter table public.profiles enable row level security;
alter table public.finance_hub_data enable row level security;
alter table public.contas enable row level security;
alter table public.receitas enable row level security;
alter table public.despesas enable row level security;
alter table public.parcelamentos enable row level security;
alter table public.investimentos enable row level security;
alter table public.dividas enable row level security;
alter table public.metas enable row level security;

-- 5. Políticas de Isolamento Rigoroso por Usuário (Row Level Security)
-- Remove políticas anteriores
drop policy if exists "Permitir tudo profiles" on public.profiles;
drop policy if exists "Permitir tudo finance_hub_data" on public.finance_hub_data;
drop policy if exists "Permitir tudo contas" on public.contas;
drop policy if exists "Permitir tudo receitas" on public.receitas;
drop policy if exists "Permitir tudo despesas" on public.despesas;
drop policy if exists "Permitir tudo parcelamentos" on public.parcelamentos;
drop policy if exists "Permitir tudo investimentos" on public.investimentos;
drop policy if exists "Permitir tudo dividas" on public.dividas;
drop policy if exists "Permitir tudo metas" on public.metas;

drop policy if exists "Usuário acessa próprio perfil" on public.profiles;
create policy "Usuário acessa próprio perfil" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Usuário acessa próprios dados financeiros" on public.finance_hub_data;
create policy "Usuário acessa próprios dados financeiros" on public.finance_hub_data
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Usuário acessa próprias contas" on public.contas;
create policy "Usuário acessa próprias contas" on public.contas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Usuário acessa próprias receitas" on public.receitas;
create policy "Usuário acessa próprias receitas" on public.receitas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Usuário acessa próprias despesas" on public.despesas;
create policy "Usuário acessa próprias despesas" on public.despesas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Usuário acessa próprios parcelamentos" on public.parcelamentos;
create policy "Usuário acessa próprios parcelamentos" on public.parcelamentos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Usuário acessa próprios investimentos" on public.investimentos;
create policy "Usuário acessa próprios investimentos" on public.investimentos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Usuário acessa próprias dívidas" on public.dividas;
create policy "Usuário acessa próprias dívidas" on public.dividas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Usuário acessa próprias metas" on public.metas;
create policy "Usuário acessa próprias metas" on public.metas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 6. Habilitar Publicação de Tempo Real no Supabase Realtime
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.finance_hub_data;
alter publication supabase_realtime add table public.contas;
alter publication supabase_realtime add table public.receitas;
alter publication supabase_realtime add table public.despesas;
alter publication supabase_realtime add table public.parcelamentos;
alter publication supabase_realtime add table public.investimentos;
alter publication supabase_realtime add table public.dividas;
alter publication supabase_realtime add table public.metas;
`;
