'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/firebase-services';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        await authService.login(email, password);
        setSuccess('Giriş başarılı! Yönlendiriliyorsunuz...');
        setTimeout(() => router.push('/dashboard'), 1000);
      } else {
        await authService.register(email, password, firstName, lastName);
        setSuccess('Kayıt başarılı! Giriş yapabilirsiniz.');
        setIsLogin(true);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Firebase hata mesajlarını Türkçe'ye çevir
        let errorMessage = error.message;
        if (errorMessage.includes('auth/email-already-in-use')) {
          errorMessage = 'Bu email adresi zaten kullanımda. Giriş yapmayı deneyin.';
        } else if (errorMessage.includes('auth/weak-password')) {
          errorMessage = 'Şifre çok zayıf. En az 6 karakter olmalı.';
        } else if (errorMessage.includes('auth/invalid-email')) {
          errorMessage = 'Geçersiz email adresi.';
        } else if (errorMessage.includes('auth/user-not-found')) {
          errorMessage = 'Bu email ile kayıtlı kullanıcı bulunamadı.';
        } else if (errorMessage.includes('auth/wrong-password')) {
          errorMessage = 'Yanlış şifre.';
        } else if (errorMessage.includes('auth/too-many-requests')) {
          errorMessage = 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.';
        }
        setError(errorMessage);
      } else {
        setError('Bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Şifre sıfırlama için email adresinizi girin');
      return;
    }

    try {
      await authService.resetPassword(email);
      setSuccess('Şifre sıfırlama emaili gönderildi!');
    } catch (error: unknown) {
      if (error instanceof Error) {
        let errorMessage = error.message;
        if (errorMessage.includes('auth/user-not-found')) {
          errorMessage = 'Bu email ile kayıtlı kullanıcı bulunamadı.';
        } else if (errorMessage.includes('auth/invalid-email')) {
          errorMessage = 'Geçersiz email adresi.';
        }
        setError(errorMessage);
      } else {
        setError('Şifre sıfırlama hatası');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
          </h1>
          <p className="text-gray-600">
            {isLogin ? 'Hesabınıza giriş yapın' : 'Yeni hesap oluşturun'}
          </p>
        </div>

       

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ad
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
                        placeholder="Adınız"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Soyad
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
                        placeholder="Soyadınız"
                        required
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
                  placeholder="ornek@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  Şifremi unuttum
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{error}</p>
                {error.includes('zaten kullanımda') && (
                  <p className="text-red-600 text-xs mt-2">
                    💡 Bu email ile giriş yapmayı deneyin veya farklı bir email kullanın.
                  </p>
                )}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            )}
            
           

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isLogin ? 'Giriş yapılıyor...' : 'Kayıt olunuyor...'}
                </div>
              ) : (
                isLogin ? 'Giriş Yap' : 'Kayıt Ol'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isLogin ? 'Hesabınız yok mu?' : 'Zaten hesabınız var mı?'}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setSuccess('');
                }}
                className="ml-1 text-green-600 hover:text-green-700 font-medium"
              >
                {isLogin ? 'Kayıt olun' : 'Giriş yapın'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 