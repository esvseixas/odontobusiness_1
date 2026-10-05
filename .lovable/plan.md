# Acesso administrativo e recuperação de senha

## Resultado
- Confirmar que `esv.seixas@gmail.com` está ativo como administrador geral da plataforma, preservando seu perfil e vínculo com a clínica DEMO.
- Adicionar “Esqueci minha senha” na tela de entrada.
- Criar uma página pública para definir a nova senha após abrir o link recebido por e-mail.

## Fluxo
1. O usuário informa o e-mail e solicita a recuperação.
2. A plataforma envia um link seguro para esse endereço, sem revelar se há uma conta cadastrada.
3. O link abre a página de redefinição, que valida a recuperação e permite cadastrar e confirmar uma nova senha.
4. Após a alteração, o usuário retorna à tela de entrada.

## Validação
- Confirmar o vínculo administrativo geral no banco.
- Testar solicitação de recuperação, estados de erro/sucesso e abertura da página de nova senha.
- Verificar a tela em desktop e celular, além dos diagnósticos da aplicação.

## Detalhes técnicos
- Manter os perfis existentes e a separação entre administração da plataforma e dados clínicos.
- Usar o fluxo nativo de autenticação do Lovable Cloud, com redirecionamento público para `/reset-password`.
- Não alterar a senha administrativa durante a validação nem expor credenciais em registros ou mensagens.
