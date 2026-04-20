# Mobile

Base Flutter criada para consumir a API existente do projeto.

## Estrutura

- `lib/models`: modelos da aplicacao
- `lib/services`: acesso a API e persistencia local
- `lib/screens`: telas do app

## Observacao importante

O ambiente atual nao possui o SDK do Flutter instalado, entao a estrutura nativa (`android`, `ios`, `web`, etc.) nao foi gerada automaticamente aqui.

Assim que o Flutter estiver instalado na sua maquina, entre nesta pasta e rode:

```bash
flutter create .
flutter pub get
```

Esse comando gera as pastas nativas preservando o codigo ja criado em `lib/`.

## Base URL da API

Por padrao, o app usa:

```text
http://10.0.2.2:3333
```

Isso funciona no emulador Android.

Se quiser sobrescrever a URL ao rodar, use:

```bash
flutter run --dart-define=API_BASE_URL=http://SEU_IP:3333
```

