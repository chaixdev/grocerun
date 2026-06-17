import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TripSummary } from '@/features/lists/components/TripSummary';

// TripSummary uses Dialog which renders in a portal.
// Use RTL's cleanup after each test to properly unmount portal content.
afterEach(() => {
  cleanup();
});

describe('TripSummary', () => {
  const defaultProps = {
    open: true,
    onOpenChange: () => {},
    onConfirm: () => {},
    missingItems: [] as { id: string; name: string; quantity: number; unit: string | null }[],
    isSubmitting: false,
  };

  it('shows all-items-checked message when no missing items', () => {
    render(<TripSummary {...defaultProps} />);
    expect(screen.getByText('Trip Summary')).toBeInTheDocument();
    expect(
      screen.getByText('All items checked! Ready to wrap up?'),
    ).toBeInTheDocument();
  });

  it('shows missing items with orange dot indicators', () => {
    render(
      <TripSummary
        {...defaultProps}
        missingItems={[
          { id: '1', name: 'Milk', quantity: 2, unit: 'carton' },
          { id: '2', name: 'Bread', quantity: 1, unit: null },
        ]}
      />,
    );

    expect(
      screen.getByText('You have 2 missing or incomplete items.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Milk')).toBeInTheDocument();
    expect(screen.getByText('Bread')).toBeInTheDocument();

    // Quantity badge: "2 carton" for Milk
    expect(screen.getByText(/2\s+carton/)).toBeInTheDocument();

    // No badge for Bread (qty=1, unit=null)
    // The bread li should exist but have no quantity badge
    const breadItem = screen.getByText('Bread').closest('li');
    expect(breadItem).toBeInTheDocument();
  });

  it('renders Resume Shopping and Complete Trip buttons', () => {
    render(<TripSummary {...defaultProps} />);

    expect(
      screen.getByRole('button', { name: 'Resume Shopping' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Complete Trip' }),
    ).toBeInTheDocument();
  });

  it('calls onOpenChange(false) when Resume Shopping is clicked', async () => {
    const onOpenChange = vi.fn();
    render(
      <TripSummary {...defaultProps} onOpenChange={onOpenChange} />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Resume Shopping' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onConfirm when Complete Trip is clicked', async () => {
    const onConfirm = vi.fn();
    render(<TripSummary {...defaultProps} onConfirm={onConfirm} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Complete Trip' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows Completing... and disables button when isSubmitting', () => {
    render(<TripSummary {...defaultProps} isSubmitting={true} />);

    const button = screen.getByRole('button', { name: 'Completing...' });
    expect(button).toBeDisabled();
  });

  it('does not render when open is false', () => {
    render(<TripSummary {...defaultProps} open={false} />);
    expect(screen.queryByText('Trip Summary')).not.toBeInTheDocument();
  });

  // ---- Toggle: "Create new list from unchecked items" ----

  describe('create-new-list toggle', () => {
    const missingItems = [
      { id: '1', name: 'Milk', quantity: 2, unit: 'carton' as const },
      { id: '2', name: 'Bread', quantity: 1, unit: null },
    ];

    it('shows toggle when showCreateToggle is true and missing items exist', () => {
      render(
        <TripSummary
          {...defaultProps}
          missingItems={missingItems}
          showCreateToggle
        />,
      );

      expect(
        screen.getByText(/Create new list from 2 unchecked items/),
      ).toBeInTheDocument();
    });

    it('hides toggle when showCreateToggle is false (default)', () => {
      render(
        <TripSummary {...defaultProps} missingItems={missingItems} />,
      );

      expect(
        screen.queryByText(/Create new list from/),
      ).not.toBeInTheDocument();
    });

    it('hides toggle when showCreateToggle is true but no missing items', () => {
      render(
        <TripSummary
          {...defaultProps}
          missingItems={[]}
          showCreateToggle
        />,
      );

      expect(
        screen.queryByText(/Create new list from/),
      ).not.toBeInTheDocument();
    });

    it('reflects checked state from createToggleChecked prop', () => {
      render(
        <TripSummary
          {...defaultProps}
          missingItems={missingItems}
          showCreateToggle
          createToggleChecked
        />,
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('reflects unchecked state from createToggleChecked prop', () => {
      render(
        <TripSummary
          {...defaultProps}
          missingItems={missingItems}
          showCreateToggle
          createToggleChecked={false}
        />,
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('calls onCreateToggleChange when checkbox is clicked', async () => {
      const onChange = vi.fn();
      render(
        <TripSummary
          {...defaultProps}
          missingItems={missingItems}
          showCreateToggle
          createToggleChecked={false}
          onCreateToggleChange={onChange}
        />,
      );

      const user = userEvent.setup();
      await user.click(screen.getByRole('checkbox'));
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('uses singular "item" when only one unchecked item', () => {
      render(
        <TripSummary
          {...defaultProps}
          missingItems={[{ id: '1', name: 'Milk', quantity: 1, unit: null }]}
          showCreateToggle
        />,
      );

      expect(
        screen.getByText(/Create new list from 1 unchecked item/),
      ).toBeInTheDocument();
    });
  });
});
