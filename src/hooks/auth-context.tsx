
// src/hooks/auth-context.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';

// Define a more specific user type if possible
interface User {
    id: string;
    name: string;
    role: string; // This would ideally be a Role ID linked to your roles definition
    // Add other user properties as needed
}

interface AuthContextProps {
    user: User | null;
    isAuthenticated: boolean;
    permissions: string[];
    hasPermission: (permissionKey: string) => boolean;
    login: (userData: User, userPermissions: string[]) => void; // Accept user data and permissions
    logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

// Mock roles and permissions for demonstration. In a real app, these would come from your backend.
const mockRolesData = {
    admin: ["accounting.view", "accounting.create", "sales.view", "sales.create", "inventory.view", "hr.view", "settings.view"],
    accountant: ["accounting.view", "accounting.create"],
    sales_rep: ["sales.view", "sales.create"],
};


const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // In a real app, you'd check for a stored token or session here
        // For now, let's simulate a logged-in user for testing
        const storedUser = localStorage.getItem("erpUser");
        const storedPermissions = localStorage.getItem("erpPermissions");
        if (storedUser && storedPermissions) {
            try {
                const parsedUser = JSON.parse(storedUser);
                const parsedPermissions = JSON.parse(storedPermissions);
                setUser(parsedUser);
                setPermissions(parsedPermissions);
                setIsAuthenticated(true);
            } catch (error) {
                console.error("Error parsing stored auth data:", error);
                localStorage.removeItem("erpUser");
                localStorage.removeItem("erpPermissions");
            }
        }
    }, []);

    const login = (userData: User, userPermissions: string[]) => {
        setUser(userData);
        setPermissions(userPermissions);
        setIsAuthenticated(true);
        localStorage.setItem("erpUser", JSON.stringify(userData));
        localStorage.setItem("erpPermissions", JSON.stringify(userPermissions));
    };

    const logout = () => {
        setUser(null);
        setPermissions([]);
        setIsAuthenticated(false);
        localStorage.removeItem("erpUser");
        localStorage.removeItem("erpPermissions");
        // Add logic to redirect to login page
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
