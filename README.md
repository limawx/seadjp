# Central de TI

Sistema para gerenciamento de inventário, drivers, códigos e arquivos de TI.

## Como usar (Versão Simplificada)

1. **Abra o arquivo `index.html` diretamente no seu navegador**
   - Ou use um servidor local simples como Live Server (VS Code)

2. **Faça login com as credenciais:**
   - **Usuário:** admin
   - **Senha:** admin123

## Funcionalidades

### Dashboard
- Visualização do inventário
- Lista de drivers organizados por categoria
- Códigos úteis para TI
- Lista de arquivos importantes

### Admin
- **Adicionar itens ao inventário**: Salva automaticamente no localStorage
- **Adicionar drivers**: Salva automaticamente no localStorage
- **Adicionar códigos**: Salva automaticamente no localStorage
- **Adicionar arquivos**: Salva automaticamente no localStorage
- **Gerar banco de dados**: Para exportar dados do localStorage para db.json

## Como funciona agora

✅ **SALVAMENTO AUTOMÁTICO**: Quando você adiciona um item, driver, código ou arquivo no painel admin, ele é salvo automaticamente no localStorage do navegador.

✅ **APARECE IMEDIATAMENTE**: Os itens adicionados aparecem instantaneamente no dashboard.

✅ **PERSISTÊNCIA**: Os dados ficam salvos mesmo se você fechar e abrir o navegador novamente.

## Estrutura dos arquivos

- `index.html` - Página de login
- `dashboard.html` - Dashboard principal
- `admin.html` - Painel administrativo
- `db.json` - Banco de dados (JSON) - usado como backup
- `auth.js` - Sistema de autenticação
- `dashboard.js` - Lógica do dashboard
- `admin.js` - Lógica do painel admin
- `style.css` - Estilos do sistema

## Fluxo de trabalho

1. **Adicionar itens**: Vá para o painel admin e adicione itens, drivers, códigos ou arquivos
2. **Visualizar**: Os itens aparecem automaticamente no dashboard
3. **Exportar (opcional)**: Use "Gerar Novo Banco de Dados" para criar um backup em db.json

## Tipos de dados que podem ser adicionados

### Inventário
- Nome do item
- Quantidade
- Caminho da imagem

### Drivers
- Nome do driver
- Categoria (ex: Rede, Impressora)
- Link para download

### Códigos
- Nome do código
- Categoria (ex: Rede, Windows)
- Conteúdo do código

### Arquivos
- Nome do arquivo
- Caminho do arquivo

## Notas importantes

- O sistema agora usa localStorage para salvar automaticamente
- Não é mais necessário clicar em "Gerar Novo Banco de Dados" manualmente
- Os dados são persistidos no navegador
- Para backup permanente, use a função "Gerar Novo Banco de Dados" e salve o conteúdo no arquivo db.json 