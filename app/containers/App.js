import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import classNames from 'classnames';
import settings from 'electron-settings';
import { Alert, Button, Intent } from '@blueprintjs/core';
import Feedback from '../components/common/Feedback';
import UpdateAlert from '../components/common/UpdateAlert';
import WelcomeSlides from '../components/common/WelcomeSlides';
import {
  LOAD_CHARTS,
  LOAD_SETTINGS,
  ON_ACCEPT_UPDATE,
  SEND_CHECKING_FOR_UPDATES,
  SEND_ERROR,
  SEND_GENERAL_ALERT,
  SEND_GIVE_FEEDBACK,
  SEND_NEEDS_UPDATE,
  SEND_REPORT_ISSUE
} from '../electron/events';
import {
  setAppSettings,
  setElectronSettings,
  setTheme
} from '../actions';
import {
  loadRoundsData
} from '../components/common/Rounds/actions';
import {
  Phases
} from '../components/common/CountdownTimer/enums';
import {
  Themes
} from '../enums';
import OverlaySpinner from '../components/common/OverlaySpinner';

class App extends PureComponent {
  constructor() {
    super();
    this.state = {
      checkingForUpdates: false,
      generalAlertMsg: '',
      hasError: false,
      isDownloading: false,
      needsUpdate: false,
      showFeedback: false,
      showGeneralAlert: false,
      errorMsg: '',
      url: '',
      version: ''
    };
  }

  componentWillMount() {
    const { pushRoute } = this.props;
    ipcRenderer.on(LOAD_CHARTS, () => pushRoute('/charts'));
    ipcRenderer.on(LOAD_SETTINGS, () => pushRoute('/settings'));
    ipcRenderer.on(SEND_CHECKING_FOR_UPDATES, () => this.showCheckingForUpdates());
    ipcRenderer.on(SEND_ERROR, (e, msg) => this.showError(msg));
    ipcRenderer.on(SEND_GENERAL_ALERT, (e, msg) => this.showGeneralAlert(msg));
    ipcRenderer.on(SEND_GIVE_FEEDBACK, () => this.showSurvey('feedback'));
    ipcRenderer.on(SEND_NEEDS_UPDATE, (e, version) => {
      this.setState({ version, needsUpdate: true });
    });
    ipcRenderer.on(SEND_REPORT_ISSUE, () => this.showSurvey('issue'));
    this.loadSavedData();
  }

  showCheckingForUpdates() {
    this.setState({ checkingForUpdates: true });
  }

  showDownloadProgress() {
    this.setState({
      checkingForUpdates: false,
      isDownloading: true
    });
  }

  showGeneralAlert(msg) {
    this.setState({
      generalAlertMsg: msg,
      checkingForUpdates: false,
      isDownloading: false,
      needsUpdate: false,
      showGeneralAlert: true
    });
  }

  showError(message) {
    this.setState({
      errorMsg: message,
      checkingForUpdates: false,
      isDownloading: false,
      hasError: true,
      needsUpdate: false,
      showGeneralAlert: false,
    });
  }

  hideError() {
    this.setState({ hasError: false });
  }

  loadSavedData() {
    const {
      loadRoundsData: loadRounds,
      setAppSettings: setSettings,
      setTheme: setAppTheme
    } = this.props;
    const {
      rounds = {},
      styles = {},
      system = {}
    } = settings.getAll();

    loadRounds(rounds);
    setSettings(system);
    setAppTheme(styles.theme);
  }

  showSurvey(type) {
    const url = type === 'feedback'
      ? 'https://docs.google.com/forms/d/e/1FAIpQLSccbcfGtY6MpQeRM2hYQ-Xzji6TDKnG9Mcr_1fluDQCU0JoTA/viewform?embedded=true'
      : 'https://docs.google.com/forms/d/e/1FAIpQLSc498W0BqVHGhhb_A9WyxrHGfbMeynnuEXa5NYpjMD9nDQpng/viewform?embedded=true';

    this.setState({
      showFeedback: true,
      url
    });
  }

