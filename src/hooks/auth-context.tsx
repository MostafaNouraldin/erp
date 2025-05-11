
// src/hooks/auth-context.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import type { Role } from '@/types/saas'; // Import Role type

// Define a more specific user type if possible
interface User {
    id: string;
    name: string;
    roleId: string; // Changed from role to roleId
    // Add other user properties as needed
}

interface AuthContextProps {
    user: User | null;
    isAuthenticated: boolean;
    permissions: string[];
    hasPermission: (permissionKey: string) => boolean;
    login: (userData: User, userPermissions: string[]) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

// Mock roles data (should ideally come from settings or API)
const mockRoles: Role[] = [
    { id: "ROLE001", name: "مدير النظام", description: "صلاحيات كاملة", permissions: ["accounting.view", "sales.create", "inventory.edit", "hr.delete", "settings.manage_users"] },
    { id: "ROLE002", name: "محاسب", description: "صلاحيات محاسبة", permissions: ["accounting.view", "accounting.create"] },
    // Add other roles as needed
];


const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem("erpUser");
        if (storedUser) {
            try {
                const parsedUser: User = JSON.parse(storedUser);
                const userRole = mockRoles.find(r => r.id === parsedUser.roleId);
                const userPermissions = userRole ? userRole.permissions : [];
                
                setUser(parsedUser);
                setPermissions(userPermissions);
                setIsAuthenticated(true);
            } catch (error) {
                console.error("Error parsing stored auth data:", error);
                localStorage.removeItem("erpUser");
            }
        }
    }, []);

    const login = (userData: User, userPermissionsFromLogin?: string[]) => { // userPermissionsFromLogin is optional
        const userRole = mockRoles.find(r => r.id === userData.roleId);
        const derivedPermissions = userRole ? userRole.permissions : [];
        
        // Prefer permissions passed directly during login, otherwise use derived permissions
        const finalPermissions = userPermissionsFromLogin || derivedPermissions;

        setUser(userData);
        setPermissions(finalPermissions);
        setIsAuthenticated(true);
        localStorage.setItem("erpUser", JSON.stringify(userData));
        // localStorage.setItem("erpPermissions", JSON.stringify(finalPermissions)); // Not needed if deriving from roleId
    };

    const logout = () => {
        setUser(null);
        setPermissions([]);
        setIsAuthenticated(false);
        localStorage.removeItem("erpUser");
        // localStorage.removeItem("erpPermissions");
    };

    const hasPermission = (permissionKey: string): boolean => {
        // In a real app, permissions might be an array of strings like 'module.action'
        return permissions.includes(permissionKey);
    };

    const value: AuthContextProps = {
        user,
        isAuthenticated,
        permissions,
        hasPermission,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext, AuthProvider };
