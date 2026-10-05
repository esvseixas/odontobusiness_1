# Roadmap

- [x] Adaptar o submenu do prontuário para telas menores com painel recolhível.
- [x] Adicionar breadcrumbs com clínica, paciente e seção atual.
- [x] Adicionar geração de resumo clínico objetivo via Lovable AI.
- [ ] Validar a geração e o registro do resumo após o administrador liberar o limite de IA do workspace.
- [x] Validar navegação, breadcrumbs e formulário do resumo em desktop e tela menor.
- [ ] Testar a geração e o registro do resumo clínico com IA.
- [x] Permitir esconder e reabrir o menu principal.
- [x] Exibir a anatomia de cada tipo de dente conforme a numeração FDI no odontograma.

- [x] Permitir instalar o app como atalho na tela inicial de dispositivos móveis (manifesto + ícones)
- [x] Transformar as abas de Configurações em submenus laterais com páginas próprias.
- [x] Separar o cadastro de produtos do controle de lotes, quantidades e validades no estoque.
- [x] Validar no navegador o cadastro de produto e a inclusão de lote, removendo os dados temporários ao final.
- [x] Transformar Pacientes em submenu dinâmico com páginas próprias para o prontuário.

## Fase 0 — Segurança e integridade
- [x] Papéis ampliados e has_role por clínica; UNIQUE (user_id, clinica_id, role).
- [x] Perfil não troca de clínica; papéis só por owner/admin; onboarding via criar_clinica.
- [x] Convites de equipe (Configurações → Equipe) e página /convite/$token.
- [x] RLS por papel; exclusões clínicas bloqueadas; auditoria por trigger.
- [x] aprovar_orcamento transacional; resumo por IA valida papel na clínica atual.
- [x] Menu e páginas filtrados por papel.
- [x] Cancelamento com motivo para orçamentos (cancela parcelas em aberto) e lançamentos a receber/pagar.

## Fase 1 — Núcleo clínico e agenda
- [x] 1. Pacientes: novos campos, busca pg_trgm, anamnese versionada com modelos, alertas, link público, edição de dados
- [x] 2. Arquivos e imagens: bucket privado, paciente_arquivos, assinaturas no Storage
- [x] 3. Especialidades, procedimentos ampliados, tabelas de preço
- [x] 4. Plano de tratamento (itens aprováveis, desconto R$/%, validade, etapas, aceite na tela/link, impressão/PDF)
- [x] 5. Periograma, ortodontia (contrato + mensalidades), implantes, laboratório (ordem → contas a pagar)
- [x] 6. Modelos de documentos com variáveis, impressão/PDF, envio WhatsApp/e-mail, campo ICP-Brasil reservado
- [x] 7a. Agenda: bloqueio de conflitos de profissional, paciente e cadeira; alertas clínicos na agenda
- [x] 7b. Agenda: dia/semana/mês, por profissional/sala, salas, expediente, bloqueios, encaixe, espera, recorrência, arrastar e soltar, confirmação por link/WhatsApp, agendamento online, atendido → evolução/cobrança
- [ ] 7c. Lembretes automáticos por e-mail 24h/2h (aguardando domínio de e-mail configurado)

## Fase 2 — Estoque integrado
- [x] 1. Fornecedores; itens com categoria, código de barras, conversão compra×consumo, custo médio, lote/validade, ANVISA; saldo pela soma dos lotes (views)
- [x] 2. Movimentações tipadas e imutáveis, sem saldo negativo, custo médio ponderado a cada entrada
- [x] 3. Ficha técnica por procedimento; baixa FEFO idempotente ao marcar "atendido"; lote obrigatório quando exigido, gravado no prontuário e vinculado ao implante
- [x] 4. Pedidos de compra; recebimento cria lotes + conta a pagar numa transação; sugestão automática (mínimo + consumo 90 dias + prazo)
- [x] 5. Inventário por lote com ajuste na finalização; transferência atômica entre unidades
- [x] 6. Alertas (mínimo, vencendo 30/60/90, vencidos com baixa) no painel e no estoque; relatórios com CSV
- [x] 7. Estoque como menu principal com 8 submenus

## Landing page e administração da plataforma
- [x] Redesenhar a landing page com apresentação profissional e benefícios detalhados.
- [x] Definir período de teste, planos e valores para clínica única e redes.
- [x] Criar área exclusiva do administrador geral para gerenciar clientes assinantes.
- [x] Validar isolamento, permissões e fluxos administrativos no navegador.
- [x] Confirmar o administrador geral e adicionar recuperação e redefinição segura de senha.

## Fase 3 — Financeiro e contábil simples
- [x] 1. Estrutura: contas financeiras, formas de pagamento, centros de custo e plano de contas hierárquico.
- [x] 2. Lançamentos: baixas parciais, parcelamento transacional, recorrência, competência e atualização automática de atrasados.
- [x] 3. Caixa diário: sessões, conferência, sangria e suprimento.
- [x] 4. Comissões e repasses: regras, apuração, aprovação e conta a pagar.
- [x] 5. Relatórios gerenciais: DRE, fluxo de caixa e indicadores por filtros.
- [x] 6. Conciliação, NFS-e plugável e exportação mensal para o contador.
- [x] 7. Interface financeira com submenus, permissões por papel e paginação no servidor.
- [ ] Validar isolamento, cálculos, vencimentos, permissões e responsividade; remover dados de teste.
