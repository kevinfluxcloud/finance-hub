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

// Load data from Supabase for a specific user
export async function fetchFinanceDataFromSupabase(userId?: string): Promise<{
  success: boolean;
  data?: FinanceData;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase não está configurado.' };
  }

  const docId = userId ? `${userId}_main` : 'main';

  try {
    // 1. Try to read from unified sync table finance_hub_data for this user
    let query = client.from('finance_hub_data').select('data, user_id');
    if (userId) {
      query = query.eq('id', docId);
    } else {
      query = query.eq('id', 'main');
    }

    const { data: unifiedRow, error: unifiedError } = await query.maybeSingle();

    if (!unifiedError && unifiedRow?.data && typeof unifiedRow.data === 'object') {
      const parsed = unifiedRow.data as FinanceData;
      const rawParcelas = (parsed.parcelamentos || []) as Installment[];
      const normalizedParcelas = rawParcelas.map(ensureInstallmentHistory);

      return {
        success: true,
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

    // 2. If unified row doesn't exist, try reading individual relational tables for this user
    let contasQuery = client.from('contas').select('*');
    let receitasQuery = client.from('receitas').select('*');
    let despesasQuery = client.from('despesas').select('*');
    let parcelamentosQuery = client.from('parcelamentos').select('*');
    let investimentosQuery = client.from('investimentos').select('*');
    let dividasQuery = client.from('dividas').select('*');
    let metasQuery = client.from('metas').select('*');

    if (userId) {
      contasQuery = contasQuery.eq('user_id', userId);
      receitasQuery = receitasQuery.eq('user_id', userId);
      despesasQuery = despesasQuery.eq('user_id', userId);
      parcelamentosQuery = parcelamentosQuery.eq('user_id', userId);
      investimentosQuery = investimentosQuery.eq('user_id', userId);
      dividasQuery = dividasQuery.eq('user_id', userId);
      metasQuery = metasQuery.eq('user_id', userId);
    }

    const [
      contasRes,
      receitasRes,
      despesasRes,
      parcelamentosRes,
      investimentosRes,
      dividasRes,
      metasRes,
    ] = await Promise.all([
      contasQuery,
      receitasQuery,
      despesasQuery,
      parcelamentosQuery,
      investimentosQuery,
      dividasQuery,
      metasQuery,
    ]);

    // Check if at least some tables exist and returned data
    const hasAnyTableData =
      (contasRes.data && contasRes.data.length > 0) ||
      (receitasRes.data && receitasRes.data.length > 0) ||
      (despesasRes.data && despesasRes.data.length > 0);

    if (hasAnyTableData) {
      const loadedData: FinanceData = {
        contas: (contasRes.data || []).map((c: any) => ({
          id: c.id,
          nome: c.nome,
          instituicao: c.instituicao,
          saldo: Number(c.saldo || 0),
          tipo: c.tipo,
          cor: c.cor,
          icone: c.icone,
        })),
        receitas: (receitasRes.data || []).map((r: any) => ({
          id: r.id,
          descricao: r.descricao,
          valor: Number(r.valor || 0),
          data: r.data,
          contaId: r.conta_id,
          categoria: r.categoria,
          recorrente: Boolean(r.recorrente),
          status: r.status,
          observacao: r.observacao,
        })),
        despesas: (despesasRes.data || []).map((d: any) => ({
          id: d.id,
          descricao: d.descricao,
          valor: Number(d.valor || 0),
          data: d.data,
          contaId: d.conta_id,
          categoria: d.categoria,
          recorrente: Boolean(d.recorrente),
          status: d.status,
          observacao: d.observacao,
        })),
        parcelamentos: (parcelamentosRes.data || []).map((p: any) =>
          ensureInstallmentHistory({
            id: p.id,
            descricao: p.descricao,
            valorTotal: Number(p.valor_total || 0),
            parcelasTotal: Number(p.parcelas_total || 1),
            parcelaAtual: Number(p.parcela_atual || 1),
            valorParcela: Number(p.valor_parcela || 0),
            categoria: p.categoria,
            contaId: p.conta_id,
            dataInicio: p.data_inicio,
            status: p.status,
            observacao: p.observacao,
            historicoParcelas: p.historico_parcelas || [],
          })
        ),
        investimentos: (investimentosRes.data || []).map((i: any) => ({
          id: i.id,
          nome: i.nome,
          codigo: i.codigo,
          categoria: i.categoria,
          valorInvestido: Number(i.valor_investido || 0),
          valorAtual: Number(i.valor_atual || 0),
          aportes: Number(i.aportes || 0),
          resgates: Number(i.resgates || 0),
          rentabilidade: i.rentabilidade ? Number(i.rentabilidade) : undefined,
          historico: i.historico,
          dataInicio: i.data_inicio,
          instituicao: i.instituicao,
        })),
        dividas: (dividasRes.data || []).map((d: any) => ({
          id: d.id,
          nome: d.nome,
          credor: d.credor,
          saldoInicial: Number(d.saldo_inicial || 0),
          saldoAtual: Number(d.saldo_atual || 0),
          taxaJurosMensal: Number(d.taxa_juros_mensal || 0),
          valorParcela: Number(d.valor_parcela || 0),
          parcelasRestantes: Number(d.parcelas_restantes || 0),
          plano: d.plano || 'avalanche',
          dataVencimento: d.data_vencimento,
          categoria: d.categoria,
        })),
        metas: (metasRes.data || []).map((m: any) => ({
          id: m.id,
          titulo: m.titulo,
          valorAlvo: Number(m.valor_alvo || 0),
          acumulado: Number(m.acumulado || 0),
          prazo: m.prazo,
          categoria: m.categoria,
          prioridade: m.prioridade,
          status: m.status,
          cor: m.cor,
        })),
        configuracoes: {
          mesesReservaEmergencia: 6,
          moeda: 'BRL',
          estrategiaQuitacaoPadrao: 'avalanche',
        },
      };

      return { success: true, data: loadedData };
    }

    // If tables exist but are empty for this user
    if (!unifiedError) {
      return {
        success: true,
        data: undefined, // Indicates connection ok, but no data in Supabase yet for this user
      };
    }

    return {
      success: false,
      error: unifiedError.message || 'Tabelas do Supabase ainda não inicializadas.',
    };
  } catch (err: any) {
    console.error('Erro ao buscar dados do Supabase:', err);
    return { success: false, error: err.message || 'Erro de rede ou permissão.' };
  }
}

// Push local data to Supabase for a specific user
export async function pushFinanceDataToSupabase(data: FinanceData, userId?: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase não está configurado.' };
  }

  const docId = userId ? `${userId}_main` : 'main';

  try {
    // 1. Upsert into unified sync table (instant atomic update with Realtime broadcast)
    const payload: any = {
      id: docId,
      data: data,
      updated_at: new Date().toISOString(),
    };
    if (userId) {
      payload.user_id = userId;
    }

    const { error: unifiedError } = await client.from('finance_hub_data').upsert(payload);

    if (unifiedError) {
      console.warn('Aviso: Falha ao gravar em finance_hub_data:', unifiedError.message);
    }

    // 2. Also mirror into individual relational tables with user_id attached
    try {
      // Contas
      if (data.contas.length > 0) {
        await client.from('contas').upsert(
          data.contas.map((c) => ({
            id: c.id,
            user_id: userId || null,
            nome: c.nome,
            instituicao: c.instituicao,
            saldo: c.saldo,
            tipo: c.tipo,
            cor: c.cor,
            icone: c.icone,
            updated_at: new Date().toISOString(),
          }))
        );
      }

      // Receitas
      if (data.receitas.length > 0) {
        await client.from('receitas').upsert(
          data.receitas.map((r) => ({
            id: r.id,
            user_id: userId || null,
            descricao: r.descricao,
            valor: r.valor,
            data: r.data,
            conta_id: r.contaId,
            categoria: r.categoria,
            recorrente: r.recorrente,
            status: r.status,
            observacao: r.observacao,
            updated_at: new Date().toISOString(),
          }))
        );
      }

      // Despesas
      if (data.despesas.length > 0) {
        await client.from('despesas').upsert(
          data.despesas.map((d) => ({
            id: d.id,
            user_id: userId || null,
            descricao: d.descricao,
            valor: d.valor,
            data: d.data,
            conta_id: d.contaId,
            categoria: d.categoria,
            recorrente: d.recorrente,
            status: d.status,
            observacao: d.observacao,
            updated_at: new Date().toISOString(),
          }))
        );
      }

      // Parcelamentos
      if (data.parcelamentos.length > 0) {
        await client.from('parcelamentos').upsert(
          data.parcelamentos.map((p) => ({
            id: p.id,
            user_id: userId || null,
            descricao: p.descricao,
            valor_total: p.valorTotal,
            parcelas_total: p.parcelasTotal,
            parcela_atual: p.parcelaAtual,
            valor_parcela: p.valorParcela,
            categoria: p.categoria,
            conta_id: p.contaId,
            data_inicio: p.dataInicio,
            status: p.status,
            observacao: p.observacao,
            historico_parcelas: p.historicoParcelas,
            updated_at: new Date().toISOString(),
          }))
        );
      }

      // Investimentos
      if (data.investimentos.length > 0) {
        await client.from('investimentos').upsert(
          data.investimentos.map((i) => ({
            id: i.id,
            user_id: userId || null,
            nome: i.nome,
            codigo: i.codigo,
            categoria: i.categoria,
            valor_investido: i.valorInvestido,
            valor_atual: i.valorAtual,
            aportes: i.aportes,
            resgates: i.resgates,
            rentabilidade: i.rentabilidade,
            historico: i.historico,
            data_inicio: i.dataInicio,
            instituicao: i.instituicao,
            updated_at: new Date().toISOString(),
          }))
        );
      }

      // Dívidas
      if (data.dividas.length > 0) {
        await client.from('dividas').upsert(
          data.dividas.map((d) => ({
            id: d.id,
            user_id: userId || null,
            nome: d.nome,
            credor: d.credor,
            saldo_inicial: d.saldoInicial,
            saldo_atual: d.saldoAtual,
            taxa_juros_mensal: d.taxaJurosMensal,
            valor_parcela: d.valorParcela,
            parcelas_restantes: d.parcelasRestantes,
            plano: d.plano,
            data_vencimento: d.dataVencimento,
            categoria: d.categoria,
            updated_at: new Date().toISOString(),
          }))
        );
      }

      // Metas
      if (data.metas.length > 0) {
        await client.from('metas').upsert(
          data.metas.map((m) => ({
            id: m.id,
            user_id: userId || null,
            titulo: m.titulo,
            valor_alvo: m.valorAlvo,
            acumulado: m.acumulado,
            prazo: m.prazo,
            categoria: m.categoria,
            prioridade: m.prioridade,
            status: m.status,
            cor: m.cor,
            updated_at: new Date().toISOString(),
          }))
        );
      }
    } catch (relationalError) {
      console.warn('Aviso ao espelhar tabelas relacionais no Supabase:', relationalError);
    }

    if (unifiedError) {
      return { success: false, error: unifiedError.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Erro ao enviar dados para o Supabase:', err);
    return { success: false, error: err.message || 'Falha ao sincronizar com o Supabase.' };
  }
}

// Subscribe to real-time changes filtered by user
export function subscribeToSupabaseRealtime(
  userId: string | undefined,
  onDataChanged: (newData: FinanceData) => void
): (() => void) | null {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const channelName = `pfh-realtime-${userId || 'anon'}-${Math.random().toString(36).substring(2, 7)}`;
    const channel: RealtimeChannel = client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'finance_hub_data',
          ...(userId ? { filter: `id=eq.${userId}_main` } : {}),
        },
        (payload) => {
          if (payload.new && (payload.new as any).data) {
            // Verify user isolation in payload
            if (userId && (payload.new as any).user_id && (payload.new as any).user_id !== userId) {
              return;
            }
            const raw = (payload.new as any).data as FinanceData;
            const rawParcelas = (raw.parcelamentos || []) as Installment[];
            const normalizedParcelas = rawParcelas.map(ensureInstallmentHistory);

            onDataChanged({
              ...raw,
              parcelamentos: normalizedParcelas,
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`⚡ Conectado ao Supabase Realtime para usuário: ${userId || 'padrão'}`);
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
