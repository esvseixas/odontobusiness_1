# Landing profissional e administração geral

## Objetivo
Transformar a página inicial em uma apresentação comercial completa do OdontoGestor e criar uma área segura para administrar clínicas assinantes, planos, testes, cobranças e suporte.

## Página inicial
- Aplicar a direção visual escolhida: azul clínico sofisticado, Sora nos títulos, Manrope nos textos e composição editorial executiva.
- Criar abertura forte com demonstração visual do produto e chamada para teste gratuito de 14 dias.
- Explicar ganhos por jornada: atração e agenda, atendimento e prontuário, aprovação de tratamentos, financeiro, estoque e gestão de rede.
- Destacar odontograma visual, histórico imutável, LGPD, permissões, auditoria, operação multiunidade e visão consolidada.
- Apresentar três planos sugeridos:
  - Solo: R$ 119,90/mês ou R$ 99,90/mês no anual.
  - Clínica: R$ 269,90/mês ou R$ 229,90/mês no anual.
  - Rede: a partir de R$ 499,90/mês por unidade.
- Deixar claro que os valores são uma proposta comercial inicial; não ativar cobrança automática.
- Garantir boa leitura e navegação em computador e celular.

## Administração geral
- Criar uma camada de acesso global separada dos papéis internos das clínicas.
- Cadastrar planos, assinaturas e histórico administrativo com regras de segurança próprias.
- Associar a conta administrativa geral existente ao novo acesso global.
- Criar painel com clientes ativos, testes, suspensos, receita mensal estimada e próximos vencimentos.
- Permitir pesquisar clínicas e consultar responsável, usuários, unidades, plano, teste e situação.
- Permitir alterar plano, valor, vencimento e situação; estender teste; suspender e reativar acesso com motivo.
- Incluir observações de suporte e trilha de auditoria administrativa.
- Não expor prontuários, pacientes, imagens ou outros dados clínicos ao administrador geral.

## Regras técnicas
- Usar migração incremental e manter intactas as regras atuais de isolamento entre clínicas.
- Executar alterações comerciais sensíveis por operações transacionais que validam o administrador geral no servidor.
- Impedir acesso de administradores comuns de clínica ao painel global.
- Redirecionar o administrador geral ao painel correto após entrar.
- Registrar a separação entre administração global e papéis por clínica nas regras de arquitetura.

## Validação
- Validar a landing em desktop e celular.
- Validar login e acesso da conta administrativa geral.
- Testar alteração de assinatura, suspensão e reativação com dados temporários, restaurando o estado ao final.
- Confirmar que um usuário comum não acessa a área global e que nenhum dado clínico aparece nela.