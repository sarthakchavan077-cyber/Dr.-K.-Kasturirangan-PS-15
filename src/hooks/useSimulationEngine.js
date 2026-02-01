import { useCallback, useRef } from 'react'

export const useSimulationEngine = ({ isRunning, attackSettings, legitTraffic, mitigationConfigs, generateRequest, processRequests, setTraffic, setServerStats, addLog, setTrafficHistory }) => {
  const tickRef = useRef(null)
  const requestCounter = useRef(0)
  const lastSecondRef = useRef(Date.now())
  const legitCountRef = useRef(0)
  const attackCountRef = useRef(0)

  const tick = useCallback(() => {
    const now = Date.now()
    const elapsedSinceLastSecond = now - lastSecondRef.current

    if (elapsedSinceLastSecond >= 1000) {
      const legitCount = legitCountRef.current
      const attackCount = attackCountRef.current
      const total = legitCount + attackCount

      setTrafficHistory(prev => {
        const newHistory = [...prev, {
          timestamp: new Date(now).toLocaleTimeString(),
          legit: legitCount,
          attack: attackCount,
          total
        }]
        return newHistory.slice(-60)
      })

      legitCountRef.current = 0
      attackCountRef.current = 0
      lastSecondRef.current = now
    }

    const newRequests = []

    if (legitTraffic.enabled) {
      const legitRequestsPerTick = legitTraffic.rate / 10
      const legitToSpawn = Math.floor(legitRequestsPerTick) + (Math.random() < (legitRequestsPerTick % 1) ? 1 : 0)
      
      for (let i = 0; i < legitToSpawn; i++) {
        newRequests.push(generateRequest('LEGIT'))
        legitCountRef.current++
      }
    }

    if (attackSettings.enabled) {
      const attackRequestsPerTick = attackSettings.intensity * 2
      const attackToSpawn = Math.floor(attackRequestsPerTick) + (Math.random() < (attackRequestsPerTick % 1) ? 1 : 0)
      
      for (let i = 0; i < attackToSpawn; i++) {
        newRequests.push(generateRequest('ATTACK'))
        attackCountRef.current++
      }

      if (Math.random() < 0.01) {
        addLog(`Attack in progress: ${attackSettings.attackType}`, 'error')
      }
    }

    if (newRequests.length > 0) {
      setTraffic(prev => [...prev, ...newRequests])
    }

    setTraffic(prevRequests => {
      const processedRequests = processRequests(prevRequests)

      const activeConnections = processedRequests.length
      const totalLoad = Math.min(100, (activeConnections / 200) * 100)
      
      const errorCount = processedRequests.filter(r => r.status.includes('503') || r.status.includes('429')).length
      const errorRate = processedRequests.length > 0 ? (errorCount / processedRequests.length) * 100 : 0

      const baseLatency = 20
      const loadLatency = Math.floor(totalLoad * 2)
      const newLatency = baseLatency + loadLatency

      const memoryUsage = Math.min(100, 20 + totalLoad * 0.5)

      const newServerStats = {
        cpuLoad: Math.round(totalLoad),
        memory: Math.round(memoryUsage),
        activeConnections,
        latencyMs: newLatency,
        errorRate: Math.round(errorRate)
      }

      setServerStats(newServerStats)

      const recentLogs = processedRequests.filter(r => 
        (r.status === 'BLOCKED' || r.status === '429 Too Many Requests' || r.status === '503 Service Unavailable') &&
        !r.logged
      )

      recentLogs.slice(0, 5).forEach(req => {
        if (req.status === 'BLOCKED') {
          addLog(`Blocked IP: ${req.ip}`, 'warning')
        } else if (req.status === '429 Too Many Requests') {
          addLog(`Rate limited: ${req.ip}`, 'warning')
        } else if (req.status === '503 Service Unavailable') {
          addLog(`Server overloaded - ${req.type} request dropped`, 'error')
        }
      })

      const markedLogs = processedRequests.map(r => ({ ...r, logged: true }))
      const oldRequests = markedLogs.filter(r => now - r.timestamp > 5000)

      const remaining = markedLogs.filter(r => now - r.timestamp <= 5000)
      return remaining
    })

    tickRef.current = requestAnimationFrame(tick)
  }, [isRunning, attackSettings, legitTraffic, mitigationConfigs, generateRequest, processRequests, setTraffic, setServerStats, addLog, setTrafficHistory])

  return { tick }
}