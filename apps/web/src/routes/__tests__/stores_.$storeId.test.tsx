import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StoreDetailsPage } from '../stores_.$storeId'
import { buildStore } from '@/test/test-fixtures'

// ---------------------------------------------------------------------------
// Mock TanStack Router hooks
// ---------------------------------------------------------------------------
const mockStoreId = 'store-1'

vi.mock('@tanstack/react-router', () => ({
    createFileRoute: (_path: string) => (config: Record<string, unknown>) => config,
    lazyRouteComponent: () => () => null,
    useParams: () => ({ storeId: mockStoreId }),
    Link: ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => (
        <a href={to} className={className}>
            {children}
        </a>
    ),
}))

// ---------------------------------------------------------------------------
// Mock useStore / useUpdateStore from stores feature
// ---------------------------------------------------------------------------
const mockUseStore = vi.fn()
const mockMutate = vi.fn()

vi.mock('@/features/stores/hooks/useStore', () => ({
    useStore: (storeId: string) => mockUseStore(storeId),
    useUpdateStore: () => ({ mutate: mockMutate, isPending: false }),
}))

// ---------------------------------------------------------------------------
// Mock child components
// ---------------------------------------------------------------------------
vi.mock('@/features/stores/components/SectionForm', () => ({
    SectionForm: ({ storeId }: { storeId: string }) => (
        <div data-testid="section-form" data-store-id={storeId} />
    ),
}))

vi.mock('@/features/stores/components/SectionList', () => ({
    SectionList: ({ storeId }: { storeId: string }) => (
        <div data-testid="section-list" data-store-id={storeId} />
    ),
}))

vi.mock('@/features/lists/components/StoreLists', () => ({
    StoreLists: ({ storeId }: { storeId: string }) => (
        <div data-testid="store-lists" data-store-id={storeId} />
    ),
}))

vi.mock('@/features/stores/components/StoreSettings', () => ({
    StoreDeleteSection: ({ storeId, storeName }: { storeId: string; storeName: string }) => (
        <div data-testid="store-delete-section" data-store-id={storeId} data-store-name={storeName} />
    ),
}))

