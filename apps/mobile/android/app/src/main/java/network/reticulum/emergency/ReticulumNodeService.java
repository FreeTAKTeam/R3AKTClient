package network.reticulum.emergency;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.os.Binder;
import android.os.Build;
import android.os.IBinder;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.ServiceCompat;
import androidx.core.content.ContextCompat;

public class ReticulumNodeService extends Service {
    public static final String ACTION_PREPARE_FOREGROUND =
            "network.reticulum.emergency.action.PREPARE_FOREGROUND";
    public static final String ACTION_START_NODE =
            "network.reticulum.emergency.action.START_NODE";
    public static final String ACTION_STOP_NODE =
            "network.reticulum.emergency.action.STOP_NODE";
    public static final String ACTION_RESTART_NODE =
            "network.reticulum.emergency.action.RESTART_NODE";

    private static final String EXTRA_CONFIG_JSON = "configJson";
    private static final String PREFS_FILE = "reticulum_node_service";
    private static final String PREF_SHOULD_RESTORE = "should_restore_runtime";
    private static final String PREF_LAST_CONFIG_JSON = "last_config_json";
    private static final String NOTIFICATION_CHANNEL_ID = "reticulum_node_runtime";
    private static final int NOTIFICATION_ID = 1207;

    static void ensureServiceCreated(Context context) {
        if (context == null) {
            return;
        }
        Intent serviceIntent = new Intent(context, ReticulumNodeService.class);
        try {
            context.startService(serviceIntent);
        } catch (Exception ignored) {
            // If app is background restricted, binding may still start service as needed.
        }
    }

