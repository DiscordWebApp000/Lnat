'use client';

import { useState } from 'react';
import { User, Permission } from '@/types/user';
import { permissionService } from '@/lib/firebase-services';
import { 
  X, 
  Shield, 
  User as UserIcon, 
  Mail, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Key,
  Crown,
  Save,
  AlertCircle
} from 'lucide-react';

interface UserPermissionModalProps {
  user: User;
  permissions: Permission[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  currentAdminUid: string;
}

export default function UserPermissionModal({
  user,
  permissions,
  isOpen,
  onClose,
  onUpdate,
  currentAdminUid
}: UserPermissionModalProps) {
  const [localPermissions, setLocalPermissions] = useState<string[]>(user.permissions);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const togglePermission = (permissionId: string) => {
    setLocalPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(p => p !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const hasChanges = () => {
    const currentSet = new Set(user.permissions);
    const localSet = new Set(localPermissions);
    
    return currentSet.size !== localSet.size || 
           [...currentSet].some(p => !localSet.has(p));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      // Eski yetkileri kaldır
      for (const permission of user.permissions) {
        if (!localPermissions.includes(permission)) {
          await permissionService.revokePermission(user.uid, permission);
        }
      }

      // Yeni yetkileri ekle
      for (const permission of localPermissions) {
        if (!user.permissions.includes(permission)) {
          await permissionService.grantPermission(user.uid, permission, currentAdminUid);
        }
      }

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating permissions:', error);
      setError('Yetkiler güncellenirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <UserIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-red-100">Yetki Yönetimi</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* User Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Üye Olma</p>
                  <p className="font-medium">{formatDate(user.createdAt)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Son Giriş</p>
                  <p className="font-medium">{formatDate(user.lastLoginAt)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Rol</p>
                  <div className="flex items-center gap-2">
                    {user.role === 'admin' && <Crown className="w-4 h-4 text-red-600" />}
                    <p className="font-medium capitalize">{user.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Current vs New Permissions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Current Permissions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Key className="w-5 h-5 text-gray-600" />
                Mevcut Yetkiler
              </h3>
              <div className="space-y-2">
                {user.permissions.length === 0 ? (
                  <p className="text-gray-500 text-sm">Henüz yetki verilmemiş</p>
                ) : (
                  user.permissions.map(permissionId => {
                    const permission = permissions.find(p => p.id === permissionId);
                    return (
                      <div
                        key={permissionId}
                        className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg"
                      >
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          {permission?.name || permissionId}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* New Permissions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Key className="w-5 h-5 text-red-600" />
                Yeni Yetkiler
                {hasChanges() && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                    Değişiklik var
                  </span>
                )}
              </h3>
              <div className="space-y-2">
                {localPermissions.length === 0 ? (
                  <p className="text-gray-500 text-sm">Yetki seçilmemiş</p>
                ) : (
                  localPermissions.map(permissionId => {
                    const permission = permissions.find(p => p.id === permissionId);
                    return (
                      <div
                        key={permissionId}
                        className="flex items-center gap-2 p-2 bg-green-50 rounded-lg"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          {permission?.name || permissionId}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Permission Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Yetkiler</h3>
            {permissions.length === 0 ? (
              <div className="text-center py-8">
                <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Henüz yetki tanımlanmamış</p>
                <p className="text-sm text-gray-500">Sistemde tanımlı yetki bulunmuyor.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {permissions.map(permission => {
                  const isSelected = localPermissions.includes(permission.id);
                  return (
                    <div
                      key={permission.id}
                      onClick={() => togglePermission(permission.id)}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'border-green-500 bg-green-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isSelected ? 'bg-green-500' : 'bg-gray-200'
                          }`}>
                            {isSelected ? (
                              <CheckCircle className="w-5 h-5 text-white" />
                            ) : (
                              <XCircle className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <h4 className={`font-semibold ${
                              isSelected ? 'text-green-900' : 'text-gray-900'
                            }`}>
                              {permission.name}
                            </h4>
                            <p className={`text-sm ${
                              isSelected ? 'text-green-700' : 'text-gray-600'
                            }`}>
                              {permission.description}
                            </p>
                          </div>
                        </div>
                        <Key className={`w-5 h-5 ${
                          isSelected ? 'text-green-600' : 'text-gray-400'
                        }`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {hasChanges() && (
                <span className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="w-4 h-4" />
                  Kaydedilmemiş değişiklikler var
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges() || saving}
                className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Değişiklikleri Kaydet</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}