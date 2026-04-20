'use client'

import dynamic from 'next/dynamic'

const ApiReference = dynamic(
  () => import('@scalar/api-reference-react').then(mod => mod.ApiReferenceReact),
  { ssr: false }
)

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen">
      <ApiReference
        configuration={{
          url: '/api/openapi',
          theme: 'kepler',
          layout: 'modern',
          darkMode: true,
          hideModels: false,
          searchHotKey: 'k',
        }}
      />
    </div>
  )
}
