'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {  examService } from '@/lib/firebase-services';
import Navbar from '@/components/Navbar';
import ProfileEditModal from '@/components/ProfileEditModal';
import { ExamResult } from '@/types/user';
import { 
  BookOpen, 
  FileText, 
  PenTool, 
  BarChart3, 
  User, 
  Settings, 
  Clock, 
  CheckCircle, 
  Calendar,
  Shield,
  Lock,
  TrendingUp,
  RefreshCw,
  Trash2,
  Eye
} from 'lucide-react';

export default function DashboardPage() {
  const { currentUser, loading, hasPermission, permissions, permissionsLoading } = useAuth();
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const router = useRouter();

  const loadUserData = useCallback(async () => {
    if (!currentUser) {
      console.log('❌ No current user, skipping loadUserData');
      return;
    }

    console.log('🔄 Loading exam results for user:', currentUser.uid);
    setLoadingResults(true);
    
    try {
      // Sınav sonuçlarını yükle
      const results = await examService.getUserExamResults(currentUser.uid);
      console.log('✅ Loaded exam results:', results);
      console.log('📊 Results count:', results.length);
      
      if (results.length === 0) {
        console.log('⚠️ No exam results found for user');
      } else {
        results.forEach((result, index) => {
          console.log(`  ${index + 1}. ${result.examType} - Score: ${result.score}% - Date: ${result.examDate}`);
        });
      }
      
      setExamResults(results);
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoadingResults(false);
      console.log('🏁 loadUserData completed');
    }
  }, [currentUser]);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [loading, currentUser, router]);

  useEffect(() => {
    if (currentUser) {
      console.log('🚀 Dashboard useEffect triggered - loading user data');
      loadUserData();
    }
  }, [currentUser, loadUserData]);

  // Dashboard'a her geldiğinde sonuçları yenile
  useEffect(() => {
    const handleFocus = () => {
      if (currentUser && !loading) {
        console.log('🔄 Window focused - refreshing exam results');
        loadUserData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [currentUser, loading, loadUserData]);



  const handleDeleteExam = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam result?')) {
      return;
    }

    try {
      await examService.deleteExamResult(examId);
      console.log('✅ Exam result deleted:', examId);
      // Sonuçları yeniden yükle
      loadUserData();
    } catch (error) {
      console.error('❌ Error deleting exam result:', error);
      alert('An error occurred while deleting the exam result.');
    }
  };

  const handleProfileUpdate = (updatedUser: typeof currentUser) => {
    // Update the current user in the context
    // This will trigger a re-render with the updated user data
    console.log('Profile updated:', updatedUser);
  };

  const getToolInfo = (tool: string) => {
    switch (tool) {
      case 'text-question-analysis':
        return {
          name: 'Text-Question Analysis',
          description: 'Text analysis and question generation',
          icon: FileText,
          color: 'bg-blue-500',
          href: '/text-question-analysis'
        };
      case 'question-generator':
        return {
          name: 'Question Generator',
          description: 'Question generation and test creation',
          icon: BookOpen,
          color: 'bg-green-500',
          href: '/question-generator'
        };
      case 'writing-evaluator':
        return {
          name: 'Writing Evaluator',
          description: 'Writing evaluation and analysis',
          icon: PenTool,
          color: 'bg-purple-500',
          href: '/writing-evaluator'
        };
      default:
        return {
          name: 'Unknown Tool',
          description: 'Unknown tool',
          icon: BookOpen,
          color: 'bg-gray-500',
          href: '#'
        };
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
       

        {/* User Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  Welcome, {currentUser.firstName}!
                </h2>
                <p className="text-blue-100 mb-2">{currentUser.email}</p>
                <div className="flex items-center gap-6 text-sm text-blue-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Member since: {formatDate(currentUser.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Last login: {formatDate(currentUser.lastLoginAt)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {currentUser.role === 'admin' && (
                <>
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <Shield className="w-5 h-5" />
                    <span className="font-semibold">Admin Panel</span>
                  </Link>
                </>
              )}
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-200 shadow-lg"
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Profile Settings</span>
              </button>
            </div>
          </div>
        </div>

       

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Exams</p>
                <p className="text-2xl font-bold text-gray-900">{examResults.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {examResults.length > 0 
                    ? Math.round(examResults.reduce((acc, result) => acc + result.score, 0) / examResults.length)
                    : 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Tools</p>
                <p className="text-2xl font-bold text-gray-900">{permissions.length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Lock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Account Status</p>
                <p className="text-sm font-semibold text-green-600 mt-1">Active</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tools Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Tools</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['text-question-analysis', 'question-generator', 'writing-evaluator'].map((tool) => {
              const toolInfo = getToolInfo(tool);
              const userHasPermission = hasPermission(tool);
              const Icon = toolInfo.icon;

              return (
                <div
                  key={tool}
                  className={`bg-white rounded-xl shadow-lg p-6 border-2 transition-all ${
                    userHasPermission 
                      ? 'border-transparent hover:shadow-xl cursor-pointer' 
                      : 'border-gray-200 opacity-60 cursor-not-allowed'
                  }`}
                  onClick={() => userHasPermission && router.push(toolInfo.href)}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 ${toolInfo.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{toolInfo.name}</h4>
                      <p className="text-sm text-gray-600">{toolInfo.description}</p>
                    </div>
                  </div>
                  
                  {userHasPermission ? (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>Permission granted</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Lock className="w-4 h-4" />
                      <span>Permission required</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>



        {/* Recent Exam Results */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Recent Exam Results</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  console.log('🔄 Manual refresh triggered');
                  loadUserData();
                }}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <Link
                href="/exam-results"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                View All →
              </Link>
            </div>
          </div>

          {loadingResults ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading exam results...</p>
            </div>
          ) : examResults.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No exam results found yet.</p>
              <p className="text-sm text-gray-500 mt-2">Start taking exams using the tools!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {examResults.slice(0, 5).map((result) => (
                <div key={result.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {getToolInfo(result.examType).name}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(result.examDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(result.totalTime)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{result.score}%</div>
                        <div className="text-sm text-gray-500">
                          {result.correctAnswers}/{result.totalQuestions} correct
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => router.push(`/exam-results?id=${result.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExam(result.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Profile Edit Modal */}
      {currentUser && (
        <ProfileEditModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={currentUser}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
} 