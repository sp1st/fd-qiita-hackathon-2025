import { useState } from 'react';
import { useAuth } from '~/contexts/AuthContext';
import { SmartwatchDataDisplay } from '~/components/patient/SmartwatchDataDisplay';

export function meta() {
  return [
    { title: 'スマートウォッチ・AI連携 - オンライン診療システム' },
    { name: 'description', content: 'スマートウォッチデータとAIフィードバック機能' },
  ];
}

export default function PatientSmartwatch() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'data' | 'feedback' | 'goals'>('data');

  const tabs = [
    {
      id: 'data' as const,
      name: 'スマートウォッチデータ',
      icon: '📊',
      description: '運動、睡眠、活動データの確認',
    },
    {
      id: 'feedback' as const,
      name: 'AIフィードバック',
      icon: '🤖',
      description: 'パーソナライズされた健康アドバイス',
    },
    {
      id: 'goals' as const,
      name: '健康目標',
      icon: '🎯',
      description: '健康目標の設定と進捗管理',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                スマートウォッチ・AI連携
              </h1>
              <p className="text-gray-600 mt-1">
                健康データの管理とAIによるパーソナライズされたフィードバック
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
                  <div className="text-left">
                    <div className="font-medium">{tab.name}</div>
                    <div className="text-xs text-gray-400">{tab.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* タブコンテンツ */}
        {activeTab === 'data' && (
          <SmartwatchDataDisplay patientId={user?.id || 1} />
        )}
        
        {activeTab === 'feedback' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">AIフィードバック</h2>
              <p className="text-gray-600">
                AIフィードバック機能は現在開発中です。
              </p>
            </div>
          </div>
        )}
        
        {activeTab === 'goals' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">健康目標</h2>
              <p className="text-gray-600">
                健康目標管理機能は現在開発中です。
              </p>
            </div>
          </div>
        )}

        {/* 機能説明 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 rounded-lg p-3">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">
                スマートウォッチデータ
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              Fitbit、Apple Watch、Garminなどのスマートウォッチから取得した運動、睡眠、活動データを確認できます。
              医師との診察時に正確な健康情報を共有できます。
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 rounded-lg p-3">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">
                AIフィードバック
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              患者のパーソナリティを分析し、個性に合わせた健康アドバイスを提供します。
              モチベーション維持と生活習慣改善をサポートします。
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 rounded-lg p-3">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">
                健康目標管理
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              運動、睡眠、体重などの健康目標を設定し、進捗を追跡できます。
              目標達成に向けた継続的なモチベーションを維持できます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 