  onRestartLater() {
    this.setState({ needsUpdate: false });
  }

  onGeneralAlertConfirm() {
    this.setState({ showGeneralAlert: false });
  }

  closeFeedback() {
    this.setState({ showFeedback: false });
  }

  render() {
    const {
      currentPhase,
      showWelcomeSlides,
      theme,
      pushRoute,
      setAppSettings: setSettingsOnApp,
      setElectronSettings: setSettingsOnElectron
    } = this.props;
    const {
      checkingForUpdates,
      errorMsg,
      generalAlertMsg,
      hasError,
      isDownloading,
      needsUpdate,
      showFeedback,
      showGeneralAlert,
      url,
      version
    } = this.state;

    const mainClass = classNames({
      'pt-dark': theme === Themes.DARK
    });

    const buttonClass = classNames({
      'pt-minimal': true,
      'btn-phase': true,
      'w-100': true,
      'bg-focus-phase': currentPhase === 0,
      'bg-break-phase': currentPhase !== 0
    });

    return (
      <main className={mainClass}>
        <Button
          text={Phases[currentPhase]}
          onClick={() => pushRoute('/')}
          className={buttonClass}
        />
        {this.props.children}

        {/* Welcome Screen */}
        <WelcomeSlides
          showWelcomeSlides={showWelcomeSlides}
          setAppSettings={setSettingsOnApp}
          setSettingsOnElectron={setSettingsOnElectron}
        />

        {/* Feedback */}
        <Feedback
          showFeedback={showFeedback}
          closeFeedback={() => this.closeFeedback()}
          url={url}
        />

        {/* Update Alert */}
        <UpdateAlert
          needsUpdate={needsUpdate}
          version={version}
          onRestartLater={() => this.onRestartLater()}
          onRestartNow={() => {
            this.showDownloadProgress();
            ipcRenderer.send(ON_ACCEPT_UPDATE);
          }}
        />

        {/* Downloading */}
        <OverlaySpinner isOpen={isDownloading}>
          Downloading updates...
        </OverlaySpinner>

        {/* Checking for Updates */}
        <OverlaySpinner isOpen={checkingForUpdates}>
          Checking for updates...
        </OverlaySpinner>

        {/* Error Alert */}
        <Alert
          isOpen={hasError}
          intent={Intent.DANGER}
          cancelButtonText="Cancel"
          confirmButtonText="Report"
          onCancel={() => this.hideError()}
          onConfirm={() => {
            this.hideError();
            this.showSurvey('issue');
          }}
        >
          Oops. {errorMsg || 'Something went wrong.'} Please report this error.
        </Alert>

        {/* General Alert Message */}
        <Alert
          isOpen={showGeneralAlert}
          intent={Intent.SUCCESS}
          onConfirm={() => this.onGeneralAlertConfirm()}
        >
          {generalAlertMsg}
        </Alert>
      </main>
    );
  }
}

App.propTypes = {
  children: PropTypes.element.isRequired,
  currentPhase: PropTypes.number.isRequired,
  loadRoundsData: PropTypes.func.isRequired,
  showWelcomeSlides: PropTypes.bool.isRequired,
  theme: PropTypes.string.isRequired,
  pushRoute: PropTypes.func.isRequired,
  setAppSettings: PropTypes.func.isRequired,
  setElectronSettings: PropTypes.func.isRequired,
  setTheme: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  currentPhase: state.rounds.currentPhase,
  showWelcomeSlides: state.app.showWelcomeSlides,
  theme: state.app.theme
});

const mapDispatchToProps = (dispatch) => ({
  loadRoundsData: (data) => dispatch(loadRoundsData(data)),
  pushRoute: (route) => dispatch(push(route)),
  setAppSettings: (data) => dispatch(setAppSettings(data)),
  setElectronSettings: (keypath, val) => dispatch(setElectronSettings(keypath, val)),
  setTheme: (theme) => dispatch(setTheme(theme))
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
