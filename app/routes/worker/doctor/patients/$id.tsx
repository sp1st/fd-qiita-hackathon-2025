import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router';
import { Loading } from '~/components/common/Loading';
import { SmartwatchDataPanel } from '~/components/doctor/SmartwatchDataPanel';

interface Patient {
  id: number;
  name: string;
  email: string;
  phoneNumber: string | null;
  dateOfBirth: string | null;
  gender: 'male' | 'female' | 'other' | null;
}

interface Appointment {
  id: number;
  scheduledAt: string;
  status: string;
  chiefComplaint: string;
  appointmentType: string;
  durationMinutes: number;
}

export default function PatientDetail() {
  // const { user } = useAuth();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'smartwatch' | 'appointments' | 'medical-records'>('overview');

  // URLパラメータからタブを設定
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'smartwatch') {
      setActiveTab('smartwatch');
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchPatientData = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('認証が必要です');
        return;
      }

      try {
        // 患者情報を取得
        const patientResponse = await fetch(`/api/worker/doctor/patients/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!patientResponse.ok) {
          throw new Error('Failed to fetch patient data');
        }

        const patientData = await patientResponse.json() as { patient: Patient };
        setPatient(patientData.patient);

        // 患者の予約履歴を取得
        const appointmentsResponse = await fetch(`/api/worker/doctor/patients/${id}/appointments`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (appointmentsResponse.ok) {
          const appointmentsData = await appointmentsResponse.json() as { appointments: Appointment[] };
          setAppointments(appointmentsData.appointments || []);
        }
      } catch (error) {
        console.error('患者データの取得エラー:', error);
        setError('データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchPatientData();
    }
  }, [id]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) {
      return '未設定';
    }
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const getGenderLabel = (gender: string | null) => {
    switch (gender) {
      case 'male': 
        return '男性';
      case 'female': 
        return '女性';
      case 'other': 
        return 'その他';
      default: 
        return '未設定';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">確定</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">完了</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">キャンセル</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">保留</span>;
    }
  };

  const tabs = [
    { id: 'overview' as const, name: '概要', icon: '👤' },
    { id: 'smartwatch' as const, name: 'スマートウォッチ', icon: '📱' },
    { id: 'appointments' as const, name: '予約履歴', icon: '📅' },
    { id: 'medical-records' as const, name: '診療記録', icon: '📋' },
  ];

  if (isLoading) {
    return <Loading />;
  }

  if (error || !patient) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error || '患者が見つかりません'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {patient.name}さんの詳細
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              患者ID: {patient.id}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/worker/doctor/patients"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              患者一覧に戻る
            </Link>
            <Link
              to={`/worker/doctor/consultation/${patient.id}`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              診察開始
            </Link>
          </div>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="mb-8">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.name}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* タブコンテンツ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 基本情報 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">基本情報</h3>
            </div>
            <div className="px-6 py-4">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">氏名</dt>
                  <dd className="text-sm text-gray-900">{patient.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
                  <dd className="text-sm text-gray-900">{patient.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">電話番号</dt>
                  <dd className="text-sm text-gray-900">{patient.phoneNumber || '未設定'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">生年月日</dt>
                  <dd className="text-sm text-gray-900">{formatDate(patient.dateOfBirth)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">性別</dt>
                  <dd className="text-sm text-gray-900">{getGenderLabel(patient.gender)}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* 最近の予約 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">最近の予約</h3>
            </div>
            <div className="px-6 py-4">
              {appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.slice(0, 3).map((appointment) => (
                    <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(appointment.scheduledAt).toLocaleDateString('ja-JP')}
                          </p>
                          <p className="text-sm text-gray-500">{appointment.chiefComplaint}</p>
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">予約履歴がありません</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'smartwatch' && (
        <SmartwatchDataPanel patientId={patient.id} patientName={patient.name} />
      )}

      {activeTab === 'appointments' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">予約履歴</h3>
          </div>
          <div className="px-6 py-4">
            {appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(appointment.scheduledAt).toLocaleDateString('ja-JP')} {new Date(appointment.scheduledAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-sm text-gray-500">{appointment.chiefComplaint}</p>
                        <p className="text-sm text-gray-500">{appointment.appointmentType} ({appointment.durationMinutes}分)</p>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">予約履歴がありません</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'medical-records' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">診療記録</h3>
          </div>
          <div className="px-6 py-4">
            <p className="text-sm text-gray-500">診療記録機能は現在開発中です。</p>
          </div>
        </div>
      )}
    </div>
  );
} 