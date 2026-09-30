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
          created_at: string
          created_by: string | null
          fim: string
          id: string
          inicio: string
          observacoes: string | null
          paciente_id: string | null
          procedimento_id: string | null
          profissional_id: string | null
          status: Database["public"]["Enums"]["agendamento_status"]
          unidade_id: string | null
        }
        Insert: {
          cadeira?: string | null
          clinica_id: string
          created_at?: string
          created_by?: string | null
          fim: string
          id?: string
          inicio: string
          observacoes?: string | null
          paciente_id?: string | null
          procedimento_id?: string | null
          profissional_id?: string | null
          status?: Database["public"]["Enums"]["agendamento_status"]
          unidade_id?: string | null
        }
        Update: {
          cadeira?: string | null
          clinica_id?: string
          created_at?: string
          created_by?: string | null
          fim?: string
          id?: string
          inicio?: string
          observacoes?: string | null
          paciente_id?: string | null
          procedimento_id?: string | null
          profissional_id?: string | null
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
      clinicas: {
        Row: {
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
      documentos_emitidos: {
        Row: {
          autor_id: string | null
          clinica_id: string
          conteudo: string
          created_at: string
          id: string
          paciente_id: string
          tipo: string
          titulo: string
        }
        Insert: {
          autor_id?: string | null
          clinica_id: string
          conteudo: string
          created_at?: string
          id?: string
          paciente_id: string
          tipo: string
          titulo: string
        }
        Update: {
          autor_id?: string | null
          clinica_id?: string
          conteudo?: string
          created_at?: string
          id?: string
          paciente_id?: string
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
            foreignKeyName: "documentos_emitidos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_itens: {
        Row: {
          clinica_id: string
          created_at: string
          estoque_minimo: number
          fornecedor: string | null
          id: string
          nome: string
          quantidade: number
          unidade_medida: string | null
          validade: string | null
        }
        Insert: {
          clinica_id: string
          created_at?: string
          estoque_minimo?: number
          fornecedor?: string | null
          id?: string
          nome: string
          quantidade?: number
          unidade_medida?: string | null
          validade?: string | null
        }
        Update: {
          clinica_id?: string
          created_at?: string
          estoque_minimo?: number
          fornecedor?: string | null
          id?: string
          nome?: string
          quantidade?: number
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
        ]
      }
      estoque_lotes: {
        Row: {
          clinica_id: string
          created_at: string
          created_by: string | null
          entrada_em: string
          id: string
          item_id: string
          lote_id: string | null
          numero_lote: string | null
          quantidade: number
          unidade_id: string | null
          validade: string | null
        }
        Insert: {
          clinica_id: string
          created_at?: string
          created_by?: string | null
          entrada_em?: string
          id?: string
          item_id: string
          lote_id: string | null
          numero_lote?: string | null
          quantidade?: number
          unidade_id?: string | null
          validade?: string | null
        }
        Update: {
          clinica_id?: string
          created_at?: string
          created_by?: string | null
          entrada_em?: string
          id?: string
          item_id?: string
          lote_id?: string | null
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
            foreignKeyName: "estoque_lotes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "estoque_itens"
            referencedColumns: ["id"]
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
      estoque_lotes: {
        Row: {
          clinica_id: string
          created_at: string
          id: string
          item_id: string
          lote_id: string | null
          lote_codigo: string | null
          quantidade: number
          validade: string | null
        }
        Insert: {
          clinica_id: string
          created_at?: string
          id?: string
          item_id: string
          lote_id: string | null
          lote_codigo?: string | null
          quantidade?: number
          validade?: string | null
        }
        Update: {
          clinica_id?: string
          created_at?: string
          id?: string
          item_id?: string
          lote_id?: string | null
          lote_codigo?: string | null
          quantidade?: number
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
            foreignKeyName: "estoque_lotes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "estoque_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "estoque_lotes"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_movimentacoes: {
        Row: {
          clinica_id: string
          created_at: string
          created_by: string | null
          id: string
          item_id: string
          lote_id: string | null
          motivo: string | null
          quantidade: number
          tipo: string
        }
        Insert: {
          clinica_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          item_id: string
          lote_id: string | null
          motivo?: string | null
          quantidade: number
          tipo: string
        }
        Update: {
          clinica_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          item_id?: string
          lote_id?: string | null
          motivo?: string | null
          quantidade?: number
          tipo?: string
        }
        Relationships: [
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
          clinica_id: string
          conta_id: string | null
          created_at: string
          descricao: string
          fornecedor: string | null
          id: string
          pago_em: string | null
          status: Database["public"]["Enums"]["lancamento_status"]
          unidade_id: string | null
          valor: number
          vencimento: string
        }
        Insert: {
          clinica_id: string
          conta_id?: string | null
          created_at?: string
          descricao: string
          fornecedor?: string | null
          id?: string
          pago_em?: string | null
          status?: Database["public"]["Enums"]["lancamento_status"]
          unidade_id?: string | null
          valor?: number
          vencimento: string
        }
        Update: {
          clinica_id?: string
          conta_id?: string | null
          created_at?: string
          descricao?: string
          fornecedor?: string | null
          id?: string
          pago_em?: string | null
          status?: Database["public"]["Enums"]["lancamento_status"]
          unidade_id?: string | null
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_pagamentos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
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
          clinica_id: string
          conta_id: string | null
          created_at: string
          descricao: string
          forma_pagamento: string | null
          id: string
          orcamento_id: string | null
          paciente_id: string | null
          pago_em: string | null
          parcela: number
          profissional_id: string | null
          status: Database["public"]["Enums"]["lancamento_status"]
          total_parcelas: number
          unidade_id: string | null
          valor: number
          vencimento: string
        }
        Insert: {
          clinica_id: string
          conta_id?: string | null
          created_at?: string
          descricao: string
          forma_pagamento?: string | null
          id?: string
          orcamento_id?: string | null
          paciente_id?: string | null
          pago_em?: string | null
          parcela?: number
          profissional_id?: string | null
          status?: Database["public"]["Enums"]["lancamento_status"]
          total_parcelas?: number
          unidade_id?: string | null
          valor?: number
          vencimento: string
        }
        Update: {
          clinica_id?: string
          conta_id?: string | null
          created_at?: string
          descricao?: string
          forma_pagamento?: string | null
          id?: string
          orcamento_id?: string | null
          paciente_id?: string | null
          pago_em?: string | null
          parcela?: number
          profissional_id?: string | null
          status?: Database["public"]["Enums"]["lancamento_status"]
          total_parcelas?: number
          unidade_id?: string | null
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_recebimentos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
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
      orcamento_itens: {
        Row: {
          clinica_id: string
          created_at: string
          dente: string | null
          descricao: string
          faces: string[] | null
          id: string
          orcamento_id: string
          procedimento_id: string | null
          quantidade: number
          valor_unitario: number
        }
        Insert: {
          clinica_id: string
          created_at?: string
          dente?: string | null
          descricao: string
          faces?: string[] | null
          id?: string
          orcamento_id: string
          procedimento_id?: string | null
          quantidade?: number
          valor_unitario?: number
        }
        Update: {
          clinica_id?: string
          created_at?: string
          dente?: string | null
          descricao?: string
          faces?: string[] | null
          id?: string
          orcamento_id?: string
          procedimento_id?: string | null
          quantidade?: number
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
          clinica_id: string
          created_at: string
          created_by: string | null
          desconto: number
          id: string
          observacoes: string | null
          paciente_id: string
          profissional_id: string | null
          status: Database["public"]["Enums"]["orcamento_status"]
          valor_total: number
          versao: number
        }
        Insert: {
          clinica_id: string
          created_at?: string
          created_by?: string | null
          desconto?: number
          id?: string
          observacoes?: string | null
          paciente_id: string
          profissional_id?: string | null
          status?: Database["public"]["Enums"]["orcamento_status"]
          valor_total?: number
          versao?: number
        }
        Update: {
          clinica_id?: string
          created_at?: string
          created_by?: string | null
          desconto?: number
          id?: string
          observacoes?: string | null
          paciente_id?: string
          profissional_id?: string | null
          status?: Database["public"]["Enums"]["orcamento_status"]
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
      pacientes: {
        Row: {
          anamnese: Json
          assinatura_base64: string | null
          ativo: boolean
          cep: string | null
          cidade: string | null
          clinica_id: string
          consentimento_data: string | null
          consentimento_lgpd: boolean
          convenio_id: string | null
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          elegibilidade_pendente: boolean
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          numero_carteirinha: string | null
          observacoes: string | null
          responsavel_cpf: string | null
          responsavel_nome: string | null
          responsavel_telefone: string | null
          sexo: string | null
          telefone: string | null
          unidade_id: string | null
        }
        Insert: {
          anamnese?: Json
          assinatura_base64?: string | null
          ativo?: boolean
          cep?: string | null
          cidade?: string | null
          clinica_id: string
          consentimento_data?: string | null
          consentimento_lgpd?: boolean
          convenio_id?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          elegibilidade_pendente?: boolean
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          numero_carteirinha?: string | null
          observacoes?: string | null
          responsavel_cpf?: string | null
          responsavel_nome?: string | null
          responsavel_telefone?: string | null
          sexo?: string | null
          telefone?: string | null
          unidade_id?: string | null
        }
        Update: {
          anamnese?: Json
          assinatura_base64?: string | null
          ativo?: boolean
          cep?: string | null
          cidade?: string | null
          clinica_id?: string
          consentimento_data?: string | null
          consentimento_lgpd?: boolean
          convenio_id?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          elegibilidade_pendente?: boolean
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          numero_carteirinha?: string | null
          observacoes?: string | null
          responsavel_cpf?: string | null
          responsavel_nome?: string | null
          responsavel_telefone?: string | null
          sexo?: string | null
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
            foreignKeyName: "pacientes_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      plano_contas: {
        Row: {
          centro_custo: string | null
          clinica_id: string
          created_at: string
          id: string
          nome: string
          tipo: Database["public"]["Enums"]["conta_tipo"]
        }
        Insert: {
          centro_custo?: string | null
          clinica_id: string
          created_at?: string
          id?: string
          nome: string
          tipo: Database["public"]["Enums"]["conta_tipo"]
        }
        Update: {
          centro_custo?: string | null
          clinica_id?: string
          created_at?: string
          id?: string
          nome?: string
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
        ]
      }
      procedimentos: {
        Row: {
          ativo: boolean
          categoria: string | null
          clinica_id: string
          codigo: string | null
          created_at: string
          duracao_minutos: number
          id: string
          nome: string
          valor: number
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          clinica_id: string
          codigo?: string | null
          created_at?: string
          duracao_minutos?: number
          id?: string
          nome: string
          valor?: number
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          clinica_id?: string
          codigo?: string | null
          created_at?: string
          duracao_minutos?: number
          id?: string
          nome?: string
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
      [_ in never]: never
    }
    Functions: {
      current_clinica_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      agendamento_status:
        | "agendado"
        | "confirmado"
        | "em_atendimento"
        | "atendido"
        | "faltou"
        | "cancelado"
      app_role: "owner" | "dentista" | "recepcao" | "financeiro"
      conta_tipo: "receita" | "despesa"
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
      app_role: ["owner", "dentista", "recepcao", "financeiro"],
      conta_tipo: ["receita", "despesa"],
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
