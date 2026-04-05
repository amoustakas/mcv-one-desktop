import { useNotificationStore } from '../../stores/notifications';

// ---------------------------------------------------------------------------
// Kit Notification Helpers
// ---------------------------------------------------------------------------
// Bridges kit execution events to the app's notification system.

/** Notify that a kit tool completed successfully */
export function notifyToolSuccess(kitName: string, toolName: string, ventureId?: string): void {
  useNotificationStore.getState().addNotification({
    type: 'success',
    title: `${toolName.replace(/_/g, ' ')}`,
    description: `${kitName} completed successfully`,
    source: 'kit',
    ventureId,
  });
}

/** Notify that a kit tool failed */
export function notifyToolError(kitName: string, toolName: string, error: string, ventureId?: string): void {
  useNotificationStore.getState().addNotification({
    type: 'error',
    title: `${toolName.replace(/_/g, ' ')} failed`,
    description: `${kitName}: ${error}`,
    source: 'kit',
    ventureId,
  });
}

/** Notify that a kit was installed */
export function notifyKitInstalled(kitName: string): void {
  useNotificationStore.getState().addNotification({
    type: 'info',
    title: 'Kit Installed',
    description: `${kitName} is now available`,
    source: 'kit',
  });
}

/** Notify that a kit was uninstalled */
export function notifyKitUninstalled(kitName: string): void {
  useNotificationStore.getState().addNotification({
    type: 'info',
    title: 'Kit Removed',
    description: `${kitName} has been uninstalled`,
    source: 'kit',
  });
}
