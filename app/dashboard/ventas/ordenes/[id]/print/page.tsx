"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useFirestore } from "@/hooks/use-firestore"
import { COLLECTIONS } from "@/lib/firestore"
import { DocumentPrintContent } from "@/components/documents/document-preview"
import type { SalesOrder } from "@/lib/types"
import { where } from "firebase/firestore"

export default function PrintOrderPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const orderId = params.id as string
  const docType = searchParams.get('doc') || 'remision'
  const { user } = useAuth()
  const companyId = user?.companyId || ""

  const [order, setOrder] = useState<SalesOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [printed, setPrinted] = useState(false)

  const { items: orders } = useFirestore<SalesOrder>(
    COLLECTIONS.salesOrders,
    companyId ? [where("companyId", "==", companyId)] : [],
    true
  )

  useEffect(() => {
    if (orders.length > 0 && orderId) {
      const foundOrder = orders.find(o => o.id === orderId)
      if (foundOrder) {
        setOrder(foundOrder)
        setLoading(false)
      }
    }
  }, [orders, orderId])

  useEffect(() => {
    if (!loading && order && !printed) {
      // Auto-print when content is ready, then close the window
      setPrinted(true)
      const handleAfterPrint = () => {
        window.close()
      }

      window.addEventListener("afterprint", handleAfterPrint)

      const timeout = setTimeout(() => {
        window.focus()
        window.print()
      }, 250)

      const fallbackClose = setTimeout(() => {
        window.close()
      }, 2000)

      return () => {
        clearTimeout(timeout)
        clearTimeout(fallbackClose)
        window.removeEventListener("afterprint", handleAfterPrint)
      }
    }
  }, [loading, order, printed])

  if (loading || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparando documento para impresión...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          @page {
            margin: 0.5in;
            size: A4;
          }
        }
        @media screen {
          body {
            background: white !important;
          }
        }
      `}</style>
      <div className="bg-white text-black">
        <DocumentPrintContent
          documentType={docType as "remision" | "factura"}
          salesOrder={order}
        />
      </div>
    </>
  )
}
