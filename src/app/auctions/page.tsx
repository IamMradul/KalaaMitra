import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { use } from 'react'

async function fetchAuctions() {
  const { data, error } = await supabase
    .from('auctions')
    .select('*, product:products(title, image_url, price)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export default async function AuctionsPage() {
  const auctions = await fetchAuctions()

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Auctions</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((a: any) => (
            <div key={a.id} className="bg-white rounded-lg border p-4">
              <div className="h-48 bg-gray-100 flex items-center justify-center mb-3">
                {a.product?.image_url ? <img src={a.product.image_url} className="w-full h-full object-cover" /> : <div className="text-gray-400">No image</div>}
              </div>
              <h3 className="font-semibold mb-1">{a.product?.title || 'Untitled'}</h3>
              <div className="text-sm text-gray-600 mb-2">Status: {a.status}</div>
              <div className="text-lg font-bold text-orange-600">₹{a.starting_price}</div>
              <div className="mt-3 flex space-x-2">
                <Link href={`/product/${a.product_id}`} className="px-3 py-2 bg-orange-500 text-white rounded">View</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
