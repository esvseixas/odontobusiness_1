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
- [ ] Telas de cancelamento com motivo para orçamentos e lançamentos (colunas já criadas).

## Fase 1 — Núcleo clínico e agenda
- [x] 1. Pacientes: novos campos, busca pg_trgm, anamnese versionada com modelos, alertas, link público, edição de dados
- [x] 2. Arquivos e imagens: bucket privado, paciente_arquivos, assinaturas no Storage
- [x] 3. Especialidades, procedimentos ampliados, tabelas de preço
- [x] 4. Plano de tratamento (itens aprováveis, desconto R$/%, validade, etapas, aceite na tela/link, impressão/PDF)
- [ ] 5. Periograma, ortodontia, implantes, laboratório
- [ ] 6. Modelos de documentos e PDF
- [x] 7a. Agenda: bloqueio de conflitos de profissional, paciente e cadeira; alertas clínicos na agenda
- [ ] 7b. Agenda (salas, expediente, bloqueios, conflitos, encaixe, espera, recorrência, lembretes, agendamento online)
