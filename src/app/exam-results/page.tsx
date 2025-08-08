'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { examService } from '@/lib/firebase-services';
import Navbar from '@/components/Navbar';
import { ExamResult } from '@/types/user';
import { 
  BarChart3, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileText,
  BookOpen,
  PenTool,
  Eye,
  Trash2,
  X
} from 'lucide-react';

function ExamResultsContent() {
  const { currentUser, loading } = useAuth();
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultId = searchParams.get('id');

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [loading, currentUser, router]);

  const loadExamResults = useCallback(async () => {
    if (!currentUser) return;

    setLoadingResults(true);
    try {
      const results = await examService.getUserExamResults(currentUser.uid);
      setExamResults(results);
    } catch (error) {
      console.error('Error loading exam results:', error);
    } finally {
      setLoadingResults(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadExamResults();
    }
  }, [currentUser, loadExamResults]);

  useEffect(() => {
    // URL'de ID varsa modal açık
    if (resultId && examResults.length > 0) {
      const result = examResults.find(r => r.id === resultId);
      if (result) {
        setSelectedResult(result);
        setIsModalOpen(true);
      }
    }
  }, [resultId, examResults]);

  const handleDeleteExam = async (examId: string) => {
    if (!confirm('Bu sınav sonucunu silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await examService.deleteExamResult(examId);
      loadExamResults();
      
      // Eğer silinen sonuç modal'da açıksa modal'ı kapat
      if (selectedResult?.id === examId) {
        closeModal();
      }
    } catch (error) {
      console.error('Error deleting exam result:', error);
      alert('Sınav sonucu silinirken bir hata oluştu.');
    }
  };

  const openModal = (result: ExamResult) => {
    setSelectedResult(result);
    setIsModalOpen(true);
    // URL'yi güncelle
    router.push(`/exam-results?id=${result.id}`, { scroll: false });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedResult(null);
    // URL'den ID'yi kaldır
    router.push('/exam-results', { scroll: false });
  };

  const getToolInfo = (tool: string) => {
    switch (tool) {
      case 'text-question-analysis':
        return {
          name: 'Text-Question Analysis',
          description: 'Metin analizi ve soru üretimi',
          icon: FileText,
          color: 'bg-blue-500'
        };
      case 'question-generator':
        return {
          name: 'Question Generator',
          description: 'Soru üretimi ve test oluşturma',
          icon: BookOpen,
          color: 'bg-green-500'
        };
      case 'writing-evaluator':
        return {
          name: 'Writing Evaluator',
          description: 'Yazı değerlendirme ve analiz',
          icon: PenTool,
          color: 'bg-purple-500'
        };
      default:
        return {
          name: 'Unknown Tool',
          description: 'Bilinmeyen araç',
          icon: BookOpen,
          color: 'bg-gray-500'
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
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
      <Navbar 
        title="Exam Results"
        description="Your complete exam history"
        showBackButton={true}
        backUrl="/dashboard"
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Toplam Sınav</p>
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
                <p className="text-gray-600 text-sm font-medium">Ortalama Puan</p>
                <p className="text-2xl font-bold text-gray-900">
                  {examResults.length > 0 
                    ? Math.round(examResults.reduce((acc, result) => acc + result.score, 0) / examResults.length)
                    : 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">En Yüksek Puan</p>
                <p className="text-2xl font-bold text-gray-900">
                  {examResults.length > 0 
                    ? Math.max(...examResults.map(r => r.score))
                    : 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Tüm Sınav Sonuçları</h3>

          {loadingResults ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Sınav sonuçları yükleniyor...</p>
            </div>
          ) : examResults.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Henüz sınav sonucunuz bulunmuyor.</p>
              <p className="text-sm text-gray-500 mt-2">Araçları kullanarak sınav yapmaya başlayın!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {examResults.map((result) => {
                const toolInfo = getToolInfo(result.examType);
                const Icon = toolInfo.icon;
                
                return (
                  <div key={result.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${toolInfo.color} rounded-lg flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{toolInfo.name}</h4>
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
                          <div className={`text-2xl font-bold ${getScoreColor(result.score)}`}>
                            {result.score}%
                          </div>
                          <div className="text-sm text-gray-500">
                            {result.correctAnswers}/{result.totalQuestions} doğru
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => openModal(result)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Detayları Gör"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteExam(result.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {isModalOpen && selectedResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${getToolInfo(selectedResult.examType).color} rounded-lg flex items-center justify-center`}>
                  {React.createElement(getToolInfo(selectedResult.examType).icon, { className: "w-5 h-5 text-white" })}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {getToolInfo(selectedResult.examType).name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {formatDate(selectedResult.examDate)}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Score Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className={`text-2xl font-bold ${getScoreColor(selectedResult.score)}`}>
                    {selectedResult.score}%
                  </div>
                  <div className="text-sm text-gray-600">Toplam Puan</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedResult.correctAnswers}
                  </div>
                  <div className="text-sm text-gray-600">Doğru</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {selectedResult.wrongAnswers}
                  </div>
                  <div className="text-sm text-gray-600">Yanlış</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">
                    {selectedResult.unansweredQuestions}
                  </div>
                  <div className="text-sm text-gray-600">Boş</div>
                </div>
              </div>

              {/* Time Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Toplam Süre</span>
                  </div>
                  <div className="text-xl font-bold text-purple-600">
                    {formatTime(selectedResult.totalTime)}
                  </div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-900">Ortalama Süre</span>
                  </div>
                  <div className="text-xl font-bold text-orange-600">
                    {formatTime(selectedResult.averageTime)}
                  </div>
                </div>
              </div>

              {/* Answers Preview */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cevap Özeti</h3>
                <div className="space-y-2">
                  {Object.entries(selectedResult.answers).slice(0, 5).map(([questionId, answer]) => (
                    <div key={questionId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-900">
                        Soru {questionId}
                      </span>
                      <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                        {answer || 'Boş'}
                      </span>
                    </div>
                  ))}
                  {Object.keys(selectedResult.answers).length > 5 && (
                    <div className="text-center text-sm text-gray-500 pt-2">
                      ... ve {Object.keys(selectedResult.answers).length - 5} soru daha
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExamResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ExamResultsContent />
    </Suspense>
  );
}