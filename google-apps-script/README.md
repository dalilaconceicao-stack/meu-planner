# Integração com Google Sheets

O `index.html` já está pronto para salvar e carregar **Projetos** e **PDI** automaticamente
de uma planilha Google, via um Google Apps Script publicado como Web App (usando JSONP).

Como você já tinha um script de outra planilha, basta republicar este `Code.gs` (que aponta
para a planilha nova) e trocar a URL no `index.html`.

## 1. Abrir o editor de Apps Script

1. Abra a planilha: https://docs.google.com/spreadsheets/d/1Z3tQZtCOP6rLAmqIefqAbLpQwmnqRemGSx_iPbiGIms
2. Menu **Extensões → Apps Script**.
3. Apague todo o conteúdo do arquivo `Código.gs` e cole o conteúdo de [`Code.gs`](./Code.gs).
4. Salve (ícone de disquete).

> O `SHEET_ID` já está fixo no script apontando para a sua planilha, então funciona
> mesmo se o script for um projeto separado.

## 2. Publicar como aplicativo da Web

1. Botão **Implantar → Nova implantação**.
2. Em "Selecionar tipo" (ícone de engrenagem), escolha **App da Web**.
3. Configure:
   - **Executar como:** Eu (sua conta)
   - **Quem pode acessar:** **Qualquer pessoa** (importante — sem isso o JSONP falha)
4. Clique em **Implantar** e autorize o acesso quando o Google pedir.
5. Copie a **URL do app da Web** (termina em `/exec`).

## 3. Trocar a URL no app

No arquivo `index.html`, atualize a constante `API_URL` (perto da linha 391) com a URL nova:

```js
const API_URL = "COLE_AQUI_A_NOVA_URL/exec";
```

Pronto. Os projetos e o PDI passam a ser gravados nas abas **Projetos** e **PDI** da planilha,
e são recarregados automaticamente ao abrir o app.

## Observações

- Se você editar o script depois, use **Implantar → Gerenciar implantações → Editar → Nova versão**
  para que as mudanças entrem no ar (a URL `/exec` continua a mesma).
- As abas `Projetos` e `PDI` são criadas automaticamente na primeira gravação.
- Anexos de projetos (`arquivos`) são salvos como JSON na coluna correspondente. Arquivos muito
  grandes (base64) podem estourar o limite de 50.000 caracteres por célula do Sheets.
