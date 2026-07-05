/**
 * Example React Component Usage with CSS Modules
 * 
 * This file demonstrates how to use the converted CSS modules
 * in your React components.
 */

import React from 'react';

// Import global styles in your App root (App.jsx)
import '../styles/global.css';

// Import component-specific CSS modules
import buttonStyles from '../styles/Button.module.css';
import titlebarStyles from '../styles/Titlebar.module.css';
import slideoutStyles from '../styles/Slideout.module.css';
import browserStyles from '../styles/Browser.module.css';
import playerStyles from '../styles/Player.module.css';
import signupStyles from '../styles/Signup.module.css';
import colorPickerStyles from '../styles/ColorPicker.module.css';
import loaderStyles from '../styles/Loader.module.css';

// ============================================
// BUTTON COMPONENT EXAMPLE
// ============================================
export function Button({ children, variant = 'default', onClick }) {
  const getButtonClass = () => {
    switch (variant) {
      case 'flat':
        return buttonStyles.buttonFlat;
      case 'float':
        return buttonStyles.buttonFloat;
      case 'google':
        return `${buttonStyles.button} ${buttonStyles.buttonGoogle}`;
      case 'facebook':
        return `${buttonStyles.button} ${buttonStyles.buttonFacebook}`;
      case 'dropbox':
        return `${buttonStyles.button} ${buttonStyles.buttonDropbox}`;
      default:
        return buttonStyles.button;
    }
  };

  return (
    <button className={getButtonClass()} onClick={onClick}>
      {children}
    </button>
  );
}

// ============================================
// FLOATING BUTTON COMPONENT EXAMPLE
// ============================================
export function FloatButton({ icon, label, labelPosition = 'bottom', active = true, onClick }) {
  return (
    <div 
      className={`${buttonStyles.buttonFloat} ${active ? buttonStyles.active : ''}`}
      onClick={onClick}
    >
      <i className="material-icons">{icon}</i>
      {label && (
        <span className={`${buttonStyles.buttonFloatLabel} ${buttonStyles[labelPosition]}`}>
          {label}
        </span>
      )}
    </div>
  );
}

