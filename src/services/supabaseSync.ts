import { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/supabase';
import { FinanceData, Installment } from '../types/finance';
import { ensureInstallmentHistory } from '../utils/calculations';

export interface SupabaseSyncState {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  error: string | null;
  hasTables: boolean;
}

export function getDocumentId(userId?: string): string {
  if (!userId) return 'main';
  return `user_${userId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

// Load data from Supabase for a specific user
export async function fetchFinanceDataFromSupabase(userId?: string): Promise<{
  success: boolean;
  data?: FinanceData;
  error?: string;
  source?: 'unified' | 'relational';
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase não está configurado.' };
  }

  const docId = getDocumentId(userId);

  try {
    // 1. Primary: read from unified sync table finance_hub_data for this specific user document
    const { data: unifiedRow, error: unifiedError } = await client
      .from('finance_hub_data')
      .select('id, data, updated_at')
      .eq('id', docId)
      .maybeSingle();

    if (!unifiedError && unifiedRow?.data && typeof unifiedRow.data === 'object') {
      const parsed = unifiedRow.data as FinanceData;
      const rawParcelas = (parsed.parcelamentos || []) as Installment[];
      const normalizedParcelas = rawParcelas.map(ensureInstallmentHistory);

      return {
        success: true,
        source: 'unified',
        data: {
          contas: parsed.contas || [],
          receitas: parsed.receitas || [],
          despesas: parsed.despesas || [],
          parcelamentos: normalizedParcelas,
          investimentos: parsed.investimentos || [],
          dividas: parsed.dividas || [],
          metas: parsed.metas || [],
          configuracoes: parsed.configuracoes || {
            mesesReservaEmergencia: 6,
            moeda: 'BRL',
            estrategiaQuitacaoPadrao: 'avalanche',
          },
        },
      };
    }

    // 2. If user-specific doc wasn't found and userId is defined, check if legacy 'main' has active data
    if (!unifiedRow && docId !== 'main') {
      const { data: mainRow } = await client
        .from('finance_hub_data')
        .select('id, data, updated_at')
        .eq('id', 'main')
        .maybeSingle();

      if (mainRow?.data && typeof mainRow.data === 'object') {
        const parsed = mainRow.data as FinanceData;
        const hasContent =
          (parsed.contas && parsed.contas.length > 0) ||
          (parsed.receitas && parsed.receitas.length > 0) ||
          (parsed.despesas && parsed.despesas.length > 0);

        if (hasContent) {
          const rawParcelas = (parsed.parcelamentos || []) as Installment[];
          return {
            success: true,
            source: 'unified',
            data: {
              contas: parsed.contas || [],
              receitas: parsed.receitas || [],
              despesas: parsed.despesas || [],
              parcelamentos: rawParcelas.map(ensureInstallmentHistory),
              investimentos: parsed.investimentos || [],
              dividas: parsed.dividas || [],
              metas: parsed.metas || [],
              configuracoes: parsed.configuracoes || {
                mesesReservaEmergencia: 6,
                moeda: 'BRL',
                estrategiaQuitacaoPadrao: 'avalanche',
              },
            },
          };
        }
      }
    }

    // 3. Fallback: try individual relational tables
    try {
      const [contasRes, receitasRes, despesasRes] = await Promise.all([
        client.from('contas').select('*').limit(200),
        client.from('receitas').select('*').limit(500),
        client.from('despesas').select('*').limit(500),
      ]);

      const prefix = userId ? `${userId}__` : '';
      const filterByPrefix = (arr: any[] | null) => {
        if (!arr) return [];
        if (!userId) return arr;
        const matching = arr.filter((item) => item.id?.startsWith(prefix));
        return matching.length > 0 ? matching : arr;
      };

      const cList = filterByPrefix(contasRes.data);
      const rList = filterByPrefix(receitasRes.data);
      const dList = filterByPrefix(despesasRes.data);

      if (cList.length > 0 || rList.length > 0 || dList.length > 0) {
        const cleanId = (id: string) => (id.startsWith(prefix) ? id.slice(prefix.length) : id);
        return {
          success: true,
          source: 'relational',
          data: {
            contas: cList.map((c: any) => ({
              id: cleanId(c.id),
              nome: c.nome || 'Conta',
              instituicao: c.instituicao || '',
              saldo: Number(c.saldo || 0),
              tipo: c.tipo || 'corrente',
              cor: c.cor,
              icone: c.icone,
            })),
            receitas: rList.map((r: any) => ({
              id: cleanId(r.id),
              descricao: r.descricao,
              valor: Number(r.valor || 0),
              data: r.data,
              contaId: r.conta_id ? cleanId(r.conta_id) : '',
              categoria: r.categoria,
              recorrente: Boolean(r.recorrente),
              status: r.status,
              observacao: r.observacao,
            })),
            despesas: dList.map((d: any) => ({
              id: cleanId(d.id),
              descricao: d.descricao,
              valor: Number(d.valor || 0),
              data: d.data,
              contaId: d.conta_id ? cleanId(d.conta_id) : '',
              categoria: d.categoria,
              recorrente: Boolean(d.recorrente),
              status: d.status,
              observacao: d.observacao,
            })),
            parcelamentos: [],
            investimentos: [],
            dividas: [],
            metas: [],
            configuracoes: {
              mesesReservaEmergencia: 6,
              moeda: 'BRL',
              estrategiaQuitacaoPadrao: 'avalanche',
            },
          },
        };
      }
    } catch {
      // Ignored: relational tables are secondary mirror
    }

    // If tables exist but have no rows yet for this user
    if (!unifiedError) {
      return {
        success: true,
        data: undefined, // Indicates connection ok, but database has no row yet for this user
      };
    }

    return {
      success: false,
      error: unifiedError.message || 'Falha ao consultar Supabase.',
    };
  } catch (err: any) {
    console.error('Erro ao buscar dados do Supabase:', err);
    return { success: false, error: err.message || 'Erro de rede ou permissão.' };
  }
}

// Push local data to Supabase for a specific user
export async function pushFinanceDataToSupabase(
  data: FinanceData,
  userId?: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase não está configurado.' };
  }

  const docId = getDocumentId(userId);

  try {
    // 1. Primary: Upsert atomic JSON document in finance_hub_data (instant atomic update with Realtime broadcast)
    const payload = {
      id: docId,
      data: data,
      updated_at: new Date().toISOString(),
    };

    const { error: hubError } = await client.from('finance_hub_data').upsert(payload);

    if (hubError) {
      console.error('Erro ao gravar em finance_hub_data:', hubError);
      return { success: false, error: hubError.message };
    }

    // 2. Also mirror into individual relational tables using exact table schemas
    const prefix = userId ? `${userId}__` : '';
    const mapId = (id: string) => (id.startsWith(prefix) ? id : `${prefix}${id}`);

    // Fire relational updates asynchronously without blocking the main success
    Promise.allSettled([
      // Contas
      data.contas.length > 0
        ? client.from('contas').upsert(
            data.contas.map((c) => ({
              id: mapId(c.id),
              nome: c.nome,
              instituicao: c.instituicao,
              saldo: c.saldo,
              tipo: c.tipo,
              cor: c.cor,
              icone: c.icone,
            }))
          )
        : Promise.resolve(),

      // Receitas
      data.receitas.length > 0
        ? client.from('receitas').upsert(
            data.receitas.map((r) => ({
              id: mapId(r.id),
              descricao: r.descricao,
              valor: r.valor,
              data: r.data,
              conta_id: r.contaId ? mapId(r.contaId) : null,
              categoria: r.categoria,
              recorrente: Boolean(r.recorrente),
              status: r.status,
              observacao: r.observacao || null,
            }))
          )
        : Promise.resolve(),

      // Despesas
      data.despesas.length > 0
        ? client.from('despesas').upsert(
            data.despesas.map((d) => ({
              id: mapId(d.id),
              descricao: d.descricao,
              valor: d.valor,
              data: d.data,
              conta_id: d.contaId ? mapId(d.contaId) : null,
              categoria: d.categoria,
              recorrente: Boolean(d.recorrente),
              status: d.status,
              observacao: d.observacao || null,
            }))
          )
        : Promise.resolve(),

      // Parcelamentos
      data.parcelamentos.length > 0
        ? client.from('parcelamentos').upsert(
            data.parcelamentos.map((p) => ({
              id: mapId(p.id),
              descricao: p.descricao,
              valor_total: p.valorTotal,
              parcelas_total: p.parcelasTotal,
              parcela_atual: p.parcelaAtual,
              valor_parcela: p.valorParcela,
              categoria: p.categoria,
              conta_id: p.contaId ? mapId(p.contaId) : null,
              data_inicio: p.dataInicio,
              status: p.status,
              observacao: p.observacao || null,
              historico_parcelas: p.historicoParcelas || [],
            }))
          )
        : Promise.resolve(),

      // Investimentos
      data.investimentos.length > 0
        ? client.from('investimentos').upsert(
            data.investimentos.map((i) => ({
              id: mapId(i.id),
              nome: i.nome,
              codigo: i.codigo || null,
              categoria: i.categoria,
              valor_investido: i.valorInvestido,
              valor_atual: i.valorAtual,
              aportes: i.aportes,
              resgates: i.resgates,
              rentabilidade: i.rentabilidade || null,
              historico: i.historico || [],
              data_inicio: i.dataInicio,
              instituicao: i.instituicao,
            }))
          )
        : Promise.resolve(),

      // Dívidas
      data.dividas.length > 0
        ? client.from('dividas').upsert(
            data.dividas.map((d) => ({
              id: mapId(d.id),
              nome: d.nome,
              credor: d.credor,
              saldo_inicial: d.saldoInicial,
              saldo_atual: d.saldoAtual,
              taxa_juros_mensal: d.taxaJurosMensal,
              valor_parcela: d.valorParcela,
              parcelas_restantes: d.parcelasRestantes,
              plano: d.plano,
              data_vencimento: d.dataVencimento || null,
              categoria: d.categoria || null,
            }))
          )
        : Promise.resolve(),

      // Metas
      data.metas.length > 0
        ? client.from('metas').upsert(
            data.metas.map((m) => ({
              id: mapId(m.id),
              titulo: m.titulo,
              valor_alvo: m.valorAlvo,
              acumulado: m.acumulado,
              prazo: m.prazo,
              categoria: m.categoria,
              prioridade: m.prioridade,
              status: m.status,
              cor: m.cor || null,
            }))
          )
        : Promise.resolve(),
    ]).catch((err) => {
      console.warn('Aviso ao espelhar em tabelas relacionais:', err);
    });

    return { success: true };
  } catch (err: any) {
    console.error('Erro ao enviar dados para o Supabase:', err);
    return { success: false, error: err.message || 'Falha ao sincronizar com o Supabase.' };
  }
}

// Subscribe to real-time changes filtered by user document ID
export function subscribeToSupabaseRealtime(
  userId: string | undefined,
  onDataChanged: (newData: FinanceData, updatedAt?: string) => void
): (() => void) | null {
  const client = getSupabaseClient();
  if (!client) return null;

  const docId = getDocumentId(userId);

  try {
    const channelName = `pfh-realtime-${docId}-${Math.random().toString(36).substring(2, 7)}`;
    const channel: RealtimeChannel = client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'finance_hub_data',
          filter: `id=eq.${docId}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).data) {
            const raw = (payload.new as any).data as FinanceData;
            const rawParcelas = (raw.parcelamentos || []) as Installment[];
            const normalizedParcelas = rawParcelas.map(ensureInstallmentHistory);

            onDataChanged(
              {
                ...raw,
                parcelamentos: normalizedParcelas,
              },
              (payload.new as any).updated_at
            );
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`⚡ Supabase Realtime ativo para documento: ${docId}`);
        }
      });

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.error('Erro ao registrar canal de tempo real do Supabase:', err);
    return null;
  }
}
