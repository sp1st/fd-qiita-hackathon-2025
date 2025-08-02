import { Link } from 'react-router';
import { useAuth } from '~/contexts/AuthContext';

export function meta() {
  return [
    { title: '患者ホーム - オンライン診療システム' },
    { name: 'description', content: '患者向けホームページ' },
  ];
}

export default function PatientIndex() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                患者ホーム
              </h1>
              <p className="text-gray-600 mt-1">
                オンライン診療システムへようこそ
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                ようこそ、{user?.name}さん
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* メインコンテンツ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/patient/dashboard"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 rounded-lg p-3">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">
                ダッシュボード
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              予約状況、通知、健康データを確認できます。
            </p>
          </Link>

          <Link
            to="/patient/smartwatch"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="bg-green-100 rounded-lg p-3">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">
                スマートウォッチ連携
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              スマートウォッチデータとAIフィードバックを確認できます。
            </p>
          </Link>

          <Link
            to="/patient/appointments"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 rounded-lg p-3">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">
                予約管理
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              診察予約の確認と新規予約を行えます。
            </p>
          </Link>

          <Link
            to="/patient/prescriptions"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="bg-yellow-100 rounded-lg p-3">
                <span className="text-2xl">💊</span>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">
                処方箋
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              処方箋の履歴と詳細を確認できます。
            </p>
          </Link>

          <Link
            to="/patient/messages"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="bg-red-100 rounded-lg p-3">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">
                メッセージ
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              医師とのメッセージを確認できます。
            </p>
          </Link>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="bg-gray-100 rounded-lg p-3">
                <span className="text-2xl">ℹ️</span>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">
                ヘルプ
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              システムの使い方やサポート情報を確認できます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}