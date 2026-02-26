'use client'

import { Suspense, useRef, useState, useMemo, useEffect, useCallback } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as THREE from 'three'
import { Button } from '@/components/ui/button'
import { Loader2, RotateCcw, Maximize2, Minimize2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface STLViewerProps {
  fileUrl: string
  className?: string
  compact?: boolean
}

interface ModelInfo {
  triangles: number
  sizeX: number
  sizeY: number
  sizeZ: number
}

// Load and process STL geometry outside of the React tree to avoid re-render issues
const geometryCache = new Map<string, { geometry: THREE.BufferGeometry; info: ModelInfo }>()

function loadAndProcessSTL(url: string): Promise<{ geometry: THREE.BufferGeometry; info: ModelInfo }> {
  const cached = geometryCache.get(url)
  if (cached) return Promise.resolve(cached)

  return new Promise((resolve, reject) => {
    const loader = new STLLoader()
    loader.load(
      url,
      (geometry) => {
        geometry.computeBoundingBox()
        const box = geometry.boundingBox!
        const center = new THREE.Vector3()
        box.getCenter(center)
        const size = new THREE.Vector3()
        box.getSize(size)

        // Clone and transform so the original isn't mutated
        const geo = geometry.clone()
        geo.translate(-center.x, -center.y, -center.z)
        const maxDim = Math.max(size.x, size.y, size.z)
        if (maxDim > 0) {
          const s = 2 / maxDim
          geo.scale(s, s, s)
        }

        const triangleCount = geo.index
          ? geo.index.count / 3
          : (geo.attributes.position?.count ?? 0) / 3

        const result = {
          geometry: geo,
          info: {
            triangles: Math.round(triangleCount),
            sizeX: Math.round(size.x * 10) / 10,
            sizeY: Math.round(size.y * 10) / 10,
            sizeZ: Math.round(size.z * 10) / 10,
          },
        }
        geometryCache.set(url, result)
        resolve(result)
      },
      undefined,
      reject,
    )
  })
}

function STLModel({ geometry, wireframe }: { geometry: THREE.BufferGeometry; wireframe: boolean }) {
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color="#b0b0b0"
        wireframe={wireframe}
        flatShading={!wireframe}
      />
    </mesh>
  )
}

function Controls({ controlsRef }: { controlsRef: React.MutableRefObject<OrbitControls | null> }) {
  const { camera, gl } = useThree()

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.1
    controls.rotateSpeed = 0.8
    controlsRef.current = controls

    return () => {
      controls.dispose()
    }
  }, [camera, gl, controlsRef])

  return null
}

export function STLViewer({ fileUrl, className, compact = false }: STLViewerProps) {
  const [wireframe, setWireframe] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Defer Canvas mount to avoid WebGL context loss from strict mode double-mount
  const [canvasReady, setCanvasReady] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<OrbitControls | null>(null)

  // Load STL file imperatively (not via useLoader which conflicts with strict mode)
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setGeometry(null)
    setCanvasReady(false)

    loadAndProcessSTL(fileUrl)
      .then((result) => {
        if (cancelled) return
        setGeometry(result.geometry)
        setModelInfo(result.info)
        setLoading(false)
        // Defer Canvas mount slightly to ensure DOM is stable
        requestAnimationFrame(() => {
          if (!cancelled) setCanvasReady(true)
        })
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Erro ao carregar modelo')
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [fileUrl])

  const handleResetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
  }, [])

  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }, [isFullscreen])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const viewerHeight = compact ? 'h-[250px]' : isFullscreen ? 'h-full' : 'h-[400px]'

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative rounded-lg border bg-muted/20',
        isFullscreen && 'fixed inset-0 z-50 rounded-none border-none bg-background',
        className,
      )}
    >
      {/* Controls */}
      <div className="absolute right-2 top-2 z-10 flex gap-1">
        {!compact && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 w-7 p-0"
            onClick={() => setShowInfo(!showInfo)}
            title="Informacoes do modelo"
          >
            <Info className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0"
          onClick={handleResetCamera}
          title="Resetar camera"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant={wireframe ? 'default' : 'outline'}
          className="h-7 text-xs"
          onClick={() => setWireframe(!wireframe)}
        >
          {wireframe ? 'Solido' : 'Wire'}
        </Button>
        {!compact && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 w-7 p-0"
            onClick={handleFullscreen}
            title={isFullscreen ? 'Sair de tela cheia' : 'Tela cheia'}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        )}
      </div>

      {/* Model info overlay */}
      {showInfo && modelInfo && (
        <div className="absolute left-2 top-2 z-10 rounded-md bg-background/90 px-3 py-2 text-xs text-muted-foreground shadow-sm border">
          <p>{modelInfo.triangles.toLocaleString('pt-BR')} triangulos</p>
          <p>{modelInfo.sizeX} x {modelInfo.sizeY} x {modelInfo.sizeZ} mm</p>
        </div>
      )}

      <div className={cn('w-full', viewerHeight)}>
        {(loading || !canvasReady) && !error && (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Carregando modelo 3D...</p>
          </div>
        )}
        {error && (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}
        {canvasReady && geometry && (
          <Canvas
            camera={{ position: [0, 0, 4], fov: 50 }}
            style={{ background: 'transparent' }}
            gl={{ preserveDrawingBuffer: true }}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            <directionalLight position={[-5, -5, -5]} intensity={0.4} />
            <STLModel geometry={geometry} wireframe={wireframe} />
            <Controls controlsRef={controlsRef} />
          </Canvas>
        )}
      </div>
    </div>
  )
}
