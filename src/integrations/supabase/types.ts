export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          cadeira: string | null
          clinica_id: string
          confirmacao_token: string
          created_at: string
          created_by: string | null
          encaixe: boolean
          fim: string
          id: string
          inicio: string
          observacoes: string | null
          origem: string
          paciente_id: string | null
          procedimento_id: string | null
          profissional_id: string | null
          recorrencia_id: string | null
          status: Database["public"]["Enums"]["agendamento_status"]
          unidade_id: string | null
        }
        Insert: {
          cadeira?: string | null
          clinica_id: string
          confirmacao_token?: string
          created_at?: string
          created_by?: string | null
          encaixe?: boolean
          fim: string
          id?: string
          inicio: string
          observacoes?: string | null
          origem?: string
          paciente_id?: string | null
          procedimento_id?: string | null
          profissional_id?: string | null
          recorrencia_id?: string | null
          status?: Database["public"]["Enums"]["agendamento_status"]
          unidade_id?: string | null
        }
        Update: {
          cadeira?: string | null
          clinica_id?: string
          confirmacao_token?: string
          created_at?: string
          created_by?: string | null
          encaixe?: boolean
          fim?: string
          id?: string
          inicio?: string
          observacoes?: string | null
          origem?: string
          paciente_id?: string | null
          procedimento_id?: string | null
          profissional_id?: string | null
          recorrencia_id?: string | null
          status?: Database["public"]["Enums"]["agendamento_status"]
          unidade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_procedimento_id_fkey"
            columns: ["procedimento_id"]
            isOneToOne: false
            referencedRelation: "procedimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnese_links: {
        Row: {
          clinica_id: string
          created_at: string
          criado_por: string | null
          expira_em: string
          id: string
          modelo_id: string
          paciente_id: string
          token: string
          usado_em: string | null
        }
        Insert: {
          clinica_id: string
          created_at?: string
          criado_por?: string | null
          expira_em?: string
          id?: string
          modelo_id: string
          paciente_id: string
          token?: string
          usado_em?: string | null
        }
        Update: {
          clinica_id?: string
          created_at?: string
          criado_por?: string | null
          expira_em?: string
          id?: string
          modelo_id?: string
          paciente_id?: string
          token?: string
          usado_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anamnese_links_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnese_links_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "anamnese_modelos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnese_links_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnese_modelos: {
        Row: {
          ativo: boolean
          clinica_id: string
          created_at: string
          id: string
          nome: string
          perguntas: Json
          tipo: string
        }
        Insert: {
          ativo?: boolean
          clinica_id: string
          created_at?: string
          id?: string
          nome: string
          perguntas?: Json
          tipo?: string
        }
        Update: {
          ativo?: boolean
          clinica_id?: string
          created_at?: string
          id?: string
          nome?: string
          perguntas?: Json
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnese_modelos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      anamneses: {
        Row: {
          alertas: string[]
          clinica_id: string
          created_at: string
          id: string
          modelo_id: string | null
          modelo_nome: string | null
          origem: string
          paciente_id: string
          perguntas: Json
          preenchido_por: string | null
          respostas: Json
          versao: number
        }
        Insert: {
          alertas?: string[]
          clinica_id: string
          created_at?: string
          id?: string
          modelo_id?: string | null
          modelo_nome?: string | null
          origem?: string
          paciente_id: string
          perguntas?: Json
          preenchido_por?: string | null
          respostas?: Json
          versao?: number
        }
        Update: {
          alertas?: string[]
          clinica_id?: string
          created_at?: string
          id?: string
          modelo_id?: string | null
          modelo_nome?: string | null
          origem?: string
          paciente_id?: string
          perguntas?: Json
          preenchido_por?: string | null
          respostas?: Json
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "anamneses_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamneses_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "anamnese_modelos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamneses_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas_plataforma: {
        Row: {
          atualizado_por: string | null
          ciclo: string
          clinica_id: string
          created_at: string
          id: string
          motivo_status: string | null
          plano: string
          proxima_cobranca: string | null
          status: string
          trial_ate: string | null
          updated_at: string
          valor_mensal: number
        }
        Insert: {
          atualizado_por?: string | null
          ciclo?: string
          clinica_id: string
          created_at?: string
          id?: string
          motivo_status?: string | null
          plano?: string
          proxima_cobranca?: string | null
          status?: string
          trial_ate?: string | null
          updated_at?: string
          valor_mensal?: number
        }
        Update: {
          atualizado_por?: string | null
          ciclo?: string
          clinica_id?: string
          created_at?: string
          id?: string
          motivo_status?: string | null
          plano?: string
          proxima_cobranca?: string | null
          status?: string
          trial_ate?: string | null
          updated_at?: string
          valor_mensal?: number
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_plataforma_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: true
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria_logs: {
        Row: {
          acao: string
          clinica_id: string
          created_at: string
          detalhes: Json | null
          id: string
          registro_id: string | null
          tabela: string | null
          usuario_id: string | null
          usuario_nome: string | null
        }
        Insert: {
          acao: string
          clinica_id: string
          created_at?: string
          detalhes?: Json | null
          id?: string
          registro_id?: string | null
          tabela?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Update: {
          acao?: string
          clinica_id?: string
          created_at?: string
          detalhes?: Json | null
          id?: string
          registro_id?: string | null
          tabela?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_logs_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria_plataforma: {
        Row: {
          acao: string
          clinica_id: string
          created_at: string
          detalhes: Json
          id: string
          usuario_id: string
        }
        Insert: {
          acao: string
          clinica_id: string
          created_at?: string
          detalhes?: Json
          id?: string
          usuario_id: string
        }
        Update: {
          acao?: string
          clinica_id?: string
          created_at?: string
          detalhes?: Json
          id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_plataforma_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      bloqueios_agenda: {
        Row: {
          clinica_id: string
          created_at: string
          fim: string
          id: string
          inicio: string
          motivo: string
          profissional_id: string | null
        }
        Insert: {
          clinica_id: string
          created_at?: string
          fim: string
          id?: string
          inicio: string
          motivo: string
          profissional_id?: string | null
        }
        Update: {
          clinica_id?: string
          created_at?: string
          fim?: string
          id?: string
          inicio?: string
          motivo?: string
          profissional_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bloqueios_agenda_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloqueios_agenda_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      centros_custo: {
        Row: {
          ativo: boolean
          clinica_id: string
          created_at: string
          especialidade_id: string | null
          id: string
          nome: string
          unidade_id: string | null
        }
        Insert: {
          ativo?: boolean
          clinica_id: string
          created_at?: string
          especialidade_id?: string | null
          id?: string
          nome: string
          unidade_id?: string | null
        }
        Update: {
          ativo?: boolean
          clinica_id?: string
          created_at?: string
          especialidade_id?: string | null
          id?: string
          nome?: string
          unidade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "centros_custo_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "centros_custo_especialidade_id_fkey"
            columns: ["especialidade_id"]
            isOneToOne: false
            referencedRelation: "especialidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "centros_custo_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      clinicas: {
        Row: {
          agendamento_online: boolean
          cnpj: string | null
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          nome: string
          regime_tributario: string | null
          telefone: string | null
        }
        Insert: {
          agendamento_online?: boolean
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          regime_tributario?: string | null
          telefone?: string | null
        }
        Update: {
          agendamento_online?: boolean
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          regime_tributario?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      contas_financeiras: {
        Row: {
          agencia: string | null
          ativo: boolean
          banco: string | null
          clinica_id: string
          conta: string | null
          created_at: string
          id: string
          nome: string
          saldo_inicial: number
          tipo: string
          unidade_id: string | null
        }
        Insert: {
          agencia?: string | null
          ativo?: boolean
          banco?: string | null
          clinica_id: string
          conta?: string | null
          created_at?: string
          id?: string
          nome: string
          saldo_inicial?: number
          tipo: string
          unidade_id?: string | null
        }
        Update: {
          agencia?: string | null
          ativo?: boolean
          banco?: string | null
          clinica_id?: string
          conta?: string | null
          created_at?: string
          id?: string
          nome?: string
          saldo_inicial?: number
          tipo?: string
          unidade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_financeiras_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_financeiras_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      convenios: {
        Row: {
          ativo: boolean
          clinica_id: string
          created_at: string
          id: string
          nome: string
          registro_ans: string | null
        }
        Insert: {
          ativo?: boolean
          clinica_id: string
          created_at?: string
          id?: string
          nome: string
          registro_ans?: string | null
        }
        Update: {
          ativo?: boolean
          clinica_id?: string
          created_at?: string
          id?: string
          nome?: string
          registro_ans?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "convenios_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      convites: {
        Row: {
          aceito_em: string | null
          aceito_por: string | null
          clinica_id: string
          created_at: string
          criado_por: string | null
          email: string
          expira_em: string
          id: string
          papel: Database["public"]["Enums"]["app_role"]
          revogado_em: string | null
          token: string
          unidade_id: string | null
        }
        Insert: {
          aceito_em?: string | null
          aceito_por?: string | null
          clinica_id: string
          created_at?: string
          criado_por?: string | null
          email: string
          expira_em?: string
          id?: string
          papel: Database["public"]["Enums"]["app_role"]
          revogado_em?: string | null
          token?: string
          unidade_id?: string | null
        }
        Update: {
          aceito_em?: string | null
          aceito_por?: string | null
          clinica_id?: string
          created_at?: string
          criado_por?: string | null
          email?: string
          expira_em?: string
          id?: string
          papel?: Database["public"]["Enums"]["app_role"]
          revogado_em?: string | null
          token?: string
          unidade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "convites_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "convites_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      documento_modelos: {
        Row: {
          ativo: boolean
          clinica_id: string
          conteudo: string
          created_at: string
          id: string
          tipo: string
          titulo: string
        }
        Insert: {
          ativo?: boolean
          clinica_id: string
          conteudo: string
          created_at?: string
          id?: string
          tipo: string
          titulo: string
        }
        Update: {
          ativo?: boolean
          clinica_id?: string
          conteudo?: string
          created_at?: string
          id?: string
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "documento_modelos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_emitidos: {
        Row: {
          assinatura_digital: Json | null
          autor_id: string | null
          clinica_id: string
          conteudo: string
          created_at: string
          id: string
          modelo_id: string | null
          paciente_id: string
          profissional_id: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          assinatura_digital?: Json | null
          autor_id?: string | null
          clinica_id: string
          conteudo: string
          created_at?: string
          id?: string
          modelo_id?: string | null
          paciente_id: string
          profissional_id?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          assinatura_digital?: Json | null
          autor_id?: string | null
          clinica_id?: string
          conteudo?: string
          created_at?: string
          id?: string
          modelo_id?: string | null
          paciente_id?: string
          profissional_id?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_emitidos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_emitidos_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "documento_modelos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_emitidos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_emitidos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      especialidades: {
        Row: {
          ativo: boolean
          clinica_id: string
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          clinica_id: string
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          clinica_id?: string
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "especialidades_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_baixas_atendimento: {
        Row: {
          agendamento_id: string
          clinica_id: string
          created_at: string
          custo_total: number
          realizado_por: string | null
        }
        Insert: {
          agendamento_id: string
          clinica_id: string
          created_at?: string
          custo_total?: number
          realizado_por?: string | null
        }
        Update: {
          agendamento_id?: string
          clinica_id?: string
          created_at?: string
          custo_total?: number
          realizado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_baixas_atendimento_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: true
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_baixas_atendimento_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_itens: {
        Row: {
          ativo: boolean
          categoria: string | null
          clinica_id: string
          codigo_barras: string | null
          controla_lote: boolean
          controla_validade: boolean
          created_at: string
          custo_medio: number
          estoque_minimo: number
          fator_conversao: number
          fornecedor: string | null
          fornecedor_id: string | null
          id: string
          nome: string
          quantidade: number
          registro_anvisa: string | null
          unidade_compra: string | null
          unidade_medida: string | null
          validade: string | null
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          clinica_id: string
          codigo_barras?: string | null
          controla_lote?: boolean
          controla_validade?: boolean
          created_at?: string
          custo_medio?: number
          estoque_minimo?: number
          fator_conversao?: number
          fornecedor?: string | null
          fornecedor_id?: string | null
          id?: string
          nome: string
          quantidade?: number
          registro_anvisa?: string | null
          unidade_compra?: string | null
          unidade_medida?: string | null
          validade?: string | null
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          clinica_id?: string
          codigo_barras?: string | null
          controla_lote?: boolean
          controla_validade?: boolean
          created_at?: string
          custo_medio?: number
          estoque_minimo?: number
          fator_conversao?: number
          fornecedor?: string | null
          fornecedor_id?: string | null
          id?: string
          nome?: string
          quantidade?: number
          registro_anvisa?: string | null
          unidade_compra?: string | null
          unidade_medida?: string | null
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_itens_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_itens_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_lotes: {
        Row: {
          clinica_id: string
          created_at: string
          created_by: string | null
          custo_unitario: number
          entrada_em: string
          fornecedor_id: string | null
          id: string
          item_id: string
          nota_fiscal: string | null
          numero_lote: string | null
          quantidade: number
          unidade_id: string | null
          validade: string | null
        }
        Insert: {
          clinica_id: string
          created_at?: string
          created_by?: string | null
          custo_unitario?: number
          entrada_em?: string
          fornecedor_id?: string | null
          id?: string
          item_id: string
          nota_fiscal?: string | null
          numero_lote?: string | null
          quantidade?: number
          unidade_id?: string | null
          validade?: string | null
        }
        Update: {
          clinica_id?: string
          created_at?: string
          created_by?: string | null
          custo_unitario?: number
          entrada_em?: string
          fornecedor_id?: string | null
          id?: string
          item_id?: string
          nota_fiscal?: string | null
          numero_lote?: string | null
          quantidade?: number
          unidade_id?: string | null
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_lotes_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_lotes_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_lotes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "estoque_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_lotes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "estoque_saldo_itens"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "estoque_lotes_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_movimentacoes: {
        Row: {
          agendamento_id: string | null
          clinica_id: string
          created_at: string
          created_by: string | null
          custo_total: number
          custo_unitario: number
          delta: number | null
          id: string
          item_id: string
          lote_id: string | null
          motivo: string | null
          paciente_id: string | null
          procedimento_id: string | null
          profissional_id: string | null
          quantidade: number
          referencia_id: string | null
          tipo: string
          tipo_mov: Database["public"]["Enums"]["estoque_mov_tipo"] | null
          unidade_id: string | null
        }
        Insert: {
          agendamento_id?: string | null
          clinica_id: string
          created_at?: string
          created_by?: string | null
          custo_total?: number
          custo_unitario?: number
          delta?: number | null
          id?: string
          item_id: string
          lote_id?: string | null
          motivo?: string | null
          paciente_id?: string | null
          procedimento_id?: string | null
          profissional_id?: string | null
          quantidade: number
          referencia_id?: string | null
          tipo: string
          tipo_mov?: Database["public"]["Enums"]["estoque_mov_tipo"] | null
          unidade_id?: string | null
        }
        Update: {
          agendamento_id?: string | null
          clinica_id?: string
          created_at?: string
          created_by?: string | null
          custo_total?: number
          custo_unitario?: number
          delta?: number | null
          id?: string
          item_id?: string
          lote_id?: string | null
          motivo?: string | null
          paciente_id?: string | null
          procedimento_id?: string | null
          profissional_id?: string | null
          quantidade?: number
          referencia_id?: string | null
          tipo?: string
          tipo_mov?: Database["public"]["Enums"]["estoque_mov_tipo"] | null
          unidade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_movimentacoes_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "estoque_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "estoque_saldo_itens"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "estoque_lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_procedimento_id_fkey"
            columns: ["procedimento_id"]
            isOneToOne: false
            referencedRelation: "procedimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      evolucoes_clinicas: {
        Row: {
          agendamento_id: string | null
          autor_id: string | null
          autor_nome: string | null
          clinica_id: string
          created_at: string
          id: string
          paciente_id: string
          retifica_id: string | null
          texto: string
        }
        Insert: {
          agendamento_id?: string | null
          autor_id?: string | null
          autor_nome?: string | null
          clinica_id: string
          created_at?: string
          id?: string
          paciente_id: string
          retifica_id?: string | null
          texto: string
        }
        Update: {
          agendamento_id?: string | null
          autor_id?: string | null
          autor_nome?: string | null
          clinica_id?: string
          created_at?: string
          id?: string
          paciente_id?: string
          retifica_id?: string | null
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "evolucoes_clinicas_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evolucoes_clinicas_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evolucoes_clinicas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evolucoes_clinicas_retifica_id_fkey"
            columns: ["retifica_id"]
            isOneToOne: false
            referencedRelation: "evolucoes_clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiro_pagamentos: {
        Row: {
          cancelado_em: string | null
          cancelado_motivo: string | null
          centro_custo_id: string | null
          clinica_id: string
          competencia: string | null
          comprovante_path: string | null
          conta_financeira_id: string | null
          conta_id: string | null
          created_at: string
          desconto_baixa: number
          descricao: string
          forma_pagamento_id: string | null
          fornecedor: string | null
          fornecedor_id: string | null
          id: string
          juros: number
          multa: number
          origem_id: string | null
          origem_tipo: string | null
          pago_em: string | null
          pedido_compra_id: string | null
          previsto_credito_em: string | null
          recorrencia_id: string | null
          status: Database["public"]["Enums"]["lancamento_status"]
          taxa: number
          unidade_id: string | null
          valor: number
          valor_bruto: number | null
          valor_liquido: number | null
          valor_pago: number
          vencimento: string
        }
        Insert: {
          cancelado_em?: string | null
          cancelado_motivo?: string | null
          centro_custo_id?: string | null
          clinica_id: string
          competencia?: string | null
          comprovante_path?: string | null
          conta_financeira_id?: string | null
          conta_id?: string | null
          created_at?: string
          desconto_baixa?: number
          descricao: string
          forma_pagamento_id?: string | null
          fornecedor?: string | null
          fornecedor_id?: string | null
          id?: string
          juros?: number
          multa?: number
          origem_id?: string | null
          origem_tipo?: string | null
          pago_em?: string | null
          pedido_compra_id?: string | null
          previsto_credito_em?: string | null
          recorrencia_id?: string | null
          status?: Database["public"]["Enums"]["lancamento_status"]
          taxa?: number
          unidade_id?: string | null
          valor?: number
          valor_bruto?: number | null
          valor_liquido?: number | null
          valor_pago?: number
          vencimento: string
        }
        Update: {
          cancelado_em?: string | null
          cancelado_motivo?: string | null
          centro_custo_id?: string | null
          clinica_id?: string
          competencia?: string | null
          comprovante_path?: string | null
          conta_financeira_id?: string | null
          conta_id?: string | null
          created_at?: string
          desconto_baixa?: number
          descricao?: string
          forma_pagamento_id?: string | null
          fornecedor?: string | null
          fornecedor_id?: string | null
          id?: string
          juros?: number
          multa?: number
          origem_id?: string | null
          origem_tipo?: string | null
          pago_em?: string | null
          pedido_compra_id?: string | null
          previsto_credito_em?: string | null
          recorrencia_id?: string | null
          status?: Database["public"]["Enums"]["lancamento_status"]
          taxa?: number
          unidade_id?: string | null
          valor?: number
          valor_bruto?: number | null
          valor_liquido?: number | null
          valor_pago?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_pagamentos_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_pagamentos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_pagamentos_conta_financeira_id_fkey"
            columns: ["conta_financeira_id"]
            isOneToOne: false
            referencedRelation: "contas_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_pagamentos_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_pagamentos_forma_pagamento_id_fkey"
            columns: ["forma_pagamento_id"]
            isOneToOne: false
            referencedRelation: "formas_pagamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_pagamentos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_pagamentos_pedido_compra_id_fkey"
            columns: ["pedido_compra_id"]
            isOneToOne: false
            referencedRelation: "pedidos_compra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_pagamentos_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiro_recebimentos: {
        Row: {
          cancelado_em: string | null
          cancelado_motivo: string | null
          centro_custo_id: string | null
          clinica_id: string
          competencia: string | null
          comprovante_path: string | null
          conta_financeira_id: string | null
          conta_id: string | null
          created_at: string
          desconto_baixa: number
          descricao: string
          forma_pagamento: string | null
          forma_pagamento_id: string | null
          id: string
          juros: number
          multa: number
          orcamento_id: string | null
          origem_id: string | null
          origem_tipo: string | null
          paciente_id: string | null
          pago_em: string | null
          parcela: number
          previsto_credito_em: string | null
          profissional_id: string | null
          recorrencia_id: string | null
          status: Database["public"]["Enums"]["lancamento_status"]
          taxa: number
          total_parcelas: number
          unidade_id: string | null
          valor: number
          valor_bruto: number | null
          valor_liquido: number | null
          valor_pago: number
          vencimento: string
        }
        Insert: {
          cancelado_em?: string | null
          cancelado_motivo?: string | null
          centro_custo_id?: string | null
          clinica_id: string
          competencia?: string | null
          comprovante_path?: string | null
          conta_financeira_id?: string | null
          conta_id?: string | null
          created_at?: string
          desconto_baixa?: number
          descricao: string
          forma_pagamento?: string | null
          forma_pagamento_id?: string | null
          id?: string
          juros?: number
          multa?: number
          orcamento_id?: string | null
          origem_id?: string | null
          origem_tipo?: string | null
          paciente_id?: string | null
          pago_em?: string | null
          parcela?: number
          previsto_credito_em?: string | null
          profissional_id?: string | null
          recorrencia_id?: string | null
          status?: Database["public"]["Enums"]["lancamento_status"]
          taxa?: number
          total_parcelas?: number
          unidade_id?: string | null
          valor?: number
          valor_bruto?: number | null
          valor_liquido?: number | null
          valor_pago?: number
          vencimento: string
        }
        Update: {
          cancelado_em?: string | null
          cancelado_motivo?: string | null
          centro_custo_id?: string | null
          clinica_id?: string
          competencia?: string | null
          comprovante_path?: string | null
          conta_financeira_id?: string | null
          conta_id?: string | null
          created_at?: string
          desconto_baixa?: number
          descricao?: string
          forma_pagamento?: string | null
          forma_pagamento_id?: string | null
          id?: string
          juros?: number
          multa?: number
          orcamento_id?: string | null
          origem_id?: string | null
          origem_tipo?: string | null
          paciente_id?: string | null
          pago_em?: string | null
          parcela?: number
          previsto_credito_em?: string | null
          profissional_id?: string | null
          recorrencia_id?: string | null
          status?: Database["public"]["Enums"]["lancamento_status"]
          taxa?: number
          total_parcelas?: number
          unidade_id?: string | null
          valor?: number
          valor_bruto?: number | null
          valor_liquido?: number | null
          valor_pago?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_recebimentos_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_recebimentos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_recebimentos_conta_financeira_id_fkey"
            columns: ["conta_financeira_id"]
            isOneToOne: false
            referencedRelation: "contas_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_recebimentos_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_recebimentos_forma_pagamento_id_fkey"
            columns: ["forma_pagamento_id"]
            isOneToOne: false
            referencedRelation: "formas_pagamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_recebimentos_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_recebimentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_recebimentos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_recebimentos_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      formas_pagamento: {
        Row: {
          ativo: boolean
          clinica_id: string
          conta_financeira_id: string | null
          created_at: string
          id: string
          nome: string
          parcelamento_maximo: number
          prazo_recebimento_dias: number
          taxa_fixa: number
          taxa_percentual: number
          taxas_por_parcela: Json
          tipo: string
        }
        Insert: {
          ativo?: boolean
          clinica_id: string
          conta_financeira_id?: string | null
          created_at?: string
          id?: string
          nome: string
          parcelamento_maximo?: number
          prazo_recebimento_dias?: number
          taxa_fixa?: number
          taxa_percentual?: number
          taxas_por_parcela?: Json
          tipo: string
        }
        Update: {
          ativo?: boolean
          clinica_id?: string
          conta_financeira_id?: string | null
          created_at?: string
          id?: string
          nome?: string
          parcelamento_maximo?: number
          prazo_recebimento_dias?: number
          taxa_fixa?: number
          taxa_percentual?: number
          taxas_por_parcela?: Json
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "formas_pagamento_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formas_pagamento_conta_financeira_id_fkey"
            columns: ["conta_financeira_id"]
            isOneToOne: false
            referencedRelation: "contas_financeiras"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean
          clinica_id: string
          cnpj: string | null
          condicoes_pagamento: string | null
          contato: string | null
          created_at: string
          email: string | null
          id: string
          nome_fantasia: string | null
          prazo_entrega_dias: number
          razao_social: string
          telefone: string | null
        }
        Insert: {
          ativo?: boolean
          clinica_id: string
          cnpj?: string | null
          condicoes_pagamento?: string | null
          contato?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome_fantasia?: string | null
          prazo_entrega_dias?: number
          razao_social: string
          telefone?: string | null
        }
        Update: {
          ativo?: boolean
          clinica_id?: string
          cnpj?: string | null
          condicoes_pagamento?: string | null
          contato?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome_fantasia?: string | null
          prazo_entrega_dias?: number
          razao_social?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      horarios_profissional: {
        Row: {
          clinica_id: string
          created_at: string
          dia_semana: number
          fim: string
          id: string
          inicio: string
          intervalo_fim: string | null
          intervalo_inicio: string | null
          profissional_id: string
        }
        Insert: {
          clinica_id: string
          created_at?: string
          dia_semana: number
          fim: string
          id?: string
          inicio: string
          intervalo_fim?: string | null
          intervalo_inicio?: string | null
          profissional_id: string
        }
        Update: {
          clinica_id?: string
          created_at?: string
          dia_semana?: number
          fim?: string
          id?: string
          inicio?: string
          intervalo_fim?: string | null
          intervalo_inicio?: string | null
          profissional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "horarios_profissional_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "horarios_profissional_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      implantes: {
        Row: {
          ativo: boolean
          clinica_id: string
          componentes: string | null
          comprimento: number | null
          created_at: string
          created_by: string | null
          dente: string
          diametro: number | null
          estoque_lote_id: string | null
          id: string
          instalado_em: string | null
          lote: string | null
          marca: string | null
          modelo: string | null
          observacao: string | null
          paciente_id: string
        }
        Insert: {
          ativo?: boolean
          clinica_id: string
          componentes?: string | null
          comprimento?: number | null
          created_at?: string
          created_by?: string | null
          dente: string
          diametro?: number | null
          estoque_lote_id?: string | null
          id?: string
          instalado_em?: string | null
          lote?: string | null
          marca?: string | null
          modelo?: string | null
          observacao?: string | null
          paciente_id: string
        }
        Update: {
          ativo?: boolean
          clinica_id?: string
          componentes?: string | null
          comprimento?: number | null
          created_at?: string
          created_by?: string | null
          dente?: string
          diametro?: number | null
          estoque_lote_id?: string | null
          id?: string
          instalado_em?: string | null
          lote?: string | null
          marca?: string | null
          modelo?: string | null
          observacao?: string | null
          paciente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "implantes_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "implantes_estoque_lote_id_fkey"
            columns: ["estoque_lote_id"]
            isOneToOne: false
            referencedRelation: "estoque_lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "implantes_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario_itens: {
        Row: {
          clinica_id: string
          diferenca: number | null
          id: string
          inventario_id: string
          item_id: string
          lote_id: string
          quantidade_contada: number | null
          quantidade_sistema: number
        }
        Insert: {
          clinica_id: string
          diferenca?: number | null
          id?: string
          inventario_id: string
          item_id: string
          lote_id: string
          quantidade_contada?: number | null
          quantidade_sistema: number
        }
        Update: {
          clinica_id?: string
          diferenca?: number | null
          id?: string
          inventario_id?: string
          item_id?: string
          lote_id?: string
          quantidade_contada?: number | null
          quantidade_sistema?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventario_itens_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventario_itens_inventario_id_fkey"
            columns: ["inventario_id"]
            isOneToOne: false
            referencedRelation: "inventarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventario_itens_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "estoque_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventario_itens_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "estoque_saldo_itens"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "inventario_itens_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "estoque_lotes"
            referencedColumns: ["id"]
          },
        ]
      }
      inventarios: {
        Row: {
          aberto_por: string | null
          clinica_id: string
          created_at: string
          finalizado_em: string | null
          id: string
          motivo: string | null
          status: string
          unidade_id: string | null
        }
        Insert: {
          aberto_por?: string | null
          clinica_id: string
          created_at?: string
          finalizado_em?: string | null
          id?: string
          motivo?: string | null
          status?: string
          unidade_id?: string | null
        }
        Update: {
          aberto_por?: string | null
          clinica_id?: string
          created_at?: string
          finalizado_em?: string | null
          id?: string
          motivo?: string | null
          status?: string
          unidade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventarios_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventarios_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      laboratorios: {
        Row: {
          ativo: boolean
          clinica_id: string
          created_at: string
          email: string | null
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          ativo?: boolean
          clinica_id: string
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          telefone?: string | null
        }
        Update: {
          ativo?: boolean
          clinica_id?: string
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "laboratorios_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      lista_espera: {
        Row: {
          clinica_id: string
          created_at: string
          id: string
          paciente_id: string
          preferencia: string | null
          procedimento_id: string | null
          profissional_id: string | null
          status: string
        }
        Insert: {
          clinica_id: string
          created_at?: string
          id?: string
          paciente_id: string
          preferencia?: string | null
          procedimento_id?: string | null
          profissional_id?: string | null
          status?: string
        }
        Update: {
          clinica_id?: string
          created_at?: string
          id?: string
          paciente_id?: string
          preferencia?: string | null
          procedimento_id?: string | null
          profissional_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lista_espera_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_procedimento_id_fkey"
            columns: ["procedimento_id"]
            isOneToOne: false
            referencedRelation: "procedimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      odontograma_marcacoes: {
        Row: {
          ativo: boolean
          clinica_id: string
          condicao: string
          created_at: string
          created_by: string | null
          dente: string
          face: string | null
          id: string
          observacao: string | null
          orcamento_id: string | null
          paciente_id: string
          procedimento_id: string | null
          status: string
        }
        Insert: {
          ativo?: boolean
          clinica_id: string
          condicao: string
          created_at?: string
          created_by?: string | null
          dente: string
          face?: string | null
          id?: string
          observacao?: string | null
          orcamento_id?: string | null
          paciente_id: string
          procedimento_id?: string | null
          status?: string
        }
        Update: {
          ativo?: boolean
          clinica_id?: string
          condicao?: string
          created_at?: string
          created_by?: string | null
          dente?: string
          face?: string | null
          id?: string
          observacao?: string | null
          orcamento_id?: string | null
          paciente_id?: string
          procedimento_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "odontograma_marcacoes_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontograma_marcacoes_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontograma_marcacoes_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontograma_marcacoes_procedimento_id_fkey"
            columns: ["procedimento_id"]
            isOneToOne: false
            referencedRelation: "procedimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamento_aceites: {
        Row: {
          assinatura_base64: string
          canal: string
          clinica_id: string
          created_at: string
          documento: string | null
          id: string
          nome: string
          orcamento_id: string
          registrado_por: string | null
        }
        Insert: {
          assinatura_base64: string
          canal: string
          clinica_id: string
          created_at?: string
          documento?: string | null
          id?: string
          nome: string
          orcamento_id: string
          registrado_por?: string | null
        }
        Update: {
          assinatura_base64?: string
          canal?: string
          clinica_id?: string
          created_at?: string
          documento?: string | null
          id?: string
          nome?: string
          orcamento_id?: string
          registrado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_aceites_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_aceites_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamento_itens: {
        Row: {
          aprovado: boolean
          clinica_id: string
          created_at: string
          dente: string | null
          descricao: string
          faces: string[] | null
          id: string
          marcacao_id: string | null
          orcamento_id: string
          procedimento_id: string | null
          quantidade: number
          status: string
          valor_unitario: number
        }
        Insert: {
          aprovado?: boolean
          clinica_id: string
          created_at?: string
          dente?: string | null
          descricao: string
          faces?: string[] | null
          id?: string
          marcacao_id?: string | null
          orcamento_id: string
          procedimento_id?: string | null
          quantidade?: number
          status?: string
          valor_unitario?: number
        }
        Update: {
          aprovado?: boolean
          clinica_id?: string
          created_at?: string
          dente?: string | null
          descricao?: string
          faces?: string[] | null
          id?: string
          marcacao_id?: string | null
          orcamento_id?: string
          procedimento_id?: string | null
          quantidade?: number
          status?: string
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_itens_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_itens_marcacao_id_fkey"
            columns: ["marcacao_id"]
            isOneToOne: false
            referencedRelation: "odontograma_marcacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_itens_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_itens_procedimento_id_fkey"
            columns: ["procedimento_id"]
            isOneToOne: false
            referencedRelation: "procedimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          aceite_token: string | null
          aceite_token_expira: string | null
          aceito_em: string | null
          cancelado_em: string | null
          cancelado_motivo: string | null
          clinica_id: string
          created_at: string
          created_by: string | null
          desconto: number
          desconto_percentual: number
          desconto_tipo: string
          id: string
          observacoes: string | null
          paciente_id: string
          profissional_id: string | null
          status: Database["public"]["Enums"]["orcamento_status"]
          validade: string | null
          valor_total: number
          versao: number
        }
        Insert: {
          aceite_token?: string | null
          aceite_token_expira?: string | null
          aceito_em?: string | null
          cancelado_em?: string | null
          cancelado_motivo?: string | null
          clinica_id: string
          created_at?: string
          created_by?: string | null
          desconto?: number
          desconto_percentual?: number
          desconto_tipo?: string
          id?: string
          observacoes?: string | null
          paciente_id: string
          profissional_id?: string | null
          status?: Database["public"]["Enums"]["orcamento_status"]
          validade?: string | null
          valor_total?: number
          versao?: number
        }
        Update: {
          aceite_token?: string | null
          aceite_token_expira?: string | null
          aceito_em?: string | null
          cancelado_em?: string | null
          cancelado_motivo?: string | null
          clinica_id?: string
          created_at?: string
          created_by?: string | null
          desconto?: number
          desconto_percentual?: number
          desconto_tipo?: string
          id?: string
          observacoes?: string | null
          paciente_id?: string
          profissional_id?: string | null
          status?: Database["public"]["Enums"]["orcamento_status"]
          validade?: string | null
          valor_total?: number
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_laboratorio: {
        Row: {
          clinica_id: string
          cor: string | null
          created_at: string
          created_by: string | null
          custo: number
          dente: string | null
          enviado_em: string
          id: string
          laboratorio_id: string
          observacao: string | null
          paciente_id: string
          pagamento_id: string | null
          prazo: string | null
          retornado_em: string | null
          status: string
          trabalho: string
        }
        Insert: {
          clinica_id: string
          cor?: string | null
          created_at?: string
          created_by?: string | null
          custo?: number
          dente?: string | null
          enviado_em?: string
          id?: string
          laboratorio_id: string
          observacao?: string | null
          paciente_id: string
          pagamento_id?: string | null
          prazo?: string | null
          retornado_em?: string | null
          status?: string
          trabalho: string
        }
        Update: {
          clinica_id?: string
          cor?: string | null
          created_at?: string
          created_by?: string | null
          custo?: number
          dente?: string | null
          enviado_em?: string
          id?: string
          laboratorio_id?: string
          observacao?: string | null
          paciente_id?: string
          pagamento_id?: string | null
          prazo?: string | null
          retornado_em?: string | null
          status?: string
          trabalho?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_laboratorio_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_laboratorio_laboratorio_id_fkey"
            columns: ["laboratorio_id"]
            isOneToOne: false
            referencedRelation: "laboratorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_laboratorio_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_laboratorio_pagamento_id_fkey"
            columns: ["pagamento_id"]
            isOneToOne: false
            referencedRelation: "financeiro_pagamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      orto_contratos: {
        Row: {
          aparelho: string
          clinica_id: string
          created_at: string
          created_by: string | null
          dia_vencimento: number
          id: string
          inicio: string
          mensalidade: number
          meses: number
          observacao: string | null
          paciente_id: string
          profissional_id: string | null
          status: string
        }
        Insert: {
          aparelho: string
          clinica_id: string
          created_at?: string
          created_by?: string | null
          dia_vencimento: number
          id?: string
          inicio?: string
          mensalidade: number
          meses: number
          observacao?: string | null
          paciente_id: string
          profissional_id?: string | null
          status?: string
        }
        Update: {
          aparelho?: string
          clinica_id?: string
          created_at?: string
          created_by?: string | null
          dia_vencimento?: number
          id?: string
          inicio?: string
          mensalidade?: number
          meses?: number
          observacao?: string | null
          paciente_id?: string
          profissional_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "orto_contratos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orto_contratos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orto_contratos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      orto_manutencoes: {
        Row: {
          autor_id: string | null
          clinica_id: string
          contrato_id: string
          created_at: string
          descricao: string
          id: string
          realizada_em: string
        }
        Insert: {
          autor_id?: string | null
          clinica_id: string
          contrato_id: string
          created_at?: string
          descricao: string
          id?: string
          realizada_em?: string
        }
        Update: {
          autor_id?: string | null
          clinica_id?: string
          contrato_id?: string
          created_at?: string
          descricao?: string
          id?: string
          realizada_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "orto_manutencoes_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orto_manutencoes_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "orto_contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      paciente_arquivos: {
        Row: {
          ativo: boolean
          autor_id: string | null
          clinica_id: string
          created_at: string
          data_exame: string
          dente: string | null
          descricao: string | null
          id: string
          mime: string | null
          nome_arquivo: string | null
          paciente_id: string
          regiao: string | null
          storage_path: string
          tamanho: number | null
          tipo: string
        }
        Insert: {
          ativo?: boolean
          autor_id?: string | null
          clinica_id: string
          created_at?: string
          data_exame?: string
          dente?: string | null
          descricao?: string | null
          id?: string
          mime?: string | null
          nome_arquivo?: string | null
          paciente_id: string
          regiao?: string | null
          storage_path: string
          tamanho?: number | null
          tipo: string
        }
        Update: {
          ativo?: boolean
          autor_id?: string | null
          clinica_id?: string
          created_at?: string
          data_exame?: string
          dente?: string | null
          descricao?: string | null
          id?: string
          mime?: string | null
          nome_arquivo?: string | null
          paciente_id?: string
          regiao?: string | null
          storage_path?: string
          tamanho?: number | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "paciente_arquivos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paciente_arquivos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      paciente_lotes_aplicados: {
        Row: {
          agendamento_id: string | null
          aplicado_em: string
          clinica_id: string
          created_by: string | null
          dente: string | null
          id: string
          implante_id: string | null
          item_id: string
          lote_id: string
          paciente_id: string
          procedimento_id: string | null
          profissional_id: string | null
          quantidade: number
        }
        Insert: {
          agendamento_id?: string | null
          aplicado_em?: string
          clinica_id: string
          created_by?: string | null
          dente?: string | null
          id?: string
          implante_id?: string | null
          item_id: string
          lote_id: string
          paciente_id: string
          procedimento_id?: string | null
          profissional_id?: string | null
          quantidade: number
        }
        Update: {
          agendamento_id?: string | null
          aplicado_em?: string
          clinica_id?: string
          created_by?: string | null
          dente?: string | null
          id?: string
          implante_id?: string | null
          item_id?: string
          lote_id?: string
          paciente_id?: string
          procedimento_id?: string | null
          profissional_id?: string | null
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "paciente_lotes_aplicados_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paciente_lotes_aplicados_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paciente_lotes_aplicados_implante_id_fkey"
            columns: ["implante_id"]
            isOneToOne: false
            referencedRelation: "implantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paciente_lotes_aplicados_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "estoque_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paciente_lotes_aplicados_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "estoque_saldo_itens"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "paciente_lotes_aplicados_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "estoque_lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paciente_lotes_aplicados_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paciente_lotes_aplicados_procedimento_id_fkey"
            columns: ["procedimento_id"]
            isOneToOne: false
            referencedRelation: "procedimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paciente_lotes_aplicados_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      pacientes: {
        Row: {
          anamnese: Json
          assinatura_base64: string | null
          assinatura_path: string | null
          ativo: boolean
          cep: string | null
          cidade: string | null
          clinica_id: string
          consentimento_data: string | null
          consentimento_lgpd: boolean
          consentimentos: Json
          contato_preferencias: Json
          convenio_id: string | null
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          elegibilidade_pendente: boolean
          email: string | null
          endereco: string | null
          estado: string | null
          estado_civil: string | null
          foto_path: string | null
          id: string
          indicado_por: string | null
          nome: string
          nome_social: string | null
          numero_carteirinha: string | null
          observacoes: string | null
          origem: string | null
          profissao: string | null
          responsavel_cpf: string | null
          responsavel_nome: string | null
          responsavel_telefone: string | null
          rg: string | null
          sexo: string | null
          tags: string[]
          telefone: string | null
          unidade_id: string | null
        }
        Insert: {
          anamnese?: Json
          assinatura_base64?: string | null
          assinatura_path?: string | null
          ativo?: boolean
          cep?: string | null
          cidade?: string | null
          clinica_id: string
          consentimento_data?: string | null
          consentimento_lgpd?: boolean
          consentimentos?: Json
          contato_preferencias?: Json
          convenio_id?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          elegibilidade_pendente?: boolean
          email?: string | null
          endereco?: string | null
          estado?: string | null
          estado_civil?: string | null
          foto_path?: string | null
          id?: string
          indicado_por?: string | null
          nome: string
          nome_social?: string | null
          numero_carteirinha?: string | null
          observacoes?: string | null
          origem?: string | null
          profissao?: string | null
          responsavel_cpf?: string | null
          responsavel_nome?: string | null
          responsavel_telefone?: string | null
          rg?: string | null
          sexo?: string | null
          tags?: string[]
          telefone?: string | null
          unidade_id?: string | null
        }
        Update: {
          anamnese?: Json
          assinatura_base64?: string | null
          assinatura_path?: string | null
          ativo?: boolean
          cep?: string | null
          cidade?: string | null
          clinica_id?: string
          consentimento_data?: string | null
          consentimento_lgpd?: boolean
          consentimentos?: Json
          contato_preferencias?: Json
          convenio_id?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          elegibilidade_pendente?: boolean
          email?: string | null
          endereco?: string | null
          estado?: string | null
          estado_civil?: string | null
          foto_path?: string | null
          id?: string
          indicado_por?: string | null
          nome?: string
          nome_social?: string | null
          numero_carteirinha?: string | null
          observacoes?: string | null
          origem?: string | null
          profissao?: string | null
          responsavel_cpf?: string | null
          responsavel_nome?: string | null
          responsavel_telefone?: string | null
          rg?: string | null
          sexo?: string | null
          tags?: string[]
          telefone?: string | null
          unidade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pacientes_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacientes_convenio_id_fkey"
            columns: ["convenio_id"]
            isOneToOne: false
            referencedRelation: "convenios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacientes_indicado_por_fkey"
            columns: ["indicado_por"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacientes_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_compra_itens: {
        Row: {
          clinica_id: string
          created_at: string
          custo_unitario: number
          id: string
          item_id: string
          pedido_id: string
          quantidade: number
          quantidade_recebida: number
        }
        Insert: {
          clinica_id: string
          created_at?: string
          custo_unitario?: number
          id?: string
          item_id: string
          pedido_id: string
          quantidade: number
          quantidade_recebida?: number
        }
        Update: {
          clinica_id?: string
          created_at?: string
          custo_unitario?: number
          id?: string
          item_id?: string
          pedido_id?: string
          quantidade?: number
          quantidade_recebida?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedido_compra_itens_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_compra_itens_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "estoque_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_compra_itens_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "estoque_saldo_itens"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "pedido_compra_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_compra: {
        Row: {
          cancelado_motivo: string | null
          clinica_id: string
          created_at: string
          created_by: string | null
          fornecedor_id: string
          id: string
          numero: number
          observacao: string | null
          previsao_entrega: string | null
          status: string
          unidade_id: string | null
        }
        Insert: {
          cancelado_motivo?: string | null
          clinica_id: string
          created_at?: string
          created_by?: string | null
          fornecedor_id: string
          id?: string
          numero?: number
          observacao?: string | null
          previsao_entrega?: string | null
          status?: string
          unidade_id?: string | null
        }
        Update: {
          cancelado_motivo?: string | null
          clinica_id?: string
          created_at?: string
          created_by?: string | null
          fornecedor_id?: string
          id?: string
          numero?: number
          observacao?: string | null
          previsao_entrega?: string | null
          status?: string
          unidade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_compra_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_compra_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_compra_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      periogramas: {
        Row: {
          autor_id: string | null
          clinica_id: string
          created_at: string
          dados: Json
          id: string
          observacao: string | null
          paciente_id: string
        }
        Insert: {
          autor_id?: string | null
          clinica_id: string
          created_at?: string
          dados?: Json
          id?: string
          observacao?: string | null
          paciente_id: string
        }
        Update: {
          autor_id?: string | null
          clinica_id?: string
          created_at?: string
          dados?: Json
          id?: string
          observacao?: string | null
          paciente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "periogramas_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "periogramas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      plano_contas: {
        Row: {
          ativo: boolean
          centro_custo: string | null
          clinica_id: string
          codigo: string | null
          created_at: string
          id: string
          natureza: string | null
          nome: string
          pai_id: string | null
          tipo: Database["public"]["Enums"]["conta_tipo"]
        }
        Insert: {
          ativo?: boolean
          centro_custo?: string | null
          clinica_id: string
          codigo?: string | null
          created_at?: string
          id?: string
          natureza?: string | null
          nome: string
          pai_id?: string | null
          tipo: Database["public"]["Enums"]["conta_tipo"]
        }
        Update: {
          ativo?: boolean
          centro_custo?: string | null
          clinica_id?: string
          codigo?: string | null
          created_at?: string
          id?: string
          natureza?: string | null
          nome?: string
          pai_id?: string | null
          tipo?: Database["public"]["Enums"]["conta_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "plano_contas_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plano_contas_pai_id_fkey"
            columns: ["pai_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          ativo: boolean
          created_at: string
          nome: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          nome?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          nome?: string
          user_id?: string
        }
        Relationships: []
      }
      procedimento_insumos: {
        Row: {
          clinica_id: string
          created_at: string
          id: string
          item_id: string
          procedimento_id: string
          quantidade: number
        }
        Insert: {
          clinica_id: string
          created_at?: string
          id?: string
          item_id: string
          procedimento_id: string
          quantidade: number
        }
        Update: {
          clinica_id?: string
          created_at?: string
          id?: string
          item_id?: string
          procedimento_id?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "procedimento_insumos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedimento_insumos_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "estoque_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedimento_insumos_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "estoque_saldo_itens"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "procedimento_insumos_procedimento_id_fkey"
            columns: ["procedimento_id"]
            isOneToOne: false
            referencedRelation: "procedimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      procedimentos: {
        Row: {
          ativo: boolean
          categoria: string | null
          clinica_id: string
          codigo: string | null
          codigo_tuss: string | null
          created_at: string
          custo_estimado: number
          duracao_minutos: number
          especialidade_id: string | null
          exige_lote_aplicado: boolean
          id: string
          intervalo_retorno_dias: number | null
          nome: string
          publico: string
          requer_termo: boolean
          sessoes_previstas: number
          termo_modelo_id: string | null
          tipo: string
          valor: number
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          clinica_id: string
          codigo?: string | null
          codigo_tuss?: string | null
          created_at?: string
          custo_estimado?: number
          duracao_minutos?: number
          especialidade_id?: string | null
          exige_lote_aplicado?: boolean
          id?: string
          intervalo_retorno_dias?: number | null
          nome: string
          publico?: string
          requer_termo?: boolean
          sessoes_previstas?: number
          termo_modelo_id?: string | null
          tipo?: string
          valor?: number
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          clinica_id?: string
          codigo?: string | null
          codigo_tuss?: string | null
          created_at?: string
          custo_estimado?: number
          duracao_minutos?: number
          especialidade_id?: string | null
          exige_lote_aplicado?: boolean
          id?: string
          intervalo_retorno_dias?: number | null
          nome?: string
          publico?: string
          requer_termo?: boolean
          sessoes_previstas?: number
          termo_modelo_id?: string | null
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "procedimentos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedimentos_especialidade_id_fkey"
            columns: ["especialidade_id"]
            isOneToOne: false
            referencedRelation: "especialidades"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean
          clinica_id: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          telefone: string | null
          unidade_id: string | null
        }
        Insert: {
          ativo?: boolean
          clinica_id?: string | null
          created_at?: string
          email?: string | null
          id: string
          nome?: string
          telefone?: string | null
          unidade_id?: string | null
        }
        Update: {
          ativo?: boolean
          clinica_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          unidade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      profissionais: {
        Row: {
          ativo: boolean
          clinica_id: string
          comissao_percentual: number
          cor: string | null
          created_at: string
          cro: string | null
          especialidade: string | null
          id: string
          nome: string
          unidade_id: string | null
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          clinica_id: string
          comissao_percentual?: number
          cor?: string | null
          created_at?: string
          cro?: string | null
          especialidade?: string | null
          id?: string
          nome: string
          unidade_id?: string | null
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          clinica_id?: string
          comissao_percentual?: number
          cor?: string | null
          created_at?: string
          cro?: string | null
          especialidade?: string | null
          id?: string
          nome?: string
          unidade_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profissionais_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profissionais_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      salas: {
        Row: {
          ativo: boolean
          clinica_id: string
          created_at: string
          id: string
          nome: string
          unidade_id: string | null
        }
        Insert: {
          ativo?: boolean
          clinica_id: string
          created_at?: string
          id?: string
          nome: string
          unidade_id?: string | null
        }
        Update: {
          ativo?: boolean
          clinica_id?: string
          created_at?: string
          id?: string
          nome?: string
          unidade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salas_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salas_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      suporte_notas: {
        Row: {
          autor_id: string
          clinica_id: string
          created_at: string
          id: string
          nota: string
        }
        Insert: {
          autor_id: string
          clinica_id: string
          created_at?: string
          id?: string
          nota: string
        }
        Update: {
          autor_id?: string
          clinica_id?: string
          created_at?: string
          id?: string
          nota?: string
        }
        Relationships: [
          {
            foreignKeyName: "suporte_notas_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      tabela_preco_itens: {
        Row: {
          clinica_id: string
          created_at: string
          id: string
          procedimento_id: string
          tabela_id: string
          valor: number
        }
        Insert: {
          clinica_id: string
          created_at?: string
          id?: string
          procedimento_id: string
          tabela_id: string
          valor: number
        }
        Update: {
          clinica_id?: string
          created_at?: string
          id?: string
          procedimento_id?: string
          tabela_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "tabela_preco_itens_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabela_preco_itens_procedimento_id_fkey"
            columns: ["procedimento_id"]
            isOneToOne: false
            referencedRelation: "procedimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabela_preco_itens_tabela_id_fkey"
            columns: ["tabela_id"]
            isOneToOne: false
            referencedRelation: "tabelas_preco"
            referencedColumns: ["id"]
          },
        ]
      }
      tabelas_preco: {
        Row: {
          ativo: boolean
          clinica_id: string
          convenio_id: string | null
          created_at: string
          id: string
          nome: string
          tipo: string
        }
        Insert: {
          ativo?: boolean
          clinica_id: string
          convenio_id?: string | null
          created_at?: string
          id?: string
          nome: string
          tipo?: string
        }
        Update: {
          ativo?: boolean
          clinica_id?: string
          convenio_id?: string | null
          created_at?: string
          id?: string
          nome?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "tabelas_preco_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabelas_preco_convenio_id_fkey"
            columns: ["convenio_id"]
            isOneToOne: false
            referencedRelation: "convenios"
            referencedColumns: ["id"]
          },
        ]
      }
      tratamento_sessoes: {
        Row: {
          agendamento_id: string | null
          clinica_id: string
          created_at: string
          created_by: string | null
          id: string
          numero: number
          observacao: string | null
          orcamento_item_id: string
          realizado_em: string | null
          status: string
        }
        Insert: {
          agendamento_id?: string | null
          clinica_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          numero?: number
          observacao?: string | null
          orcamento_item_id: string
          realizado_em?: string | null
          status?: string
        }
        Update: {
          agendamento_id?: string | null
          clinica_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          numero?: number
          observacao?: string | null
          orcamento_item_id?: string
          realizado_em?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tratamento_sessoes_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tratamento_sessoes_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tratamento_sessoes_orcamento_item_id_fkey"
            columns: ["orcamento_item_id"]
            isOneToOne: false
            referencedRelation: "orcamento_itens"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades: {
        Row: {
          ativo: boolean
          clinica_id: string
          created_at: string
          endereco: string | null
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          ativo?: boolean
          clinica_id: string
          created_at?: string
          endereco?: string | null
          id?: string
          nome: string
          telefone?: string | null
        }
        Update: {
          ativo?: boolean
          clinica_id?: string
          created_at?: string
          endereco?: string | null
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unidades_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          clinica_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          clinica_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          clinica_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      estoque_saldo_itens: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          clinica_id: string | null
          custo_medio: number | null
          estoque_minimo: number | null
          item_id: string | null
          nome: string | null
          proxima_validade: string | null
          saldo: number | null
          unidade_medida: string | null
          valor: number | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_itens_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_saldos: {
        Row: {
          clinica_id: string | null
          item_id: string | null
          proxima_validade: string | null
          saldo: number | null
          unidade_id: string | null
          valor: number | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_lotes_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_lotes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "estoque_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_lotes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "estoque_saldo_itens"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "estoque_lotes_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _estoque_entrada: {
        Args: {
          p_custo: number
          p_fornecedor: string
          p_item: string
          p_lote: string
          p_motivo: string
          p_nota: string
          p_qtd: number
          p_ref?: string
          p_tipo: Database["public"]["Enums"]["estoque_mov_tipo"]
          p_unidade: string
          p_validade: string
        }
        Returns: string
      }
      _estoque_mov: {
        Args: {
          p_agendamento?: string
          p_delta: number
          p_lote: string
          p_motivo: string
          p_paciente?: string
          p_procedimento?: string
          p_profissional?: string
          p_ref?: string
          p_tipo: Database["public"]["Enums"]["estoque_mov_tipo"]
        }
        Returns: string
      }
      abrir_inventario: { Args: { p_unidade: string }; Returns: string }
      aceitar_convite: { Args: { p_token: string }; Returns: string }
      aceitar_orcamento_link: {
        Args: {
          p_assinatura: string
          p_documento: string
          p_nome: string
          p_token: string
        }
        Returns: undefined
      }
      adicionar_nota_suporte: {
        Args: { p_clinica: string; p_nota: string }
        Returns: string
      }
      administrar_cliente_plataforma: {
        Args: {
          p_ciclo: string
          p_clinica: string
          p_motivo?: string
          p_nota?: string
          p_plano: string
          p_proxima_cobranca?: string
          p_status: string
          p_trial_ate?: string
          p_valor: number
        }
        Returns: undefined
      }
      agenda_publica_info: { Args: { p_clinica: string }; Returns: Json }
      agendar_online: {
        Args: {
          p_clinica: string
          p_email?: string
          p_inicio: string
          p_nome: string
          p_procedimento: string
          p_profissional: string
          p_telefone: string
        }
        Returns: Json
      }
      ajustar_orcamento: {
        Args: {
          p_desconto: number
          p_desconto_tipo: string
          p_itens_aprovados: string[]
          p_orcamento: string
          p_validade: string
        }
        Returns: undefined
      }
      aprovar_orcamento: {
        Args: {
          p_dia_vencimento: number
          p_entrada?: number
          p_forma_pagamento?: string
          p_orcamento: string
          p_parcelas: number
        }
        Returns: undefined
      }
      atualizar_item_tratamento: {
        Args: { p_item: string; p_observacao?: string; p_status: string }
        Returns: undefined
      }
      atualizar_status_pedido: {
        Args: { p_motivo?: string; p_pedido: string; p_status: string }
        Returns: undefined
      }
      baixar_insumos_atendimento: {
        Args: { p_agendamento: string; p_insumos?: Json }
        Returns: Json
      }
      calcular_alertas: {
        Args: { p_perguntas: Json; p_respostas: Json }
        Returns: string[]
      }
      cancelar_lancamento: {
        Args: { p_id: string; p_motivo: string; p_tipo: string }
        Returns: undefined
      }
      cancelar_orcamento: {
        Args: { p_motivo: string; p_orcamento: string }
        Returns: undefined
      }
      criar_agendamentos: {
        Args: {
          p_cadeira: string
          p_duracao: number
          p_encaixe?: boolean
          p_inicio: string
          p_intervalo_dias?: number
          p_observacoes?: string
          p_paciente: string
          p_procedimento: string
          p_profissional: string
          p_repeticoes?: number
          p_unidade: string
        }
        Returns: number
      }
      criar_clinica: {
        Args: {
          p_cnpj?: string
          p_cro?: string
          p_endereco?: string
          p_nome: string
          p_profissional?: string
          p_regime?: string
          p_telefone?: string
          p_unidade?: string
        }
        Returns: string
      }
      criar_contrato_orto: {
        Args: {
          p_aparelho: string
          p_dia: number
          p_inicio: string
          p_mensalidade: number
          p_meses: number
          p_observacao?: string
          p_paciente: string
          p_profissional: string
        }
        Returns: string
      }
      criar_ordem_laboratorio: {
        Args: {
          p_cor: string
          p_custo: number
          p_dente: string
          p_laboratorio: string
          p_observacao?: string
          p_paciente: string
          p_prazo: string
          p_trabalho: string
        }
        Returns: string
      }
      criar_pedido_compra: {
        Args: {
          p_fornecedor: string
          p_itens: Json
          p_observacao: string
          p_previsao: string
          p_unidade: string
        }
        Returns: string
      }
      current_clinica_id: { Args: never; Returns: string }
      enviar_anamnese_link: {
        Args: { p_respostas: Json; p_token: string }
        Returns: undefined
      }
      finalizar_atendimento: {
        Args: { p_agendamento: string; p_cobrar?: boolean; p_insumos?: Json }
        Returns: Json
      }
      finalizar_inventario: {
        Args: { p_inventario: string; p_motivo: string }
        Returns: number
      }
      gerar_link_aceite_orcamento: {
        Args: { p_orcamento: string }
        Returns: string
      }
      gerar_orcamento: {
        Args: { p_paciente: string; p_validade_dias?: number }
        Returns: string
      }
      gerenciar_assinatura: {
        Args: {
          p_ciclo: string
          p_clinica: string
          p_motivo?: string
          p_plano: string
          p_proxima_cobranca?: string
          p_status: string
          p_trial_ate?: string
          p_valor: number
        }
        Returns: undefined
      }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | {
            Args: {
              _clinica: string
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
      horarios_livres: {
        Args: {
          p_clinica: string
          p_dia: string
          p_procedimento: string
          p_profissional: string
        }
        Returns: string[]
      }
      is_platform_admin: { Args: { _user_id?: string }; Returns: boolean }
      listar_clientes_plataforma: {
        Args: { p_busca?: string }
        Returns: {
          ciclo: string
          clinica_id: string
          clinica_nome: string
          cnpj: string
          contato_email: string
          contato_telefone: string
          criado_em: string
          motivo_status: string
          plano: string
          proxima_cobranca: string
          responsavel: string
          responsavel_email: string
          status: string
          trial_ate: string
          unidades: number
          usuarios: number
          valor_mensal: number
        }[]
      }
      marcar_atendido: {
        Args: { p_agendamento: string; p_cobrar?: boolean }
        Returns: Json
      }
      receber_pedido: {
        Args: {
          p_itens: Json
          p_nota: string
          p_pedido: string
          p_vencimento?: string
        }
        Returns: string
      }
      registrar_aceite_orcamento: {
        Args: {
          p_assinatura: string
          p_documento: string
          p_nome: string
          p_orcamento: string
        }
        Returns: undefined
      }
      registrar_contagem: {
        Args: { p_inventario_item: string; p_quantidade: number }
        Returns: undefined
      }
      registrar_entrada_estoque: {
        Args: {
          p_custo_unitario: number
          p_fornecedor?: string
          p_item: string
          p_lote: string
          p_motivo?: string
          p_nota?: string
          p_quantidade: number
          p_unidade: string
          p_validade: string
        }
        Returns: string
      }
      registrar_movimento_estoque: {
        Args: {
          p_lote: string
          p_motivo: string
          p_quantidade: number
          p_tipo: string
        }
        Returns: string
      }
      relatorio_custo_procedimentos: {
        Args: { p_fim: string; p_inicio: string }
        Returns: {
          atendimentos: number
          custo_estimado: number
          custo_medio: number
          custo_total: number
          procedimento: string
          procedimento_id: string
          valor: number
        }[]
      }
      responder_confirmacao: {
        Args: { p_confirmar: boolean; p_token: string }
        Returns: string
      }
      resumo_admin_plataforma: { Args: never; Returns: Json }
      semear_modelos_documentos: {
        Args: { p_clinica: string }
        Returns: undefined
      }
      semear_padroes_clinicos: {
        Args: { p_clinica: string }
        Returns: undefined
      }
      sugestao_compra: {
        Args: never
        Returns: {
          consumo_diario: number
          custo_medio: number
          estoque_minimo: number
          fornecedor: string
          fornecedor_id: string
          item_id: string
          nome: string
          prazo_dias: number
          saldo: number
          sugerido: number
          unidade_medida: string
        }[]
      }
      tem_papel: {
        Args: { _roles: Database["public"]["Enums"]["app_role"][] }
        Returns: boolean
      }
      transferir_estoque: {
        Args: {
          p_lote: string
          p_motivo?: string
          p_quantidade: number
          p_unidade_destino: string
        }
        Returns: string
      }
      ver_anamnese_link: {
        Args: { p_token: string }
        Returns: {
          clinica_nome: string
          modelo_nome: string
          paciente_nome: string
          perguntas: Json
          valido: boolean
        }[]
      }
      ver_confirmacao: { Args: { p_token: string }; Returns: Json }
      ver_convite: {
        Args: { p_token: string }
        Returns: {
          clinica_nome: string
          email: string
          expira_em: string
          papel: Database["public"]["Enums"]["app_role"]
          valido: boolean
        }[]
      }
      ver_orcamento_aceite: { Args: { p_token: string }; Returns: Json }
      verificar_acesso_clinica: { Args: never; Returns: Json }
    }
    Enums: {
      agendamento_status:
        | "agendado"
        | "confirmado"
        | "em_atendimento"
        | "atendido"
        | "faltou"
        | "cancelado"
      app_role:
        | "owner"
        | "dentista"
        | "recepcao"
        | "financeiro"
        | "admin"
        | "esteticista"
        | "auxiliar"
        | "estoque"
        | "marketing"
      conta_tipo: "receita" | "despesa"
      estoque_mov_tipo:
        | "entrada"
        | "saida_uso"
        | "ajuste"
        | "perda"
        | "vencido"
        | "transferencia"
        | "devolucao"
      lancamento_status: "pendente" | "pago" | "atrasado" | "cancelado"
      orcamento_status:
        | "pendente"
        | "aprovado"
        | "em_execucao"
        | "concluido"
        | "recusado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agendamento_status: [
        "agendado",
        "confirmado",
        "em_atendimento",
        "atendido",
        "faltou",
        "cancelado",
      ],
      app_role: [
        "owner",
        "dentista",
        "recepcao",
        "financeiro",
        "admin",
        "esteticista",
        "auxiliar",
        "estoque",
        "marketing",
      ],
      conta_tipo: ["receita", "despesa"],
      estoque_mov_tipo: [
        "entrada",
        "saida_uso",
        "ajuste",
        "perda",
        "vencido",
        "transferencia",
        "devolucao",
      ],
      lancamento_status: ["pendente", "pago", "atrasado", "cancelado"],
      orcamento_status: [
        "pendente",
        "aprovado",
        "em_execucao",
        "concluido",
        "recusado",
      ],
    },
  },
} as const
