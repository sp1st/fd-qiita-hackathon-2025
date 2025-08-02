import { useEffect, useState } from 'react'
import { type LoaderFunctionArgs } from 'react-router'
import { Link } from 'react-router'
import { Loading } from '~/components/common/Loading'
import { useAuth } from '~/contexts/AuthContext'
import { getAuthToken } from '~/utils/auth'

interface Patient {
  id: number
  name: string
  email: string
  phoneNumber: string | null
  dateOfBirth: string | null
  gender: 'male' | 'female' | 'other' | null
}

export async function loader({ request: _request }: LoaderFunctionArgs) {
  return {
    needsClientLoad: true
  }
}

export default function DoctorPatients() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    // クライアントサイドでのみトークンを取得
    const authToken = getAuthToken()
    setToken(authToken)
  }, [])

  useEffect(() => {
    if (!token) {
      return // トークンがない場合は何もしない
    }    
    const fetchPatients = async () => {
      try {
        const response = await fetch('/api/worker/doctor/patients', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
        })
        if (!response.ok) {
          throw new Error('Failed to fetch patients')
        }
        const data: { patients: Patient[] } = await response.json()
        setPatients(data.patients)
      } catch (error) {
        console.error('Error fetching patients:', error)
        setPatients([])
        setError('患者データの取得に失敗しました')
      }
    }
    fetchPatients()
  }, [token])

  // 認証状態を確認中の場合はローディング表示
  if (isLoading) {
    return <Loading fullScreen message="認証状態を確認中..." />;
  }

  // ユーザー情報がない場合のフォールバック
  const currentUser = user || { name: '山田太郎', role: 'doctor' };

  const formatDate = (dateString: string | null) => {
    if (!dateString) {return '未設定'}
    return new Date(dateString).toLocaleDateString('ja-JP')
  }

  const getGenderLabel = (gender: string | null) => {
    switch (gender) {
      case 'male': return '男性'
      case 'female': return '女性'
      case 'other': return 'その他'
      default: return '未設定'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">担当患者一覧</h1>
          <p className="mt-2 text-sm text-gray-700">
            {currentUser.name}先生が担当している患者の一覧です。
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            {patients.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
                <p className="text-gray-600">担当患者がいません。</p>
              </div>
            ) : (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        患者名
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        連絡先
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        生年月日
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        性別
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">操作</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {patients.map((patient: Patient) => (
                      <tr key={patient.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {patient.name}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          <div>
                            <div>{patient.email}</div>
                            {patient.phoneNumber && (
                              <div className="text-xs text-gray-400">{patient.phoneNumber}</div>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {formatDate(patient.dateOfBirth)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {getGenderLabel(patient.gender)}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link
                            to={`/worker/doctor/patients/${patient.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            詳細表示
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          患者数: {patients.length}名
        </p>
      </div>
    </div>
  )
}