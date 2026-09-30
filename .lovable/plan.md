# Pacientes como submenu dinâmico

## Objetivo
Organizar Pacientes como o menu de Configurações, mantendo a lista geral e exibindo as seções do prontuário apenas quando um paciente estiver aberto.

## Experiência no menu
- Transformar **Pacientes** em um grupo recolhível no menu principal.
- Manter **Lista de pacientes** como primeira opção e destino padrão de `/pacientes`.
- Ao abrir um paciente, mostrar abaixo da lista:
  - Odontograma
  - Orçamentos
  - Evolução clínica
  - Documentos
  - Histórico
  - Dados e anamnese
- Destacar a seção ativa e manter o grupo aberto enquanto o usuário estiver no prontuário.
- Em celular, fechar o painel principal após a escolha, sem ocultar o conteúdo.
- Preservar o botão existente para esconder e reabrir o menu principal.

## Páginas e navegação
- Cada seção do prontuário terá endereço próprio no formato `/pacientes/{paciente}/{secao}`.
- `/pacientes/{paciente}` direcionará para o Odontograma.
- Os breadcrumbs continuarão mostrando clínica, pacientes, nome do paciente e seção atual.
- Remover o segundo menu interno do prontuário para evitar navegação duplicada e liberar mais espaço para o conteúdo clínico.
- Preservar todos os formulários, ações, histórico imutável, resumo por IA e dados atuais.

## Detalhes técnicos
- Converter a rota atual do prontuário em layout compartilhado para carregar o paciente e renderizar as páginas filhas.
- Separar cada conteúdo hoje exibido em abas em uma rota filha, reutilizando uma camada compartilhada para consultas e ações.
- Usar links tipados do TanStack Router com parâmetros, sem interpolação manual.
- Adicionar título, descrição e metadados sociais próprios para cada seção.
- Manter a lista e o cadastro de pacientes inalterados.

## Validação
- Conferir lista, abertura do prontuário e navegação entre todas as seis seções.
- Testar destaque e recolhimento do submenu em computador e celular.
- Confirmar breadcrumbs, ausência de navegação duplicada, carregamento dos dados e ações principais.
- Verificar erros de compilação, execução e console antes da entrega.
