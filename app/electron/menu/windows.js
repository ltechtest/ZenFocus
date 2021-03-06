import { shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import settings from 'electron-settings';
import { releaseNotes, setFullAppMode } from '../utils';
import repo from '../../package.json';
import {
  LOAD_SETTINGS,
  SEND_GIVE_FEEDBACK,
  SEND_NEW_SESSION,
  SEND_RESET_ROUND,
  SEND_TOGGLE_COMPACT,
  SEND_TOGGLE_WELCOME
} from '../events';

export default function buildWindowsMenu(win) {
  return [
    {
      label: '&File',
      submenu: [
        {
          label: '&New Session',
          accelerator: 'Ctrl+N',
          click() {
            win.webContents.send(SEND_NEW_SESSION);
          }
        },
        {
          label: '&Reset Round',
          click() {
            win.webContents.send(SEND_RESET_ROUND);
          }
        },
        {
          type: 'separator'
        },
        {
          label: '&Settings',
          click() {
            setFullAppMode(win);
            win.webContents.send(LOAD_SETTINGS);
          }
        },
        {
          label: '&Quit',
          accelerator: 'Ctrl+W',
          click() {
            win.close();
          }
        }
      ]
    },
    {
      label: '&View',
      submenu: process.env.NODE_ENV === 'development'
        ? [
          {
            label: '&Reload',
            accelerator: 'Ctrl+R',
            click() {
              win.webContents.reload();
            }
          },
          {
            label: 'Toggle &Full Screen',
            accelerator: 'F11',
            click() {
              win.setFullScreen(!win.isFullScreen());
            }
          },
          {
            label: 'Toggle &Developer Tools',
            accelerator: 'Alt+Ctrl+I',
            click() {
              win.toggleDevTools();
            }
          }
        ]
        : [
          {
            label: 'Toggle &Full Screen',
            accelerator: 'F11',
            click() {
              win.setFullScreen(!win.isFullScreen());
            }
          }
        ]
    },
    {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'Ctrl+M',
          selector: 'performMiniaturize:'
        },
        { label: 'Close', accelerator: 'Ctrl+W', selector: 'performClose:' },
        { type: 'separator' },
        {
          label: 'Toggle Compact Mode',
          accelerator: 'Shift+Ctrl+M',
          click() {
            win.webContents.send(SEND_TOGGLE_COMPACT);
          }
        },
        { type: 'separator' },
        { label: 'Bring All to Front', selector: 'arrangeInFront:' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Welcome',
          click() {
            setFullAppMode(win);
            win.webContents.send(SEND_TOGGLE_WELCOME);
          }
        },
        {
          label: 'Learn More',
          click() {
            shell.openExternal(repo.repository.url);
          }
        },
        {
          label: 'Documentation',
          click() {
            shell.openExternal(repo.readme);
          }
        },
        {
          label: 'Release Notes',
          click() {
            const version = settings.get('version');
            releaseNotes(version);
          }
        },
        { type: 'separator' },
        {
          label: 'Search Issues',
          click() {
            shell.openExternal(repo.bugs.url);
          }
        },
        {
          label: 'Provide Feedback',
          click() {
            setFullAppMode(win);
            win.webContents.send(SEND_GIVE_FEEDBACK, 'feedback');
          }
        },
        {
          label: 'Report Issue',
          click() {
            setFullAppMode(win);
            win.webContents.send(SEND_GIVE_FEEDBACK, 'issue');
          }
        },
        { type: 'separator' },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Ctrl+Shift+J',
          click() {
            win.toggleDevTools();
          }
        },
        { type: 'separator' },
        {
          label: 'Check for Updates...',
          click() {
            setFullAppMode(win);
            autoUpdater.checkForUpdates();
          }
        }
      ]
    }
  ];
}
