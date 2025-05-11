
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
    login: (userData: User) => void; // Removed userPermissions from login signature
    logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

// Mock roles data (should ideally come from settings or API)
// This should be consistent with the roles defined in settings/page.tsx
const mockRoles: Role[] = [
  { id: "ROLE001", name: "مدير النظام", description: "صلاحيات كاملة على النظام.", permissions: ["accounting.view", "accounting.create", "accounting.edit", "accounting.delete", "accounting.approve", "sales.view", "sales.create", "sales.edit", "sales.delete", "sales.send_quote", "inventory.view", "inventory.create", "inventory.edit", "inventory.delete", "inventory.adjust_stock", "hr.view", "hr.create_employee", "hr.edit_employee", "hr.run_payroll", "reports.view_financial", "reports.view_sales", "reports.view_inventory", "reports.view_hr", "settings.view", "settings.edit_general", "settings.manage_users", "settings.manage_roles"] },
  { id: "ROLE002", name: "محاسب", description: "صلاحيات على وحدات الحسابات والمالية.", permissions: ["accounting.view", "accounting.create", "accounting.edit", "reports.view_financial"] },
  { id: "ROLE003", name: "موظف مبيعات", description: "صلاحيات على وحدة المبيعات وعروض الأسعار.", permissions: ["sales.view", "sales.create", "reports.view_sales"] },
  { id: "ROLE004", name: "مدير مخزون", description: "صلاحيات على وحدة المخزون والمستودعات.", permissions: ["inventory.view", "inventory.create", "inventory.edit", "reports.view_inventory"] },
];


const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
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
        }
    }, []);

    const login = (userData: User) => {
        const userRole = mockRoles.find(r => r.id === userData.roleId);
        const derivedPermissions = userRole ? userRole.permissions : [];
        
        setUser(userData);
        setPermissions(derivedPermissions);
        setIsAuthenticated(true);
        if (typeof window !== 'undefined') {
            localStorage.setItem("erpUser", JSON.stringify(userData));
        }
    };

    const logout = () => {
        setUser(null);
        setPermissions([]);
        setIsAuthenticated(false);
        if (typeof window !== 'undefined') {
            localStorage.removeItem("erpUser");
        }
    };

    const hasPermission = (permissionKey: string): boolean => {
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
