# Configuração do Firebase Authentication

Para que o login com Google funcione, você precisa seguir estes passos no [Console do Firebase](https://console.firebase.google.com/):

### 1. Criar um Projeto Firebase
- Se ainda não tiver um, crie um novo projeto.

### 2. Ativar o Authentication
- Vá em **Build > Authentication** no menu lateral.
- Clique em **Get Started**.
- Vá na aba **Sign-in method**.
- Clique em **Add new provider** e escolha **Google**.
- Ative o provider, escolha um e-mail de suporte e salve.

### 3. Registrar o App Web
- No Dashboard do projeto, clique no ícone de web (`</>`).
- Registre o app com um nome (ex: `gamification-ranking`).
- Você receberá um objeto `firebaseConfig`.

### 4. Configurar as Variáveis de Ambiente
- Crie um arquivo chamado `.env.local` na raiz do projeto.
- Copie os valores do `firebaseConfig` para as variáveis correspondentes:
  ```env
  NEXT_PUBLIC_FIREBASE_API_KEY=seu_api_key
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_auth_domain
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_project_id
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_storage_bucket
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
  NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
  ```

### 5. Ativar o Firestore Database
- Vá em **Build > Firestore Database**.
- Clique em **Create database**.
- Escolha o local do servidor e clique em **Next**.
- Comece em **Test mode** (ou Production mode se você souber configurar as Security Rules).
- **Importante:** Para conseguir acessar o sistema pela primeira vez, você precisa se autorizar manualmente:
    1. Crie uma coleção chamada `authorized_users`.
    2. Crie um documento onde o **Document ID** é o seu e-mail (ex: `seu-email@gmail.com`).
    3. Adicione os campos:
        - `email`: (string) `seu-email@gmail.com`
        - `role`: (string) `admin`
        - `added_at`: (string) ISO Date (ex: `2024-03-07T14:00:00Z`)

### 6. Configurar Domínios Autorizados
- No Authentication > Settings > Authorized domains, verifique se `localhost` e o domínio da sua futura hospedagem (ex: Vercel) estão na lista.

### Pronto!
O sistema agora valida se o usuário está na lista de autorizados e carrega as permissões de Administrador ou Usuário Comum automaticamente.
