"use client"

import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("skeleton rounded", className)} />
  )
}

// Skeleton variants for common IDE patterns
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn("h-4", i === lines - 1 ? "w-3/4" : "w-full")} 
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn("p-4 rounded-lg border border-border bg-card", className)}>
      <Skeleton className="h-4 w-3/4 mb-3" />
      <SkeletonText lines={2} />
    </div>
  )
}

export function SkeletonButton({ className }: SkeletonProps) {
  return (
    <Skeleton className={cn("h-9 w-24 rounded-md", className)} />
  )
}

export function SkeletonAvatar({ className }: SkeletonProps) {
  return (
    <Skeleton className={cn("h-10 w-10 rounded-full", className)} />
  )
}

// Component palette skeleton
export function SkeletonComponentPalette() {
  return (
    <div className="p-2 space-y-3">
      {/* Search skeleton */}
      <Skeleton className="h-8 w-full rounded-lg" />
      
      {/* Categories */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          {/* Category header */}
          <div className="flex items-center gap-2 px-2">
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-3 w-24" />
          </div>
          
          {/* Components grid */}
          <div className="grid grid-cols-2 gap-1 pl-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="p-2 rounded-lg border border-border">
                <Skeleton className="h-6 w-6 mx-auto mb-1" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Screen list skeleton
export function SkeletonScreenList() {
  return (
    <div className="p-3 space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border">
          <Skeleton className="h-4 w-4" />
          <div className="flex-1">
            <Skeleton className="h-3 w-20 mb-1" />
            <Skeleton className="h-2 w-12" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Repository list skeleton
export function SkeletonRepoList() {
  return (
    <div className="p-3 space-y-2">
      <div className="flex justify-between items-center mb-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-5 w-5 rounded" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-2.5 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-2 w-full ml-6" />
        </div>
      ))}
    </div>
  )
}

// Phone preview skeleton
export function SkeletonPhonePreview() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-[280px] h-[560px] bg-card rounded-3xl border-4 border-border p-2">
        <div className="w-full h-full bg-secondary rounded-2xl p-4 flex flex-col">
          {/* Status bar */}
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
          
          {/* App bar */}
          <Skeleton className="h-10 w-full rounded-lg mb-4" />
          
          {/* Content */}
          <div className="flex-1 space-y-3">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-8 w-3/4 rounded-lg" />
            <Skeleton className="h-10 w-1/2 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Properties panel skeleton
export function SkeletonPropertiesPanel() {
  return (
    <div className="p-3 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-4 w-24" />
      </div>
      
      {/* Properties */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-full rounded-md" />
        </div>
      ))}
    </div>
  )
}

// Full page loading
export function LoadingScreen({ message = "Carregando..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-primary/20 animate-pulse" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
