'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState([])
  const [uploadError, setUploadError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      setUser(session.user)
      await fetchFiles(session.user.id)
      setLoading(false)
    }

    checkUser()
  }, [])

  const fetchFiles = async (userId) => {
    const { data, error } = await supabase.storage
      .from('pdfs')
      .list(userId)

    if (error) {
      console.error('Error fetching files:', error)
      return
    }

    setFiles(data || [])
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are allowed')
      return
    }

    setUploading(true)
    setUploadError('')

    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${user.id}/${Date.now()}_${cleanName}`

    const { error } = await supabase.storage
      .from('pdfs')
      .upload(filePath, file)

    if (error) {
      setUploadError(error.message)
      setUploading(false)
      return
    }

    await fetchFiles(user.id)
    setUploading(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">My Documents</h1>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/login')
            }}
            className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-700 mb-4">Upload a PDF</h2>
          {uploadError && <p className="text-red-500 text-sm mb-4">{uploadError}</p>}
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-blue-400 transition">
            <p className="text-gray-500 text-sm mb-2">Click to select a PDF</p>
            <p className="text-gray-400 text-xs">Only PDF files supported</p>
            <input
              type="file"
              accept=".pdf"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
          {uploading && <p className="text-blue-500 text-sm mt-3">Uploading...</p>}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-700 mb-4">Your Documents</h2>
          {files.length === 0 ? (
            <p className="text-gray-400 text-sm">No documents uploaded yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {files.map((file) => (
                <li key={file.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3">
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-400">PDF</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}