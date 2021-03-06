import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from '@blueprintjs/core';
import { hasReachedLastRound } from '../../utils/countdown-timer.util';
import { isLongBreak } from '../../utils/phases.util';

export default class MediaControls extends PureComponent {
  static propTypes = {
    compact: PropTypes.bool,
    currentRound: PropTypes.number.isRequired,
    currentPhase: PropTypes.number.isRequired,
    library: PropTypes.arrayOf(PropTypes.any),
    isPlaying: PropTypes.bool.isRequired,
    totalRounds: PropTypes.number.isRequired,
    goToNextPhase: PropTypes.func.isRequired,
    openGeneralAlert: PropTypes.func.isRequired,
    pause: PropTypes.func.isRequired,
    resetTimer: PropTypes.func.isRequired,
    resume: PropTypes.func.isRequired
  };

  componentWillMount() {
    window.addEventListener('keyup', this.onMediaControlKeyPress);
  }

  componentWillUnmount() {
    window.removeEventListener('keyup', this.onMediaControlKeyPress);
  }

  onMediaControlClick = () => {
    // NOTE: Clicking sets focus on the button which will cause
    // unexpected behavior because it will trigger both the key press
    // event and also the click event
    this.playBtn.buttonRef.blur();

    const { isPlaying, pause, resume } = this.props;
    if (isPlaying) pause();
    else resume();
  };

  onMediaControlKeyPress = e => {
    const { isPlaying, pause, resume } = this.props;
    if (e.key === ' ') {
      if (isPlaying) pause();
      else resume();
    }
  };

  openAlert = () => {
    const { openGeneralAlert, resetTimer } = this.props;
    openGeneralAlert(
      'Are you sure you want to redo the current phase?',
      resetTimer,
      { cancelText: 'Cancel' }
    );
  };

  render() {
    const {
      compact,
      currentPhase,
      currentRound,
      isPlaying,
      library,
      totalRounds,
      goToNextPhase
    } = this.props;

    const buttonStyles = classNames(
      'non-draggable',
      'pt-minimal',
      'btn-no-hover',
      'btn-no-bg',
      {
        'pt-large': !compact,
        'white-btn': compact && !isLongBreak(currentPhase),
        'black-btn': compact && isLongBreak(currentPhase)
      }
    );

    return (
      <section>
        <Button
          iconName="redo"
          onClick={this.openAlert}
          className={buttonStyles}
        />
        <Button
          ref={p => { this.playBtn = p; }}
          active={isPlaying}
          iconName={isPlaying ? 'pause' : 'play'}
          onClick={this.onMediaControlClick}
          className={classNames(buttonStyles, 'mx-3')}
        />
        <Button
          iconName="step-forward"
          disabled={hasReachedLastRound(
            currentPhase,
            currentRound,
            totalRounds
          )}
          onClick={() => {
            library.forEach(sound => sound.pause());
            goToNextPhase();
          }}
          className={buttonStyles}
        />
      </section>
    );
  }
}
