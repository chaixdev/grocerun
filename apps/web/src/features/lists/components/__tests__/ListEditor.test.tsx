import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ListEditor } from '@/features/lists/components/ListEditor'
import type { ListDetail } from '@/features/lists/hooks/useListQueries'
import { buildListItem } from '@/test/test-fixtures'

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  toggleItem: vi.fn(),
  removeItem: vi.fn(),
  updateItemQuantity: vi.fn(),
  startShopping: vi.fn(),
  cancelShopping: vi.fn(),
  completeList: vi.fn(),
  addItem: vi.fn(),
  completeAndCreate: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ navigate: mocks.navigate }),
}))

vi.mock('@/hooks/use-screen-wake-lock', () => ({
  useScreenWakeLock: vi.fn(),
}))

vi.mock('@/features/lists/hooks/useLists', () => ({
  useToggleItem: () => ({ mutate: mocks.toggleItem, isPending: false }),
  useRemoveItem: () => ({ mutate: mocks.removeItem, isPending: false }),
  useUpdateItemQuantity: () => ({ mutate: mocks.updateItemQuantity, isPending: false }),
  useStartShopping: () => ({ mutate: mocks.startShopping, isPending: false }),
  useCancelShopping: () => ({ mutate: mocks.cancelShopping, isPending: false }),
  useCompleteList: () => ({ mutate: mocks.completeList, isPending: false }),
}))

vi.mock('@/features/lists/hooks/useAddItem', () => ({
  useAddItem: () => ({ mutate: mocks.addItem, isPending: false }),
}))

vi.mock('@/features/lists/hooks/useCompleteAndCreateList', () => ({
  useCompleteAndCreateList: () => ({
    execute: mocks.completeAndCreate,
    isExecuting: false,
  }),
}))

vi.mock('@/core/auth/use-auth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    initializationError: null,
    user: { sub: 'user-1', name: 'Test', email: 'test@test.com' },
    accountKey: 'user-1',
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))

const shoppingList: ListDetail = {
  id: 'list-1',
  name: 'Collaborative shopping',
  status: 'SHOPPING',
  updatedAt: '2026-08-04T12:00:00.000Z',
  store: {
    id: 'store-1',
    name: 'Market',
    sections: [],
  },
  items: [buildListItem({ listId: 'list-1' })],
}

describe('ListEditor collaborative shopping', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('keeps shopping controls and item actions available without the obsolete observer banner', () => {
    render(<ListEditor list={shoppingList} />)

    expect(screen.getByTestId('list-item-row-milk')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check Milk' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Cancel Shopping' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Finish (0/1)' })).toBeEnabled()
    expect(screen.queryByText(/another household member is currently shopping/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/only they can make changes/i)).not.toBeInTheDocument()
  })

  it('sends collaborative item and cancel-shopping actions through their mutation hooks', async () => {
    const user = userEvent.setup()
    render(<ListEditor list={shoppingList} />)

    await user.click(screen.getByRole('button', { name: 'Check Milk' }))
    expect(mocks.toggleItem).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: 'li-1',
        isChecked: true,
        listId: 'list-1',
      }),
      expect.any(Object),
    )

    await user.click(screen.getByRole('button', { name: 'Cancel Shopping' }))
    expect(mocks.cancelShopping).toHaveBeenCalledWith(
      { listId: 'list-1', storeId: 'store-1' },
      expect.any(Object),
    )
  })
})
