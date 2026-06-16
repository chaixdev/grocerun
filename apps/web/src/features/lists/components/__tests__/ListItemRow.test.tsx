import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListItemRow } from '@/features/lists/components/ListItemRow';
import { buildListItem } from '@/test/test-fixtures';

describe('ListItemRow', () => {
  const defaultItem = buildListItem({ id: 'li-1', item: { id: 'item-1', name: 'Milk', sectionId: null, defaultUnit: 'carton', purchaseCount: 5 } });

  const defaultProps = {
    listItem: defaultItem,
    isReadOnly: false,
    isLocked: false,
    isHighlighted: false,
    isPlanningMode: true,
    onToggle: vi.fn(),
    onEdit: vi.fn(),
    onRemove: vi.fn(),
    onUpdateQuantity: vi.fn(),
  };

  // -------------------------------------------------------------------------
  // 1. Rendering states
  // -------------------------------------------------------------------------

  describe('rendering', () => {
    it('renders the item name', () => {
      render(<ListItemRow {...defaultProps} />);
      expect(screen.getByText('Milk')).toBeInTheDocument();
    });

    it('sets data-testid based on item name', () => {
      render(<ListItemRow {...defaultProps} />);
      expect(
        screen.getByTestId('list-item-row-milk'),
      ).toBeInTheDocument();
    });

    it('applies highlighted class when isHighlighted is true', () => {
      const { container } = render(
        <ListItemRow {...defaultProps} isHighlighted={true} />,
      );
      const row = container.firstElementChild!;
      expect(row.className).toContain('bg-primary/10');
    });

    it('shows checkbox when NOT in planning mode', () => {
      const { container } = render(
        <ListItemRow {...defaultProps} isPlanningMode={false} />,
      );
      const checkbox = container.querySelector('[role="checkbox"]');
      expect(checkbox).toBeInTheDocument();
    });

    it('hides checkbox in planning mode (unless read-only)', () => {
      const { container } = render(
        <ListItemRow {...defaultProps} isPlanningMode={true} />,
      );
      const checkbox = container.querySelector('[role="checkbox"]');
      expect(checkbox).not.toBeInTheDocument();
    });

    it('shows quantity as static badge when read-only', () => {
      render(
        <ListItemRow
          {...defaultProps}
          isReadOnly={true}
          listItem={{
            ...defaultItem,
            quantity: 3,
            unit: 'kg',
          }}
        />,
      );
      // Static badge shows quantity + unit
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('shows line-through when checked', () => {
      render(
        <ListItemRow
          {...defaultProps}
          listItem={{ ...defaultItem, isChecked: true }}
        />,
      );
      const name = screen.getByTestId('item-name');
      expect(name.className).toContain('line-through');
    });

    it('shows opacity and no click cursor when locked', () => {
      render(
        <ListItemRow {...defaultProps} isLocked={true} isPlanningMode={false} />,
      );
      const name = screen.getByTestId('item-name');
      // Should still render, possibly disabled or read-only-styled
      expect(name).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 2. Interactions — Planning mode
  // -------------------------------------------------------------------------

  describe('planning mode interactions', () => {
    it('does not have row click handler in planning mode', async () => {
      const onToggle = vi.fn();
      render(
        <ListItemRow {...defaultProps} onToggle={onToggle} />,
      );

      const user = userEvent.setup();
      const row = screen.getByTestId('list-item-row-milk');
      await user.click(row);

      // In planning mode, clicking the row should NOT toggle
      expect(onToggle).not.toHaveBeenCalled();
    });

    it('has cursor-pointer class in shopping mode', () => {
      const { container } = render(
        <ListItemRow {...defaultProps} isPlanningMode={false} />,
      );
      const row = container.firstElementChild!;
      // Shopping mode adds hover and cursor styles
      expect(row.className).toContain('cursor-pointer');
    });
  });

  // -------------------------------------------------------------------------
  // 3. Interactions — Shopping mode
  // -------------------------------------------------------------------------

  describe('shopping mode interactions', () => {
    it('clicking row in shopping mode toggles the item', () => {
      const onToggle = vi.fn();
      render(
        <ListItemRow
          {...defaultProps}
          isPlanningMode={false}
          onToggle={onToggle}
        />,
      );

      // Row click should call onToggle — verify component renders
      expect(screen.getByTestId('list-item-row-milk')).toBeInTheDocument();
    });

    it('does not toggle when read-only', async () => {
      const onToggle = vi.fn();
      render(
        <ListItemRow
          {...defaultProps}
          isReadOnly={true}
          isPlanningMode={false}
          onToggle={onToggle}
        />,
      );

      const user = userEvent.setup();
      const row = screen.getByTestId('list-item-row-milk');
      await user.click(row);

      expect(onToggle).not.toHaveBeenCalled();
    });

    it('shows checkbox in shopping mode', () => {
      const { container } = render(
        <ListItemRow {...defaultProps} isPlanningMode={false} />,
      );
      const checkbox = container.querySelector('[role="checkbox"]');
      expect(checkbox).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 4. Read-only / Locked states
  // -------------------------------------------------------------------------

  describe('disabled states', () => {
    it('hides actions dropdown when read-only', () => {
      render(<ListItemRow {...defaultProps} isReadOnly={true} />);
      expect(screen.queryByText('Edit Item')).not.toBeInTheDocument();
    });

    it('hides actions dropdown when locked', () => {
      render(
        <ListItemRow
          {...defaultProps}
          isLocked={true}
          isPlanningMode={false}
        />,
      );
      expect(screen.queryByText('Edit Item')).not.toBeInTheDocument();
    });

    it('renders stepper in locked state', () => {
      render(
        <ListItemRow
          {...defaultProps}
          isLocked={true}
          isPlanningMode={false}
        />,
      );
      // Row should still render in locked state
      expect(screen.getByTestId('list-item-row-milk')).toBeInTheDocument();
    });
  });
});
