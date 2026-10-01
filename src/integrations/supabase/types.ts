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
      estoque_movimentacoes: {
        Row: {
          clinica_id: string
          created_at: string
          created_by: string | null
          id: string
          item_id: string
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
          cancelado_em: string | null
          cancelado_motivo: string | null
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
          cancelado_em?: string | null
          cancelado_motivo?: string | null
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
          cancelado_em?: string | null
          cancelado_motivo?: string | null
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
          cancelado_em: string | null
          cancelado_motivo: string | null
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
          cancelado_em?: string | null
          cancelado_motivo?: string | null
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
          cancelado_em?: string | null
          cancelado_motivo?: string | null
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
      [_ in never]: never
    }
    Functions: {
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
      calcular_alertas: {
        Args: { p_perguntas: Json; p_respostas: Json }
        Returns: string[]
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
      current_clinica_id: { Args: never; Returns: string }
      enviar_anamnese_link: {
        Args: { p_respostas: Json; p_token: string }
        Returns: undefined
      }
      gerar_link_aceite_orcamento: {
        Args: { p_orcamento: string }
        Returns: string
      }
      gerar_orcamento: {
        Args: { p_paciente: string; p_validade_dias?: number }
        Returns: string
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
      registrar_aceite_orcamento: {
        Args: {
          p_assinatura: string
          p_documento: string
          p_nome: string
          p_orcamento: string
        }
        Returns: undefined
      }
      semear_padroes_clinicos: {
        Args: { p_clinica: string }
        Returns: undefined
      }
      tem_papel: {
        Args: { _roles: Database["public"]["Enums"]["app_role"][] }
        Returns: boolean
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
