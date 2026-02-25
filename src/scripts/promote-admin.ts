/**
 * Script para adicionar leplonghi@gmail.com como Super Admin
 * 
 * COMO USAR:
 * 1. Faça login no app com leplonghi@gmail.com
 * 2. Abra o Console do navegador (F12)
 * 3. Cole este código e pressione Enter
 * 4. Você será promovido a Super Admin
 */

import { getAuth } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './integrations/firebase/client';

async function promoteToSuperAdmin() {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        console.error('❌ Você precisa estar logado primeiro!');
        return;
    }

    if (user.email !== 'leplonghi@gmail.com') {
        console.error('❌ Este script só funciona para leplonghi@gmail.com');
        return;
    }

    const adminData = {
        email: user.email,
        role: 'super_admin',
        permissions: {
            campaignGenerator: true,
            userManagement: true,
            analytics: true,
            contentModeration: true
        },
        createdAt: new Date().toISOString()
    };

    try {
        const adminRef = doc(db, "admins", user.uid);
        await setDoc(adminRef, adminData);
        console.log('✅ Super Admin criado com sucesso!');
        console.log('🔄 Recarregue a página para ver as mudanças.');
    } catch (error) {
        console.error('❌ Erro ao criar Super Admin:', error);
    }
}

// Execute automaticamente
promoteToSuperAdmin();
