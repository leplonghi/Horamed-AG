import { supabase } from './src/integrations/supabase/client';

console.log('🔍 Testando conexão com Supabase...\n');

// Teste 1: Verificar configuração
console.log('📋 Configuração:');
console.log('  URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('  Project ID:', import.meta.env.VITE_SUPABASE_PROJECT_ID);
console.log('  Anon Key:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.substring(0, 20) + '...');

// Teste 2: Verificar conexão
async function testConnection() {
    try {
        console.log('\n🔌 Testando conexão com o banco...');
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Erro ao conectar:', error.message);
            return false;
        }

        console.log('✅ Conexão bem-sucedida!');
        return true;
    } catch (err) {
        console.error('❌ Erro inesperado:', err);
        return false;
    }
}

// Teste 3: Verificar autenticação
async function testAuth() {
    try {
        console.log('\n🔐 Testando autenticação...');
        const { data, error } = await supabase.auth.getSession();

        if (error) {
            console.error('❌ Erro ao verificar sessão:', error.message);
            return false;
        }

        if (data.session) {
            console.log('✅ Usuário autenticado:', data.session.user.email);
        } else {
            console.log('ℹ️  Nenhum usuário autenticado (normal se não fez login)');
        }

        return true;
    } catch (err) {
        console.error('❌ Erro inesperado:', err);
        return false;
    }
}

// Teste 4: Verificar storage
async function testStorage() {
    try {
        console.log('\n📦 Testando storage...');
        const { data, error } = await supabase.storage.listBuckets();

        if (error) {
            console.error('❌ Erro ao listar buckets:', error.message);
            return false;
        }

        console.log('✅ Buckets encontrados:', data.map(b => b.name).join(', '));
        return true;
    } catch (err) {
        console.error('❌ Erro inesperado:', err);
        return false;
    }
}

// Executar todos os testes
async function runAllTests() {
    console.log('\n' + '='.repeat(50));
    console.log('🧪 INICIANDO TESTES DE CONEXÃO');
    console.log('='.repeat(50));

    const results = {
        connection: await testConnection(),
        auth: await testAuth(),
        storage: await testStorage(),
    };

    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMO DOS TESTES');
    console.log('='.repeat(50));
    console.log('Conexão com banco:', results.connection ? '✅' : '❌');
    console.log('Autenticação:', results.auth ? '✅' : '❌');
    console.log('Storage:', results.storage ? '✅' : '❌');

    const allPassed = Object.values(results).every(r => r);

    if (allPassed) {
        console.log('\n🎉 Todos os testes passaram! Supabase está configurado corretamente.');
    } else {
        console.log('\n⚠️  Alguns testes falharam. Verifique o guia SUPABASE_CONNECTION_GUIDE.md');
    }

    console.log('='.repeat(50) + '\n');
}

// Executar
runAllTests().catch(console.error);
