import { memo, useState, useCallback } from 'react'

const THEME_COLORS = [
  '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B',
  '#FFC107', '#FF9800', '#FF5722', '#F44336',
  '#009688', '#00BCD4', '#03A9F4', '#2196F3',
  '#3F51B5', '#673AB7', '#9C27B0', '#E91E63',
  '#795548', '#212121', '#424242', '#9E9E9E',
  '#BDBDBD', '#E0E0E0', '#FAFAFA'
]

const ColorPicker = memo(function ColorPicker({ onColorChange }) {
  const [activeColor, setActiveColor] = useState('#673AB7')

  const handleColorClick = useCallback((color) => {
    setActiveColor(color)
    onColorChange?.(color)
  }, [onColorChange])

  const handleCustomColorChange = useCallback((e) => {
    const color = e.target.value
    setActiveColor(color)
    onColorChange?.(color)
  }, [onColorChange])

  return (
    <div className="signup-color-picker" role="group" aria-label="Theme color picker">
      {THEME_COLORS.map((color) => (
        <button
          key={color}
          className={`signup-color-picker-item ${activeColor === color ? 'active' : ''}`}
          style={{ backgroundColor: color }}
          onClick={() => handleColorClick(color)}
          aria-label={`Select color ${color}`}
          aria-pressed={activeColor === color}
          type="button"
        />
      ))}
      
      <label htmlFor="customColorPickInput">
        <div
          id="customColorPick"
          className="signup-color-picker-item picker-item-custom material-icons"
          role="button"
          aria-label="Choose custom color"
        />
      </label>
      <input
        id="customColorPickInput"
        type="color"
        className="input hidden"
        onChange={handleCustomColorChange}
        aria-label="Custom color picker"
      />
    </div>
  )
})

export default ColorPicker