// ============================================
// TITLEBAR COMPONENT EXAMPLE
// ============================================
export function Titlebar({ onMenuClick, onSearchClick }) {
  return (
    <div className={titlebarStyles.titlebar}>
      <div className={`${titlebarStyles.titlebarBox} ${titlebarStyles.titlebarLeft}`}>
        <div className={`${titlebarStyles.titlebarItem} ${titlebarStyles.titlebarLogo}`}>
          <i className="material-icons">play_circle_filled</i>
          Logo
        </div>
      </div>
      
      <div className={`${titlebarStyles.titlebarBox} ${titlebarStyles.titlebarCenter}`}>
        <Button onClick={onSearchClick}>
          <i className="material-icons">search</i>
          Search
        </Button>
      </div>
      
      <div className={`${titlebarStyles.titlebarBox} ${titlebarStyles.titlebarRight}`}>
        <div 
          className={`${titlebarStyles.titlebarItem} ${titlebarStyles.titlebarMenu}`}
          onClick={onMenuClick}
        >
          <i className="material-icons">menu</i>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SLIDEOUT MENU COMPONENT EXAMPLE
// ============================================
export function Slideout({ isOpen, onClose }) {
  return (
    <div className={`${slideoutStyles.slideout} ${!isOpen ? slideoutStyles.hidden : ''}`}>
      <div className={slideoutStyles.slideoutAccount}>
        <div className={slideoutStyles.slideoutEntry}>
          View Profile
          <i className="material-icons">account_circle</i>
        </div>
        <div className={slideoutStyles.slideoutEntry} onClick={onClose}>
          Sign Out
          <i className="material-icons">exit_to_app</i>
        </div>
      </div>
      
      <div className={slideoutStyles.slideoutTechnical}>
        <div className={slideoutStyles.slideoutEntry}>
          Settings
          <i className="material-icons">settings</i>
        </div>
      </div>
      
      <div className={slideoutStyles.slideoutBottom}>
        <ColorPicker />
      </div>
    </div>
  );
}

// ============================================
// COLOR PICKER COMPONENT EXAMPLE
// ============================================
export function ColorPicker({ onColorSelect }) {
  const colors = [
    '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B',
    '#FFC107', '#FF9800', '#FF5722', '#F44336',
    '#009688', '#00BCD4', '#03A9F4', '#2196F3',
    '#3F51B5', '#673AB7', '#9C27B0', '#E91E63',
    '#795548', '#212121', '#424242', '#9E9E9E',
    '#BDBDBD', '#E0E0E0', '#FAFAFA'
  ];

  return (
    <div className={colorPickerStyles.signupColorPicker}>
      {colors.map((color) => (
        <div
          key={color}
          className={colorPickerStyles.signupColorPickerItem}
          style={{ backgroundColor: color }}
          onClick={() => onColorSelect?.(color)}
        />
      ))}
      <div className={`${colorPickerStyles.signupColorPickerItem} ${colorPickerStyles.pickerItemCustom}`}>
        {/* Custom color picker trigger */}
      </div>
    </div>
  );
}

// ============================================
// BROWSER CONTENT ITEM COMPONENT EXAMPLE
// ============================================
export function BrowserContentItem({ title, username, views, rating, isNsfw, isPick, onClick }) {
  const itemClasses = [
    browserStyles.browserContentItem,
    isNsfw && browserStyles.nsfw,
    isPick && browserStyles.pick
  ].filter(Boolean).join(' ');

  return (
    <div className={itemClasses} onClick={onClick}>
      <div className={browserStyles.browserContentItemFrame}>
        <div className={browserStyles.browserContentItemFrameBg} />
        
        <div className={browserStyles.browserContentItemViews}>
          <i className="material-icons">visibility</i>
          <span>{views}</span>
        </div>
        
        <div className={browserStyles.browserContentItemRating}>
          <span>{rating}</span>
          <i className="material-icons">thumbs_up_down</i>
        </div>
        
        <div className={browserStyles.browserContentItemPlay}>
          <i className="material-icons">play_arrow</i>
        </div>
        
        {isNsfw && (
          <div className={browserStyles.browserContentItemNsfw}>
            <i className="material-icons">visibility_off</i>NSFW
          </div>
        )}
      </div>
      
      <div className={browserStyles.browserContentItemTitle}>{title}</div>
      
      <div className={browserStyles.browserContentItemInfo}>
        <div className={browserStyles.browserContentItemUser}>
          <span>{username}</span>
        </div>
        <div className={browserStyles.browserContentItemInfoReport}>
          <span className={browserStyles.browserContentItemInfoReportText}>Report</span>
          <i className="material-icons">report_problem</i>
        </div>
      </div>
    </div>
  );
}

// ============================================
// VIDEO PLAYER COMPONENT EXAMPLE
// ============================================
export function VideoPlayer({ src, poster, isLoading }) {
  return (
    <div className={playerStyles.playerContainer}>
      <video 
        className={playerStyles.player}
        src={src}
        poster={poster}
      />
      
      <div className={playerStyles.controls}>
        <div className={playerStyles.progressHolder}>
          <div className={playerStyles.buffered} />
          <div className={playerStyles.progress} />
          <div className={playerStyles.progressOrb}>
            <div className={playerStyles.progressOrbChild} />
          </div>
        </div>
        
        <div className={playerStyles.controlsLeft}>
          <div className={`${playerStyles.playerButton} material-icons`}>
            pause
          </div>
          <div className={playerStyles.volumeWrap}>
            <div className={`${playerStyles.playerButton} material-icons`}>
              volume_down
            </div>
            <span className={playerStyles.volumeCount}>100</span>
            <div className={`${playerStyles.playerButton} material-icons`}>
              volume_up
            </div>
          </div>
          <div className={playerStyles.progressTime}>0:00 / 0:00</div>
        </div>
        
        <div className={playerStyles.controlsRight}>
          <div className={`${playerStyles.playerButton} material-icons`}>
            fullscreen
          </div>
        </div>
      </div>
      
      {isLoading && (
        <div className={`${loaderStyles.loaderContainer} ${loaderStyles.visible}`}>
          <div className={`${loaderStyles.loader} ${loaderStyles.loaderOne}`} />
          <div className={`${loaderStyles.loader} ${loaderStyles.loaderTwo}`} />
          <div className={`${loaderStyles.loader} ${loaderStyles.loaderThree}`} />
        </div>
      )}
    </div>
  );
}

// ============================================
// TOGGLE SWITCH COMPONENT EXAMPLE
// ============================================
export function ToggleSwitch({ id, label, checked, onChange }) {
  return (
    <div className={buttonStyles.buttonToggleParent}>
      <div className={buttonStyles.buttonToggleLabel}>{label}</div>
      <input 
        id={id}
        type="checkbox" 
        checked={checked}
        onChange={onChange}
        className={buttonStyles.buttonToggle}
      />
      <label htmlFor={id}></label>
    </div>
  );
}

// ============================================
// SIGNUP PAGE EXAMPLE
// ============================================
export function SignupPage({ currentStep = 1 }) {
  return (
    <div className={`${signupStyles.signup} ${signupStyles.active}`}>
      {/* Progress Bar */}
      <div className={signupStyles.signupProgress}>
        <div 
          className={signupStyles.signupProgressBar} 
          style={{ width: `${(currentStep / 3) * 100}%` }}
        />
        <div className={`${signupStyles.signupProgressLabel} ${currentStep >= 1 ? signupStyles.active : ''}`}>
          <i className="material-icons">account_circle</i>
          Create an Account
        </div>
        <div className={`${signupStyles.signupProgressLabel} ${currentStep >= 2 ? signupStyles.active : ''}`}>
          <i className="material-icons">format_paint</i>
          Personalize
        </div>
        <div className={`${signupStyles.signupProgressLabel} ${currentStep >= 3 ? signupStyles.active : ''}`}>
          <i className="material-icons">check_circle</i>
          Finish
        </div>
      </div>
      
      {/* Navigation Buttons */}
      <FloatButton icon="close" label="Close" labelPosition="bottom" />
      <FloatButton icon="navigate_next" label="Next" labelPosition="bottom" />
      
      {/* Page Content */}
      <div className={`${signupStyles.signupPage} ${signupStyles.active}`}>
        <div className={signupStyles.signupTitle}>Create an Account</div>
        <div className={signupStyles.signupDesc}>
          Choose a username and login method.
        </div>
        {/* ... rest of signup content */}
      </div>
    </div>
  );
}

export default {
  Button,
  FloatButton,
  Titlebar,
  Slideout,
  ColorPicker,
  BrowserContentItem,
  VideoPlayer,
  ToggleSwitch,
  SignupPage
};
