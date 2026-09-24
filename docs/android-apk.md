# Preparação Android

Esta aplicação está preparada para sincronização com o Capacitor, sem reescrever o fluxo web, a calculadora, o banco de dados ou a autenticação. Os elementos interativos atendem ao uso por toque, o documento HTML contém viewport para WebView e o redirecionamento para WhatsApp identifica a execução dentro de WebView Android.

Para atualizar o projeto Android em uma estação com Android Studio e SDK instalados, execute `pnpm build` e depois `pnpm cap sync android`. A abertura e assinatura do APK devem ocorrer em uma máquina de desenvolvimento Android, através de `pnpm cap open android` ou do Android Studio. A configuração utiliza `dist/public` como diretório web e o identificador `com.casalclean.orcamentos`.

Caso a aplicação deva carregar o ambiente hospedado em vez dos arquivos locais, defina `CAPACITOR_SERVER_URL` com uma URL HTTPS válida antes da sincronização. Essa configuração não é exigida para a versão empacotada com os arquivos estáticos.
