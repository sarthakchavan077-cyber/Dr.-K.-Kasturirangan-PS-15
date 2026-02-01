import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSimulationEngine } from '../hooks/useSimulationEngine'

const SimulationContext = createContext(null)

export const useSimulation = () => useContext(SimulationContext)

export const SimulationProvider = ({ children }) => {
  const [isRunning, setIsRunning] = useState(false)
  const [traffic, setTraffic] = useState([])
  const [trafficHistory, setTrafficHistory] = useState([])
  const [serverStats, setServerStats] = useState({
    cpuLoad: 10,
    memory: 20,
    activeConnections: 0,
    latencyMs: 20,
    errorRate: 0
  })
  const [mitigationConfigs, setMitigationConfigs] = useState({
    rateLimit: false,
    rateLimitThreshold: 50,
    ipBlock: false,
    blacklistedIps: new Set(),
    geoBlock: false,
    challengeResponse: false
  })
  const [attackSettings, setAttackSettings] = useState({
    enabled: false,
    attackType: 'UDP Flood',
    intensity: 50,
    duration: 0
  })
  const [legitTraffic, setLegitTraffic] = useState({
    enabled: true,
    rate: 10
  })
  const [logs, setLogs] = useState([])

  const addLog = useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [{ message, type, timestamp }, ...prev].slice(0, 100))
  }, [])

  const generateIP = () => {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
  }

  const generateRequest = useCallback((type) => {
    const id = Math.random().toString(36).substr(2, 9)
    const ip = generateIP()
    return {
      id,
      type,
      ip,
      timestamp: Date.now(),
      status: 'PENDING'
    }
  }, [])

  const processRequests = useCallback((requests) => {
    const { rateLimit, rateLimitThreshold, ipBlock, blacklistedIps } = mitigationConfigs
    const processed = requests.map(req => {
      let status = '200 OK'
      let dropped = false

      if (ipBlock && blacklistedIps.has(req.ip)) {
        status = 'BLOCKED'
        dropped = true
      } else if (rateLimit) {
        const recentFromIp = requests.filter(r => r.ip === req.ip && !r.dropped && r.timestamp >= Date.now() - 1000)
        if (recentFromIp.length > rateLimitThreshold) {
          status = '429 Too Many Requests'
          dropped = true
        }
      }

      const load = serverStats.cpuLoad
      if (!dropped && load > 90) {
        status = '503 Service Unavailable'
        dropped = true
      }

      return { ...req, status, dropped }
    })

    return processed
  }, [mitigationConfigs, serverStats.cpuLoad])

  const { tick } = useSimulationEngine({
    isRunning,
    attackSettings,
    legitTraffic,
    mitigationConfigs,
    generateRequest,
    processRequests,
    setTraffic,
    setServerStats,
    addLog,
    setTrafficHistory
  })

  const startSimulation = () => {
    setIsRunning(true)
    addLog('Simulation started', 'success')
  }

  const stopSimulation = () => {
    setIsRunning(false)
    addLog('Simulation stopped', 'warning')
  }

  const resetSimulation = () => {
    setIsRunning(false)
    setTraffic([])
    setTrafficHistory([])
    setServerStats({
      cpuLoad: 10,
      memory: 20,
      activeConnections: 0,
      latencyMs: 20,
      errorRate: 0
    })
    setLogs([])
    addLog('Simulation reset', 'info')
  }

  const toggleMitigation = (key, value) => {
    setMitigationConfigs(prev => ({ ...prev, [key]: value }))
    addLog(`Mitigation ${key} ${value ? 'enabled' : 'disabled'}`, value ? 'success' : 'warning')
  }

  const updateMitigationConfig = (key, value) => {
    setMitigationConfigs(prev => ({ ...prev, [key]: value }))
  }

  const updateAttackSettings = (key, value) => {
    setAttackSettings(prev => ({ ...prev, [key]: value }))
    if (key === 'enabled' && value) {
      addLog(`Attack launched: ${prev.attackType}`, 'error')
    } else if (key === 'enabled' && !value) {
      addLog('Attack stopped', 'success')
    }
  }

  const updateLegitTraffic = (key, value) => {
    setLegitTraffic(prev => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    if (isRunning) {
      tick()
    }
  }, [isRunning])

  const value = {
    isRunning,
    startSimulation,
    stopSimulation,
    resetSimulation,
    traffic,
    trafficHistory,
    serverStats,
    mitigationConfigs,
    attackSettings,
    legitTraffic,
    logs,
    toggleMitigation,
    updateMitigationConfig,
    updateAttackSettings,
    updateLegitTraffic,
    tick
  }

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  )
}