// ---------------------------------------------------------------------------
// Mock sonner toast
// ---------------------------------------------------------------------------
vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn() },
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('StoreDetailsPage (consolidated)', () => {
    const testStore = buildStore({
        id: 'store-1',
        name: 'Costco Downtown',
        location: '123 Main St',
    })

    beforeEach(() => {
        vi.clearAllMocks()
        mockUseStore.mockReturnValue({ data: testStore, isLoading: false, error: null })
    })

    describe('loading state', () => {
        it('renders loading indicator while store data is loading', () => {
            mockUseStore.mockReturnValue({ data: undefined, isLoading: true, error: null })

            render(<StoreDetailsPage />)

            expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument()
        })
    })

    describe('error state', () => {
        it('renders not-found message when store query errors', () => {
            mockUseStore.mockReturnValue({ data: undefined, isLoading: false, error: new Error('Not found') })

            render(<StoreDetailsPage />)

            expect(screen.getByText('Store not found.')).toBeInTheDocument()
        })

        it('renders not-found message when store data is null', () => {
            mockUseStore.mockReturnValue({ data: null, isLoading: false, error: null })

            render(<StoreDetailsPage />)

            expect(screen.getByText('Store not found.')).toBeInTheDocument()
        })
    })

    describe('store details', () => {
        it('renders the store name as a clickable button for inline editing', () => {
            render(<StoreDetailsPage />)

            expect(screen.getByRole('button', { name: /Costco Downtown. Click to edit/ })).toBeInTheDocument()
        })

        it('renders the store location as a clickable button for inline editing', () => {
            render(<StoreDetailsPage />)

            expect(screen.getByRole('button', { name: /123 Main St. Click to edit/ })).toBeInTheDocument()
        })

        it('renders "No location set" when location is null', () => {
            mockUseStore.mockReturnValue({
                data: buildStore({ name: 'Noloc Store', location: null }),
                isLoading: false,
                error: null,
            })

            render(<StoreDetailsPage />)

            expect(screen.getByText('No location set')).toBeInTheDocument()
        })

        it('renders sections and store lists child components', () => {
            render(<StoreDetailsPage />)

            expect(screen.getByTestId('section-form')).toBeInTheDocument()
            expect(screen.getByTestId('section-list')).toBeInTheDocument()
            expect(screen.getByTestId('store-lists')).toBeInTheDocument()
        })

        it('has a back link to /stores', () => {
            render(<StoreDetailsPage />)

            const backLink = screen.getByRole('link', { hidden: true })
            expect(backLink).toHaveAttribute('href', '/stores')
        })
    })

    describe('inline editing: store name', () => {
        it('switches to input editing when store name button is clicked', async () => {
            const user = userEvent.setup()
            render(<StoreDetailsPage />)

            const nameBtn = screen.getByRole('button', { name: /Costco Downtown. Click to edit/ })
            await user.click(nameBtn)

            // Input should appear with the current name value
            const input = screen.getByDisplayValue('Costco Downtown')
            expect(input).toBeInTheDocument()
        })

        it('saves edited name on Enter key', async () => {
            const user = userEvent.setup()
            render(<StoreDetailsPage />)

            await user.click(screen.getByRole('button', { name: /Costco Downtown. Click to edit/ }))
            const input = screen.getByDisplayValue('Costco Downtown')
            await user.clear(input)
            await user.type(input, 'New Store Name')
            await user.keyboard('{Enter}')

            expect(mockMutate).toHaveBeenCalledWith({ name: 'New Store Name', location: '123 Main St' })
        })

        it('saves edited name on blur', async () => {
            const user = userEvent.setup()
            render(<StoreDetailsPage />)

            await user.click(screen.getByRole('button', { name: /Costco Downtown. Click to edit/ }))
            const input = screen.getByDisplayValue('Costco Downtown')
            await user.clear(input)
            await user.type(input, 'New Name')
            await user.tab()

            expect(mockMutate).toHaveBeenCalledWith({ name: 'New Name', location: '123 Main St' })
        })

        it('cancels editing on Escape without saving', async () => {
            const user = userEvent.setup()
            render(<StoreDetailsPage />)

            await user.click(screen.getByRole('button', { name: /Costco Downtown. Click to edit/ }))
            const input = screen.getByDisplayValue('Costco Downtown')
            await user.clear(input)
            await user.type(input, 'Changed')
            await user.keyboard('{Escape}')

            expect(mockMutate).not.toHaveBeenCalled()
            expect(screen.getByRole('button', { name: /Costco Downtown. Click to edit/ })).toBeInTheDocument()
        })

        it('does not save if value is unchanged', async () => {
            const user = userEvent.setup()
            render(<StoreDetailsPage />)

            await user.click(screen.getByRole('button', { name: /Costco Downtown. Click to edit/ }))
            // Click the save check button without changing anything
            await user.keyboard('{Enter}')

            expect(mockMutate).not.toHaveBeenCalled()
        })
    })

    describe('inline editing: location', () => {
        it('switches to input editing when location button is clicked', async () => {
            const user = userEvent.setup()
            render(<StoreDetailsPage />)

            await user.click(screen.getByRole('button', { name: /123 Main St. Click to edit/ }))
            expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument()
        })

        it('saves edited location', async () => {
            const user = userEvent.setup()
            render(<StoreDetailsPage />)

            await user.click(screen.getByRole('button', { name: /123 Main St. Click to edit/ }))
            const input = screen.getByDisplayValue('123 Main St')
            await user.clear(input)
            await user.type(input, '456 Oak Ave')
            await user.keyboard('{Enter}')

            expect(mockMutate).toHaveBeenCalledWith({ name: 'Costco Downtown', location: '456 Oak Ave' })
        })

        it('knows name is always included when editing location', async () => {
            const user = userEvent.setup()
            render(<StoreDetailsPage />)

            await user.click(screen.getByRole('button', { name: /123 Main St. Click to edit/ }))
            const input = screen.getByDisplayValue('123 Main St')
            await user.clear(input)
            await user.type(input, 'New Location')
            await user.keyboard('{Enter}')

            // Location update should still include the store name
            const call = mockMutate.mock.calls[0][0]
            expect(call.name).toBe('Costco Downtown')
            expect(call.location).toBe('New Location')
        })
    })

    describe('delete section', () => {
        it('renders delete section inside a collapsed details element', () => {
            render(<StoreDetailsPage />)

            expect(screen.getByText('Delete this store…')).toBeInTheDocument()
            expect(screen.getByTestId('store-delete-section')).toBeInTheDocument()
        })

        it('passes store id and name to delete section', () => {
            render(<StoreDetailsPage />)

            const deleteSection = screen.getByTestId('store-delete-section')
            expect(deleteSection).toHaveAttribute('data-store-id', 'store-1')
            expect(deleteSection).toHaveAttribute('data-store-name', 'Costco Downtown')
        })
    })
})
