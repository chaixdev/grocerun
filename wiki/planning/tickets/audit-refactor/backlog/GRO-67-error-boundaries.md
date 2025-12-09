# GRO-67: Add Error Boundary Components

**Phase:** 3 (Standardization)  
**Priority:** Medium  
**Audit Items:** #25  
**Depends On:** Phase 2 complete  
**Blocks:** None

---

## Problem

The application lacks React Error Boundary components:
- Client-side component errors crash the entire page
- No graceful degradation for feature failures
- Poor user experience when errors occur

---

## Solution

Add Error Boundary components at:
1. Root level (app-wide fallback)
2. Feature level (isolate feature failures)
3. Critical component level (list editor, etc.)

---

## Implementation Steps

### 1. Create Base Error Boundary

Create `src/components/error-boundary.tsx`:

```typescript
'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button 
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Try again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
```

### 2. Create Feature-Specific Error Fallbacks

Create `src/features/lists/components/ListErrorFallback.tsx`:

```typescript
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface Props {
  onRetry?: () => void
}

export function ListErrorFallback({ onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/50">
      <p className="text-muted-foreground mb-4">
        Unable to load your list. Please try again.
      </p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Reload List
      </Button>
    </div>
  )
}
```

### 3. Wrap Root Layout

Update `src/app/layout.tsx`:

```typescript
import { ErrorBoundary } from '@/components/error-boundary'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
```

### 4. Wrap Feature Routes

Update `src/app/lists/[listId]/page.tsx`:

```typescript
import { ErrorBoundary } from '@/components/error-boundary'
import { ListErrorFallback } from '@/features/lists/components/ListErrorFallback'

export default function ListPage({ params }) {
  return (
    <ErrorBoundary fallback={<ListErrorFallback />}>
      <ListEditor listId={params.listId} />
    </ErrorBoundary>
  )
}
```

### 5. Add Next.js Error Files

Create `src/app/error.tsx` (client error page):

```typescript
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <h2 className="text-xl font-semibold mb-4">Something went wrong!</h2>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
```

Create `src/app/global-error.tsx` (root error boundary):

```typescript
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h2>Something went wrong!</h2>
          <button onClick={reset}>Try again</button>
        </div>
      </body>
    </html>
  )
}
```

---

## Error Boundary Placement

| Level | File | Purpose |
|-------|------|---------|
| Global | `src/app/global-error.tsx` | Root layout errors |
| App | `src/app/error.tsx` | Page-level errors |
| Feature | `src/app/lists/[listId]/error.tsx` | List feature errors |
| Feature | `src/app/stores/[storeId]/error.tsx` | Store feature errors |
| Component | Inline `<ErrorBoundary>` | Critical component isolation |

---

## Acceptance Criteria

- [ ] `ErrorBoundary` component created
- [ ] `error.tsx` added to app root
- [ ] `global-error.tsx` added to app root
- [ ] Feature routes wrapped with error boundaries
- [ ] Error UI includes retry functionality
- [ ] `npm run build` passes
- [ ] Simulated error shows fallback UI (manual test)

---

## Testing

```typescript
// Create a component that throws
function BrokenComponent() {
  throw new Error('Test error')
}

// Verify error boundary catches it
<ErrorBoundary>
  <BrokenComponent />
</ErrorBoundary>
// Should show fallback UI, not crash page
```

---

## Notes

- Error boundaries only catch rendering errors, not event handlers
- Event handler errors need try/catch
- Consider adding error reporting service integration later
