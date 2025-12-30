
// src/hooks/auth-context.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import type { Role } from '@/types/saas'; // Import Role type

// Define a more specific user type if possible
export interface User {
    id: string;
    name: string;
    roleId: string;
    email: string;
    avatarUrl: string | null;
    tenantId?: string; // Add tenantId to user object
}

interface AuthContextProps {
    user: User | null;
    isAuthenticated: boolean;
    permissions: string[];
    isLoading: boolean;
    isSuperAdmin: boolean;
    hasPermission: (permissionKey: string) => boolean;
    login: (userData: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

// This should come from a central API in a real app
// We now define a Super Admin role as well
const mockRoles: Role[] = [
  { id: "ROLE_SUPER_ADMIN", name: "Super Admin", description: "صلاحيات كاملة على النظام وإدارة الشركات.", permissions: ["admin.manage_tenants", "admin.manage_modules", "admin.manage_billing", "admin.manage_requests"] },
  { id: "ROLE001", name: "مدير النظام", description: "صلاحيات كاملة على النظام.", permissions: ["accounting.view", "accounting.create", "accounting.edit", "accounting.delete", "accounting.approve", "sales.view", "sales.create", "sales.edit", "sales.delete", "sales.send_quote", "inventory.view", "inventory.create", "inventory.edit", "inventory.delete", "inventory.adjust_stock", "hr.view", "hr.create_employee", "hr.edit_employee", "hr.run_payroll", "reports.view_financial", "reports.view_sales", "reports.view_inventory", "reports.view_hr", "settings.view", "settings.edit_general", "settings.manage_users", "settings.manage_roles", "projects.view", "projects.create", "projects.edit", "projects.delete", "production.view", "production.create", "production.edit", "production.delete", "pos.use"] },
  { id: "ROLE002", name: "محاسب", description: "صلاحيات على وحدات الحسابات والمالية.", permissions: ["accounting.view", "accounting.create", "accounting.edit", "reports.view_financial"] },
  { id: "ROLE003", name: "موظف مبيعات", description: "صلاحيات على وحدة المبيعات وعروض الأسعار.", permissions: ["sales.view", "sales.create", "reports.view_sales"] },
  { id: "ROLE004", name: "مدير مخزون", description: "صلاحيات على وحدة المخزون والمستودعات.", permissions: ["inventory.view", "inventory.create", "inventory.edit", "reports.view_inventory", "inventory.adjust_stock"] },
];


const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const storedUser = localStorage.getItem("erpUser");
                if (storedUser) {
                    const parsedUser: User = JSON.parse(storedUser);
                    const userRole = mockRoles.find(r => r.id === parsedUser.roleId);
                    const userPermissions = userRole ? userRole.permissions : [];
                    
                    setUser(parsedUser);
                    setPermissions(userPermissions);
                    setIsAuthenticated(true);
                    setIsSuperAdmin(parsedUser.roleId === 'ROLE_SUPER_ADMIN');
                }
            } catch (error) {
                console.error("Error parsing stored auth data:", error);
                localStorage.removeItem("erpUser");
            } finally {
                setIsLoading(false);
            }
        }
    }, []);

    const login = (userData: User) => {
        const userRole = mockRoles.find(r => r.id === userData.roleId);
        const derivedPermissions = userRole ? userRole.permissions : [];
        
        setUser(userData);
        setPermissions(derivedPermissions);
        setIsAuthenticated(true);
        setIsSuperAdmin(userData.roleId === 'ROLE_SUPER_ADMIN');
        if (typeof window !== 'undefined') {
            localStorage.setItem("erpUser", JSON.stringify(userData));
        }
    };

    const logout = () => {
        setUser(null);
        setPermissions([]);
        setIsAuthenticated(false);
        setIsSuperAdmin(false);
        if (typeof window !== 'undefined') {
            localStorage.removeItem("erpUser");
            window.location.href = '/login';
        }
    };

    const hasPermission = (permissionKey: string): boolean => {
        if (isSuperAdmin) return true; // Super Admin has all permissions implicitly
        if(user?.roleId === "ROLE001") return true; // Tenant Admin also has all permissions for their tenant
        return permissions.includes(permissionKey);
    };

    if (isLoading) {
        return null; 
    }

    const value: AuthContextProps = {
        user,
        isAuthenticated,
        permissions,
        isLoading,
        isSuperAdmin,
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
