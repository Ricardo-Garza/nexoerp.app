"use client"

import { useState, useEffect, useCallback } from "react"
import { getItems, addItem, updateItem, deleteItem, initializeMockData } from "@/lib/storage"

/**
 * @deprecated Use hooks/use-firestore.ts for new implementations
 * This hook uses localStorage and is kept for backward compatibility
 */
export function useData<T extends { id: string | number }>(collection: string, initialItems?: T[]) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  // Load initial data
  useEffect(() => {
    initializeMockData()
    loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadItems = useCallback(() => {
    setLoading(true)
    const data = getItems<T>(collection as any)
    const sanitized = Array.isArray(data) ? data.filter((item) => item && typeof item === "object") : []
    // Semilla local: si el storage está vacío y la página aporta datos demo, úsalos
    setItems(sanitized.length === 0 && initialItems ? initialItems : sanitized)
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection])

  const create = useCallback(
    async (item: Omit<T, "id"> & { id?: T["id"] }) => {
      const newItem = addItem<T>(collection as any, item as T)
      loadItems()
      return newItem
    },
    [collection, loadItems],
  )

  const update = useCallback(
    async (id: string | number, updates: Partial<T>) => {
      const updated = updateItem<T>(collection as any, id, updates)
      loadItems()
      return updated
    },
    [collection, loadItems],
  )

  const remove = useCallback(
    async (id: string | number) => {
      const success = deleteItem(collection as any, id)
      loadItems()
      return success
    },
    [collection, loadItems],
  )

  return {
    items,
    loading,
    create,
    update,
    remove,
    // Alias legacy: varias páginas v0 consumen estos nombres
    addItem: create,
    updateItem: update,
    deleteItem: remove,
    refresh: loadItems,
  }
}
