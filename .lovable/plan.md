# Configurações em submenus e estoque por lotes

## Objetivo
Transformar cada aba atual de **Configurações** em uma página própria acessível por submenus do menu principal e reorganizar o estoque para separar o cadastro do produto dos seus lotes, quantidades e validades.

## Navegação
- Manter **Configurações** como grupo recolhível no menu principal.
- Exibir dentro dele: Clínica, Unidades, Procedimentos, Convênios, Equipe, Plano de contas, Estoque e Auditoria.
- Criar uma página própria e um endereço específico para cada opção, com destaque da página ativa.
- Em telas menores, manter o grupo compacto e compatível com o menu móvel já existente.
- Ao acessar `/configuracoes`, direcionar para **Clínica**.

## Estoque
- Manter o cadastro de produto separado dos dados de entrada em estoque.
- Cadastro do produto: nome, unidade de medida, estoque mínimo e fornecedor.
- Criar lotes vinculados a cada produto, com número do lote, quantidade, validade e data de entrada.
- Preservar os produtos existentes e transformar a quantidade/validade atual em um lote inicial, sem perda de dados.
- Mostrar produtos em colunas: Produto, Unidade, Fornecedor, Estoque mínimo, Quantidade total, Próxima validade e Situação.
- Permitir expandir cada produto para visualizar seus lotes em colunas separadas.
- Incluir um fluxo para cadastrar novos lotes em produtos existentes.
- Destacar estoque abaixo do mínimo e lotes vencidos ou próximos do vencimento.

## Organização técnica
- Criar uma estrutura compartilhada para as páginas de configuração, evitando duplicação dos formulários atuais.
- Criar a tabela de lotes com isolamento por clínica, permissões equivalentes às do estoque atual e vínculos seguros com produto e unidade.
- Calcular a quantidade total do produto pela soma dos lotes; os campos antigos de quantidade e validade serão preservados, mas deixarão de ser usados pela tela.
- Registrar a decisão estrutural no guia técnico do projeto e atualizar o roteiro de tarefas.
- Adicionar título e descrição próprios para cada nova página.

## Validação
- Confirmar navegação e destaque dos submenus em computador e celular.
- Confirmar cadastro de produto, inclusão de lote e atualização das colunas de quantidade/validade.
- Confirmar que os dados da clínica DEMO continuam visíveis após a conversão.
- Verificar que a aplicação permanece sem erros.
