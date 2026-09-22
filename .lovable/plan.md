# Prontuário responsivo com resumo clínico por IA

## Objetivo
Aprimorar o prontuário sem retirar espaço do conteúdo principal em telas menores, facilitar a orientação entre clínica, paciente e seção, e permitir que profissionais gerem um resumo clínico objetivo a partir de anotações e dados já registrados.

## Implementação

### 1. Navegação do prontuário
- Manter as seções atuais: Odontograma, Orçamentos, Evolução clínica, Documentos, Histórico e Dados e anamnese.
- Em telas maiores, transformar o menu lateral em um painel estreito recolhível: aberto mostra ícone e nome; recolhido mantém apenas os ícones com dicas ao passar o cursor.
- Em telas menores, exibir um seletor compacto da seção atual acima do conteúdo, abrindo as opções sob demanda e fechando após a escolha.
- Controlar a seção ativa no próprio prontuário para sincronizar menu, conteúdo e breadcrumbs.

### 2. Breadcrumbs
- Exibir a trilha `Clínica / Pacientes / Paciente / Seção atual` acima do cabeçalho.
- Permitir retorno à lista de pacientes pelos itens navegáveis.
- Atualizar automaticamente o último item quando o profissional trocar de seção.
- Truncar nomes longos de forma acessível em telas pequenas.

### 3. Resumo clínico com Lovable AI
- Adicionar na seção Evolução clínica uma área de “Resumo do atendimento”.
- Permitir ao profissional escrever anotações específicas para o resumo e combinar, mediante ação explícita, informações relevantes do prontuário: anamnese, marcações ativas do odontograma, evoluções recentes e consulta relacionada.
- Enviar somente os dados do paciente e da clínica que o usuário autenticado pode acessar, validados novamente no servidor.
- Usar o modelo `openai/gpt-6-astra` via Lovable AI, com resposta em português, objetiva e sem criar diagnósticos ou informações ausentes.
- Mostrar processamento, erro real do serviço e resultado editável antes do registro.
- Registrar o resumo aprovado como uma nova evolução clínica imutável, identificado como resumo assistido por IA e com autoria do profissional; não alterar nem apagar registros anteriores.
- Incluir aviso de revisão profissional: o texto só entra no prontuário após confirmação humana.

### 4. Segurança e validação
- Proteger a geração no servidor com a sessão existente e regras de acesso da clínica.
- Validar paciente, clínica, tamanho das anotações e quantidade de contexto antes da chamada.
- Manter a chave do Lovable AI exclusivamente no servidor.
- Validar no navegador o fluxo autenticado completo em tela ampla e tela pequena: trocar seções, recolher menu, navegar pelos breadcrumbs, gerar, revisar e registrar o resumo.

## Detalhes técnicos
- Reutilizar os controles visuais, tokens e componentes existentes.
- Criar uma função de servidor autenticada para preparar o contexto e chamar a API Responses com streaming interno, raciocínio habilitado e histórico não persistido pelo provedor.
- Adicionar somente as dependências oficiais necessárias do AI SDK; nenhuma nova tabela é necessária, pois o resumo aprovado usa `evolucoes_clinicas` e sua política imutável existente.
