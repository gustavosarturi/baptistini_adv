import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Manual parsing of .env.local to avoid extra dependencies
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, "../.env.local");

if (!fs.existsSync(envPath)) {
    console.error("❌ Erro: Arquivo .env.local não encontrado.");
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf-8");
const config = {};
envContent.split("\n").forEach(line => {
    const [key, value] = line.split("=");
    if (key && value) config[key.trim()] = value.trim();
});

const firebaseConfig = {
    apiKey: config.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: config.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: config.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: config.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: config.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: config.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const email = process.argv[2];

if (!email) {
    console.error("❌ Erro: Por favor, forneça um e-mail.");
    console.log("Exemplo: node scripts/set-admin.mjs seu-email@gmail.com");
    process.exit(1);
}

if (!firebaseConfig.apiKey) {
    console.error("❌ Erro: Variáveis NEXT_PUBLIC_FIREBASE_* não encontradas no .env.local");
    process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setAdmin() {
    console.log(`⏳ Autorizando ${email} como administrador...`);
    try {
        await setDoc(doc(db, "authorized_users", email.toLowerCase().trim()), {
            email: email.toLowerCase().trim(),
            role: "admin",
            added_at: new Date().toISOString(),
            name: "Administrador Inicial"
        });
        console.log("✅ Sucesso! Agora você pode fazer login no app como admin.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Erro ao autorizar usuário:", error);
        process.exit(1);
    }
}

setAdmin();
