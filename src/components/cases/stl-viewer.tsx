'use client'

import { Suspense, useRef, useState, useEffect } from 'react'
import { Canvas, useLoader, useThree } from '@react-three/fiber'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as THREE from 'three'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface STLViewerProps {
  fileUrl: string
  className?: string
}

function STLModel({ url, wireframe }: { url: string; wireframe: boolean }) {
  const geometry = useLoader(STLLoader, url)

  // Center and scale geometry
  useEffect(() => {
    geometry.computeBoundingBox()
    const box = geometry.boundingBox!
    const center = new THREE.Vector3()
    box.getCenter(center)
    geometry.translate(-center.x, -center.y, -center.z)

    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)
    if (maxDim > 0) {
      const scale = 2 / maxDim
      geometry.scale(scale, scale, scale)
    }
  }, [geometry])

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

function Controls() {
  const { camera, gl } = useThree()
  const controlsRef = useRef<OrbitControls>(null)

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.1
    controls.rotateSpeed = 0.8
    controlsRef.current = controls

    return () => {
      controls.dispose()
    }
  }, [camera, gl])

  return null
}

export function STLViewer({ fileUrl, className }: STLViewerProps) {
  const [wireframe, setWireframe] = useState(false)

  return (
    <div className={cn('relative rounded-lg border bg-muted/20', className)}>
      {/* Controls */}
      <div className="absolute right-2 top-2 z-10 flex gap-1">
        <Button
          size="sm"
          variant={wireframe ? 'default' : 'outline'}
          className="h-7 text-xs"
          onClick={() => setWireframe(!wireframe)}
        >
          {wireframe ? 'Solido' : 'Wireframe'}
        </Button>
      </div>

      <div className="h-[400px] w-full">
        <Suspense fallback={
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }>
          <Canvas
            camera={{ position: [0, 0, 4], fov: 50 }}
            style={{ background: 'transparent' }}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            <directionalLight position={[-5, -5, -5]} intensity={0.4} />
            <STLModel url={fileUrl} wireframe={wireframe} />
            <Controls />
          </Canvas>
        </Suspense>
      </div>
    </div>
  )
}
