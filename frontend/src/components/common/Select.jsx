import React, { useState, useRef, useEffect, useId, forwardRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Coastal Navy Custom Select Component.
 * Replaces the un-stylable native browser OS dropdown popup with a custom,
 * fully themed floating menu matching Coastal Navy design tokens.
 *
 * Supports:
 * - Direct options array `options={[{ value, label }]}` OR `<option>` children
 * - Standard onChange({ target: { value } }) contract
 * - Click-outside dismiss
 * - Keyboard navigation (Escape, Enter, Space, Arrows)
 * - Custom icons, active checkmarks, light/dark theming
 */
const Select = forwardRef(function Select(
  {
    id,
    name,
    value,
    defaultValue,
    onChange,
    options,
    children,
    placeholder = 'Select an option',
    className = '',
    containerClassName = '',
    dropdownClassName = '',
    icon,
    disabled = false,
    size = 'md',
    'aria-label': ariaLabel,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const selectId = id || generatedId;

  // Extract normalized option items
  const items = React.useMemo(() => {
    if (Array.isArray(options) && options.length > 0) {
      return options.map((opt) =>
        typeof opt === 'string'
          ? { value: opt, label: opt }
          : { value: opt.value, label: opt.label || opt.value, disabled: opt.disabled }
      );
    }

    if (children) {
      return React.Children.toArray(children)
        .map((child) => {
          if (!child || typeof child !== 'object' || !child.props) return null;
          return {
            value: child.props.value,
            label: child.props.children || child.props.value,
            disabled: child.props.disabled,
          };
        })
        .filter(Boolean);
    }

    return [];
  }, [options, children]);

  // Uncontrolled vs controlled value handling
  const [internalValue, setInternalValue] = useState(
    value !== undefined ? value : defaultValue !== undefined ? defaultValue : items[0]?.value || ''
  );

  const currentValue = value !== undefined ? value : internalValue;

  const selectedItem = items.find((item) => String(item.value) === String(currentValue)) || {
    value: currentValue,
    label: currentValue || placeholder,
  };

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [placement, setPlacement] = useState('bottom'); // 'bottom' | 'top'
  const [maxMenuHeight, setMaxMenuHeight] = useState(240);
  const containerRef = useRef(null);
  const listboxRef = useRef(null);

  // Compute adaptive placement (open up vs down) based on viewport clearance
  const updatePlacement = React.useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 800;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Approximate full dropdown height based on item count: ~38px per item + padding
    const fullHeight = Math.min(Math.max((items?.length || 1) * 38 + 16, 110), 260);

    // If space below is insufficient for the full list and above has more space, open upward
    if (spaceBelow < fullHeight && spaceAbove > spaceBelow) {
      setPlacement('top');
      setMaxMenuHeight(Math.max(100, Math.min(240, Math.floor(spaceAbove - 16))));
    } else {
      setPlacement('bottom');
      setMaxMenuHeight(Math.max(100, Math.min(240, Math.floor(spaceBelow - 16))));
    }
  }, [items]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Recalculate placement when opening, resizing, or scrolling
  useEffect(() => {
    if (!isOpen) return;

    updatePlacement();

    const handleScrollOrResize = () => {
      updatePlacement();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updatePlacement]);

  // Sync highlighted item when opening
  useEffect(() => {
    if (isOpen) {
      const idx = items.findIndex((item) => String(item.value) === String(currentValue));
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, items, currentValue]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listboxRef.current && highlightedIndex >= 0) {
      const activeEl = listboxRef.current.children[highlightedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (val) => {
    if (disabled) return;
    if (value === undefined) {
      setInternalValue(val);
    }
    setIsOpen(false);

    if (onChange) {
      onChange({
        target: {
          name: name || selectId,
          value: val,
        },
      });
    }
  };

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePlacement();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        updatePlacement();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 < items.length ? prev + 1 : 0));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : items.length - 1));
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (highlightedIndex >= 0 && items[highlightedIndex]) {
        handleSelect(items[highlightedIndex].value);
      }
    }
  };

  const sizeClasses = {
    sm: 'py-2 pl-3 pr-8.5 text-xs rounded-xl',
    md: 'py-2.5 pl-3.5 pr-9 text-sm rounded-xl',
    lg: 'py-3 pl-4 pr-10 text-base rounded-2xl',
  }[size] || 'py-2.5 pl-3.5 pr-9 text-sm rounded-xl';

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-block w-full select-none text-left', containerClassName)}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden real select for forms / standard DOM compatibility */}
      <select
        id={selectId}
        name={name}
        value={currentValue}
        onChange={(e) => handleSelect(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only pointer-events-none"
        disabled={disabled}
      >
        {items.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Trigger Button */}
      <button
        ref={ref}
        type="button"
        id={`${selectId}-button`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={toggleOpen}
        className={cn(
          'w-full flex items-center justify-between text-left font-medium transition-all duration-150 outline-none cursor-pointer',
          'bg-white dark:bg-navy-900',
          'border border-slate-200/90 dark:border-navy-700',
          'text-slate-900 dark:text-slate-100',
          'hover:border-ocean-400 dark:hover:border-navy-600 hover:bg-slate-50/50 dark:hover:bg-navy-850/60',
          'focus:border-ocean-600 focus:ring-2 focus:ring-ocean-500/20 dark:focus:border-ocean-500 dark:focus:ring-ocean-500/25',
          isOpen && 'border-ocean-600 ring-2 ring-ocean-500/20 dark:border-ocean-500 dark:ring-ocean-500/25',
          disabled && 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-navy-950',
          'shadow-2xs',
          icon ? 'pl-9.5' : '',
          sizeClasses,
          className
        )}
        {...props}
      >
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
            {icon}
          </div>
        )}

        <span className="truncate block pr-2">
          {selectedItem ? selectedItem.label : placeholder}
        </span>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none transition-transform duration-200">
          <ChevronDown className={cn('w-4 h-4', isOpen && 'rotate-180 text-ocean-600 dark:text-ocean-400')} />
        </div>
      </button>

      {/* ── Custom Styled Coastal Navy Dropdown Menu ── */}
      {isOpen && (
        <div
          ref={listboxRef}
          role="listbox"
          tabIndex={-1}
          style={{ maxHeight: `${maxMenuHeight}px` }}
          className={cn(
            'absolute left-0 right-0 z-50 p-1.5',
            placement === 'top'
              ? 'bottom-full mb-1.5 origin-bottom animate-in fade-in zoom-in-95'
              : 'top-full mt-1.5 origin-top animate-in fade-in zoom-in-95',
            'bg-white dark:bg-navy-850',
            'border border-slate-200/95 dark:border-navy-700',
            'rounded-2xl shadow-xl backdrop-blur-md',
            'overflow-y-auto space-y-0.5 duration-150',
            dropdownClassName
          )}
        >
          {items.map((item, idx) => {
            const isSelected = String(item.value) === String(currentValue);
            const isHighlighted = idx === highlightedIndex;

            return (
              <div
                key={item.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(item.value)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer select-none',
                  isSelected
                    ? 'bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 font-semibold'
                    : isHighlighted
                    ? 'bg-slate-100/80 dark:bg-navy-800/60 text-slate-900 dark:text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800/50'
                )}
              >
                <span className="truncate">{item.label}</span>
                {isSelected && (
                  <Check className="w-4 h-4 text-ocean-600 dark:text-ocean-400 shrink-0 ml-2" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default Select;
