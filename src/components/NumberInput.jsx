import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumber, parseLocalNumber } from '../lib/format.js';

export default function NumberInput({ 
  value, 
  onChange, 
  placeholder = "0", 
  className = "", 
  disabled = false,
  min = null,
  max = null,
  allowNegative = true,
  currency = false,
  ...props 
}) {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'id' ? 'id-ID' : 'en-US';
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Update display value when value prop changes
  useEffect(() => {
    if (!isFocused) {
      const numValue = parseLocalNumber(value, locale);
      if (numValue === 0 && !value) {
        setDisplayValue('');
      } else {
        setDisplayValue(formatNumber(numValue, locale));
      }
    }
  }, [value, locale, isFocused]);

  const handleFocus = (e) => {
    setIsFocused(true);
    // Show raw number for editing
    const numValue = parseLocalNumber(value, locale);
    if (numValue === 0) {
      setDisplayValue('');
    } else {
      setDisplayValue(numValue.toString());
    }
    e.target.select();
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    const rawValue = e.target.value;
    let numValue = parseLocalNumber(rawValue, locale);
    
    // Apply constraints
    if (min !== null && numValue < min) numValue = min;
    if (max !== null && numValue > max) numValue = max;
    if (!allowNegative && numValue < 0) numValue = 0;
    
    // Update parent component
    if (onChange) {
      onChange(numValue);
    }
    
    // Format display value
    if (numValue === 0) {
      setDisplayValue('');
    } else {
      setDisplayValue(formatNumber(numValue, locale));
    }
  };

  const handleChange = (e) => {
    const rawValue = e.target.value;
    setDisplayValue(rawValue);
    
    // Real-time validation for immediate feedback
    const numValue = parseLocalNumber(rawValue, locale);
    if (Number.isFinite(numValue)) {
      if (onChange) {
        onChange(numValue);
      }
    }
  };

  const handleKeyDown = (e) => {
    // Allow: backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true) ||
        // Allow: home, end, left, right
        (e.keyCode >= 35 && e.keyCode <= 39)) {
      return;
    }
    
    // Allow decimal separator based on locale
    const decimalSeparator = locale === 'id-ID' ? ',' : '.';
    if (e.key === decimalSeparator && displayValue.indexOf(decimalSeparator) === -1) {
      return;
    }
    
    // Allow minus sign at the beginning if negative numbers are allowed
    if (allowNegative && e.key === '-' && displayValue.length === 0) {
      return;
    }
    
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={`number-input ${className}`}
      disabled={disabled}
      {...props}
    />
  );
}