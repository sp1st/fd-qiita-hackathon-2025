import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '~/contexts/AuthContext'
import { Loading } from '~/components/common/Loading'
// import { ErrorMessage } from '~/components/common/ErrorMessage'

interface Patient {
  id: number
  name: string
  email: string
  phoneNumber: string | null
  dateOfBirth: string | null
  gender: 'male' | 'female' | 'other' | null
}

export default function DoctorPatients() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/worker/login');
        return;
      }

      try {
        const response = await fetch('/api/worker/doctor/patients', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch patients');
        }

        const data: unknown = await response.json();
        if (
          typeof data === 'object' &&
          data !== null &&
          'patients' in data &&
          Array.isArray((data as any).patients)
        ) {
          setPatients((data as { patients: Patient[] }).patients);
        } else {
          throw new Error('不正なデータ形式です');
        }
      } catch (error) {
        console.error('患者データの取得エラー:', error);
        setError('データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, [navigate]);

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

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">担当患者一覧</h1>
          <p className="mt-2 text-sm text-gray-700">
            {user?.name || '医師'}先生が担当している患者の一覧です。
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
                              <div className="text-gray-400">{patient.phoneNumber}</div>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {formatDate(patient.dateOfBirth)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {getGenderLabel(patient.gender)}
                        </td>
                        <td className="relative whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <Link
                            to={`/worker/doctor/patients/${patient.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            詳細を見る
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
    </div>
  )
}
