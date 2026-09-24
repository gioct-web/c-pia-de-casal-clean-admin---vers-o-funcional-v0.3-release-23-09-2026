# Project TODO

- [x] Inventariar a implementação anexada, incluindo rotas, dados, regras de cálculo, testes e arquitetura de persistência.
- [x] Comparar a implementação anexada com a referência visual fornecida e documentar os elementos que devem ser preservados.
- [x] Definir o modelo de dados para serviços, opções de serviço, configurações, perfis, orçamentos e itens de orçamento.
- [x] Implementar controle de acesso restrito com perfis administrativos e sessão persistente segura.
- [x] Implementar a estrutura administrativa com navegação para Dashboard, Cálculo, Serviços, Histórico e Configurações.
- [x] Reproduzir a identidade visual Casal Clean dos anexos, com responsividade para celular, tablet, desktop e telas amplas.
- [x] Implementar calculadora de orçamentos com seleção de serviços, parâmetros, subtotais e total geral atualizados em tempo real.
- [x] Exibir preços em reais em cada opção e somar especificações como lugares, tipo, tecido, lavagem, impermeabilização e nível de sujeira.
- [x] Implementar validações de dados do cliente, máscara brasileira de telefone, endereço e data/hora de atendimento.
- [x] Incluir fluxo seguro de agendamento, retorno, cancelamento/pular agendamento e valor padrão compatível com o histórico.
- [x] Criar catálogo administrativo para incluir, editar, ordenar e excluir serviços, especificações, descrições e preços sem alterar o código.
- [x] Criar histórico pesquisável de orçamentos, com identificador único, consulta pelo nome do cliente e reenvio do resumo por WhatsApp.
- [x] Gerar mensagem de WhatsApp com dados do cliente, número do orçamento, itens, especificações, valores unitários, agendamento e total.
- [x] Persistir serviços, configurações, perfis autorizados e histórico de orçamentos no banco de dados.
- [x] Aplicar migrações de banco de dados e validar o esquema sem operações destrutivas.
- [x] Implementar testes unitários para cálculo, validações, permissões, persistência e formatação da mensagem de WhatsApp.
- [x] Verificar navegação, atualização, recarregamento e preservação de dados transitórios durante o fluxo de orçamento.
- [x] Verificar visualmente o resultado em larguras de tela para celular e desktop, corrigindo diferenças relevantes em relação aos anexos.
- [x] Registrar limites de empacotamento Android e preparar a aplicação para uso em WebView sem alterar regras de negócio.
- [x] Revisar este arquivo, marcar as tarefas concluídas e salvar um checkpoint final do projeto.
- [x] Adicionar descrição e ordenação persistente às combinações do catálogo administrativo.
- [x] Cobrir em testes a gravação e consulta de configurações administrativas.
- [x] Adicionar configuração Capacitor e instruções de sincronização Android sem alterar regras de negócio.
- [x] Adicionar ação de reenvio do resumo persistido ao WhatsApp diretamente pelo histórico.
- [x] Documentar a validação do fluxo de orçamento e das telas principais em desktop e celular.
- [x] Analisar a planilha de especificações e preços reais recebida.
- [x] Mapear as linhas da planilha para as combinações persistidas do catálogo Casal Clean.
- [x] Importar os valores reais no catálogo, sem criar preços não presentes na planilha.
- [x] Validar que os produtos e valores reais estão disponíveis na calculadora.
- [x] Restringir a importação às combinações explicitamente precificadas na planilha e registrar a limitação por modalidade de serviço.
- [x] Aplicar o mesmo preço tabelado para lavagem e impermeabilização, conforme confirmação do cliente.
- [x] Remover a exibição de valores dos seletores de lugares, tipos e tecidos.

- [x] Aplicar validações contextuais e didáticas no login e formulário de dados do cliente.
- [x] Implementar máscara monetária brasileira nos campos de preços do catálogo.
- [x] Preservar regras de cálculo, navegação, identidade visual e responsividade após as melhorias.
- [x] Validar precisão numérica, testes, responsividade e compilação da atualização.

