import { db } from "@/integrations/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface AdminRole {
    email: string;
    role: 'super_admin' | 'admin' | 'moderator';
    permissions: {
        campaignGenerator: boolean;
        userManagement: boolean;
        analytics: boolean;
        contentModeration: boolean;
    };
    createdAt: string;
}

export const AdminService = {

    async isAdmin(userId: string): Promise<boolean> {
        try {
            const adminRef = doc(db, "admins", userId);
            const adminDoc = await getDoc(adminRef);
            return adminDoc.exists();
        } catch (error) {
            console.error("Error checking admin status:", error);
            return false;
        }
    },

    async getAdminRole(userId: string): Promise<AdminRole | null> {
        try {
            const adminRef = doc(db, "admins", userId);
            const adminDoc = await getDoc(adminRef);

            if (!adminDoc.exists()) return null;

            return adminDoc.data() as AdminRole;
        } catch (error) {
            console.error("Error getting admin role:", error);
            return null;
        }
    },

    async createSuperAdmin(userId: string, email: string): Promise<void> {
        const adminData: AdminRole = {
            email,
            role: 'super_admin',
            permissions: {
                campaignGenerator: true,
                userManagement: true,
                analytics: true,
                contentModeration: true
            },
            createdAt: new Date().toISOString()
        };

        const adminRef = doc(db, "admins", userId);
        await setDoc(adminRef, adminData);
    }
};
