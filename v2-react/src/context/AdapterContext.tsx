import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface AdapterContextValue {
  adapter: any // TODO: Type this properly with DataAdapter interface
  isReady: boolean
}

const AdapterContext = createContext<AdapterContextValue>({
  adapter: null,
  isReady: false
})

export function AdapterProvider({ children }: { children: ReactNode }) {
  const [adapter, setAdapter] = useState<any>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const checkReady = async () => {
      // Wait for window.v2Adapter to be available
      if ((window as any).v2Adapter) {
        await (window as any).v2Adapter.readyPromise
        setAdapter((window as any).v2Adapter)
        setIsReady(true)
      } else {
        // Retry after a short delay if not ready yet
        setTimeout(checkReady, 100)
      }
    }
    checkReady()
  }, [])

  return (
    <AdapterContext.Provider value={{ adapter, isReady }}>
      {children}
    </AdapterContext.Provider>
  )
}

export const useAdapter = () => useContext(AdapterContext)
