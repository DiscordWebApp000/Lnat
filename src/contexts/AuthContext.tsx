'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { User } from '@/types/user';
import { userService, permissionService } from '@/lib/firebase-services';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  permissions: string[];
  permissionsLoading: boolean;
  refreshUser: () => Promise<void>;
  hasPermission: (tool: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  const refreshUser = async () => {
    if (firebaseUser) {
      const userData = await userService.getUser(firebaseUser.uid);
      setCurrentUser(userData);
      
      // Yetkileri de yenile
      await loadPermissions(firebaseUser.uid);
    }
  };

  const loadPermissions = async (userId: string) => {
    try {
      setPermissionsLoading(true);
      const userPermissions = [];
      const tools = ['text-question-analysis', 'question-generator', 'writing-evaluator'];
      
      for (const tool of tools) {
        const hasPermission = await permissionService.checkUserPermission(userId, tool);
        if (hasPermission) {
          userPermissions.push(tool);
        }
      }
      
      setPermissions(userPermissions);
    } catch (error) {
      console.error('Error loading permissions:', error);
      setPermissions([]);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const hasPermission = (tool: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return permissions.includes(tool);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        try {
          const userData = await userService.getUser(user.uid);
          
          // Eğer Firestore'da kullanıcı bulunamazsa, login fonksiyonunu çağır
          // Bu durumda kullanıcı profili otomatik olarak oluşturulacak
          if (!userData) {
            console.log('User not found in Firestore, will be created on next login');
            setCurrentUser(null);
            setPermissions([]);
            setPermissionsLoading(false);
          } else {
            setCurrentUser(userData);
            // Yetkileri yükle
            await loadPermissions(user.uid);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setCurrentUser(null);
          setPermissions([]);
          setPermissionsLoading(false);
        }
      } else {
        setCurrentUser(null);
        setPermissions([]);
        setPermissionsLoading(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    firebaseUser,
    loading,
    permissions,
    permissionsLoading,
    refreshUser,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 