    static void requestForegroundHost(Context context) {
        if (context == null) {
            return;
        }
        Intent intent = new Intent(context, ReticulumNodeService.class);
        intent.setAction(ACTION_PREPARE_FOREGROUND);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ContextCompat.startForegroundService(context, intent);
        } else {
            context.startService(intent);
        }
    }

    private final IBinder binder = new LocalBinder();
    private final NodeServiceManager.Listener internalListener = new NodeServiceManager.Listener() {
        @Override
        public void onServiceStateChanged(NodeServiceManager.ServiceStatusSnapshot status) {
            synchronizeForegroundNotification(status);
        }

        @Override
        public void onNodeEvent(String eventEnvelopeJson) {
            // Node event fan-out is handled by plugin listeners.
        }
    };

    private NodeServiceManager nodeManager;
    private NotificationManagerCompat notificationManager;
    private boolean foregroundActive = false;

    public final class LocalBinder extends Binder {
        ReticulumNodeService getService() {
            return ReticulumNodeService.this;
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        nodeManager = new NodeServiceManager();
        notificationManager = NotificationManagerCompat.from(this);
        createNotificationChannel();
        nodeManager.addListener(internalListener, false);
        nodeManager.markCreated();
        nodeManager.setLastKnownConfigJson(readLastConfigJson());
    }

    @Override
    public IBinder onBind(Intent intent) {
        return binder;
    }

    @Override
    public boolean onUnbind(Intent intent) {
        return true;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;
        if (ACTION_PREPARE_FOREGROUND.equals(action)) {
            promoteToForegroundHost();
            return START_STICKY;
        }
        if (ACTION_STOP_NODE.equals(action)) {
            stopNode();
            return START_STICKY;
        }
        if (ACTION_RESTART_NODE.equals(action)) {
            String config = readLastConfigJson();
            if (config.isEmpty()) {
                nodeManager.reportServiceError(
                        "MissingNodeConfig",
                        "Cannot restart node: no previous runtime configuration exists.",
                        foregroundActive
                );
            } else {
                restartNode(config);
            }
            return START_STICKY;
        }
        if (ACTION_START_NODE.equals(action)) {
            String config = intent != null ? intent.getStringExtra(EXTRA_CONFIG_JSON) : null;
            if (config == null || config.isEmpty()) {
                config = readLastConfigJson();
            }
            if (config == null || config.isEmpty()) {
                nodeManager.reportServiceError(
                        "MissingNodeConfig",
                        "Cannot start node: runtime configuration is required.",
                        foregroundActive
                );
            } else {
                startNode(config);
            }
            return START_STICKY;
        }

        if (shouldRestoreRuntime() && !readLastConfigJson().isEmpty()) {
            startNode(readLastConfigJson());
        }
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        nodeManager.removeListener(internalListener);
        nodeManager.shutdown();
        super.onDestroy();
    }

    public void addListener(NodeServiceManager.Listener listener, boolean replayLatest) {
        nodeManager.addListener(listener, replayLatest);
    }

    public void removeListener(NodeServiceManager.Listener listener) {
        nodeManager.removeListener(listener);
    }

    public int startNode(String configJson) {
        promoteToForegroundHost();
        int result = nodeManager.startNode(configJson);
        if (result == 0) {
            persistRuntimeRestoreState(true, configJson);
        }
        return result;
    }

    public int stopNode() {
        int result = nodeManager.stopNode();
        if (result == 0) {
            persistRuntimeRestoreState(false, nodeManager.getLastKnownConfigJson());
            synchronizeForegroundNotification(nodeManager.getServiceStatus());
            stopSelf();
        }
        return result;
    }

    public int restartNode(String configJson) {
        promoteToForegroundHost();
        int result = nodeManager.restartNode(configJson);
        if (result == 0) {
            persistRuntimeRestoreState(true, configJson);
        }
        return result;
    }

    public String getStatusJson() {
        return nodeManager.getStatusJson();
    }

    public String getServiceStatusJson() {
        return nodeManager.getServiceStatusJson();
    }

    public NodeServiceManager.ServiceStatusSnapshot getServiceStatus() {
        return nodeManager.getServiceStatus();
    }

    public int connectPeer(String destinationHex) {
        return nodeManager.connectPeer(destinationHex);
    }

    public int disconnectPeer(String destinationHex) {
        return nodeManager.disconnectPeer(destinationHex);
    }

    public int sendJson(String payloadJson) {
        return nodeManager.sendJson(payloadJson);
    }

    public int broadcastBase64(String bytesBase64) {
        return nodeManager.broadcastBase64(bytesBase64);
    }

    public int setAnnounceCapabilities(String capabilityString) {
        return nodeManager.setAnnounceCapabilities(capabilityString);
    }

    public int setLogLevel(String levelString) {
        return nodeManager.setLogLevel(levelString);
    }

    public int refreshHubDirectory() {
        return nodeManager.refreshHubDirectory();
    }

    public String executeEnvelope(String envelopeJson) {
        return nodeManager.executeEnvelope(envelopeJson);
    }

    public String getLastErrorJson() {
        return nodeManager.getLastErrorJson();
    }

    private void promoteToForegroundHost() {
        nodeManager.markForeground();
        Notification notification = buildNotification(nodeManager.getServiceStatus());
        ServiceCompat.startForeground(
                this,
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
        );
        foregroundActive = true;
    }

    private void demoteForegroundHost() {
        if (!foregroundActive) {
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE);
        } else {
            stopForeground(true);
        }
        notificationManager.cancel(NOTIFICATION_ID);
        foregroundActive = false;
    }

    private void synchronizeForegroundNotification(NodeServiceManager.ServiceStatusSnapshot status) {
        boolean shouldRunForeground =
                status.isForeground()
                        || status.isRunning()
                        || status.getState() == NodeServiceManager.ServiceState.Stopping
                        || status.getState() == NodeServiceManager.ServiceState.Error;
        if (!shouldRunForeground) {
            demoteForegroundHost();
            return;
        }

        Notification notification = buildNotification(status);
        if (foregroundActive) {
            notificationManager.notify(NOTIFICATION_ID, notification);
            return;
        }

        ServiceCompat.startForeground(
                this,
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
        );
        foregroundActive = true;
    }

    private Notification buildNotification(NodeServiceManager.ServiceStatusSnapshot status) {
        NotificationCompat.Builder builder = new NotificationCompat.Builder(
                this,
                NOTIFICATION_CHANNEL_ID
        )
                .setSmallIcon(android.R.drawable.stat_notify_sync)
                .setContentTitle(getString(R.string.node_service_notification_title))
                .setContentText(resolveNotificationStateText(status))
                .setOnlyAlertOnce(true)
                .setOngoing(status.isRunning() || status.isForeground())
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_SERVICE);

        PendingIntent stopIntent = PendingIntent.getService(
                this,
                1001,
                buildActionIntent(ACTION_STOP_NODE, null),
                pendingIntentFlags()
        );
        builder.addAction(
                android.R.drawable.ic_menu_close_clear_cancel,
                getString(R.string.node_service_notification_action_stop),
                stopIntent
        );

        if (!readLastConfigJson().isEmpty()) {
            PendingIntent restartIntent = PendingIntent.getService(
                    this,
                    1002,
                    buildActionIntent(ACTION_RESTART_NODE, null),
                    pendingIntentFlags()
            );
            builder.addAction(
                    android.R.drawable.ic_popup_sync,
                    getString(R.string.node_service_notification_action_restart),
                    restartIntent
            );
        }

        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (launchIntent != null) {
            PendingIntent openAppIntent = PendingIntent.getActivity(
                    this,
                    1003,
                    launchIntent,
                    pendingIntentFlags()
            );
            builder.setContentIntent(openAppIntent);
        }

        return builder.build();
    }

    private String resolveNotificationStateText(NodeServiceManager.ServiceStatusSnapshot status) {
        switch (status.getState()) {
            case Running:
                return getString(R.string.node_service_notification_state_running);
            case Foreground:
                return getString(R.string.node_service_notification_state_foreground);
            case Stopping:
                return getString(R.string.node_service_notification_state_stopping);
            case Stopped:
                return getString(R.string.node_service_notification_state_stopped);
            case Error:
                String message = status.getLastErrorMessage();
                if (message == null || message.isEmpty()) {
                    return getString(R.string.node_service_notification_state_error);
                }
                return getString(R.string.node_service_notification_state_error_with_message, message);
            case Created:
            default:
                return getString(R.string.node_service_notification_state_created);
        }
    }

    private Intent buildActionIntent(String action, String configJson) {
        Intent intent = new Intent(this, ReticulumNodeService.class);
        intent.setAction(action);
        if (configJson != null && !configJson.isEmpty()) {
            intent.putExtra(EXTRA_CONFIG_JSON, configJson);
        }
        return intent;
    }

    private int pendingIntentFlags() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT;
        }
        return PendingIntent.FLAG_UPDATE_CURRENT;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager == null) {
            return;
        }

        NotificationChannel channel = new NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                getString(R.string.node_service_notification_channel_name),
                NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription(getString(R.string.node_service_notification_channel_description));
        manager.createNotificationChannel(channel);
    }

    private SharedPreferences getRuntimePrefs() {
        return getSharedPreferences(PREFS_FILE, MODE_PRIVATE);
    }

    private void persistRuntimeRestoreState(boolean shouldRestore, String configJson) {
        String safeConfig = configJson == null ? "" : configJson;
        getRuntimePrefs()
                .edit()
                .putBoolean(PREF_SHOULD_RESTORE, shouldRestore)
                .putString(PREF_LAST_CONFIG_JSON, safeConfig)
                .apply();
        nodeManager.setLastKnownConfigJson(safeConfig);
    }

    private boolean shouldRestoreRuntime() {
        return getRuntimePrefs().getBoolean(PREF_SHOULD_RESTORE, false);
    }

    private String readLastConfigJson() {
        return getRuntimePrefs().getString(PREF_LAST_CONFIG_JSON, "");
    }
}
