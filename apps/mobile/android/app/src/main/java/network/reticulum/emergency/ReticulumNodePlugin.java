package network.reticulum.emergency;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

import com.getcapacitor.JSObject;
import com.getcapacitor.Logger;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import org.json.JSONException;

@CapacitorPlugin(name = "ReticulumNode")
public class ReticulumNodePlugin extends Plugin {
    private static final String TAG = "ReticulumNode";
    private static final long SERVICE_BIND_TIMEOUT_MS = 4_000L;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final Object serviceLock = new Object();

    private ReticulumNodeService boundService;
    private CountDownLatch bindLatch;
    private boolean bindingRequested = false;

    private final NodeServiceManager.Listener serviceListener = new NodeServiceManager.Listener() {
        @Override
        public void onServiceStateChanged(NodeServiceManager.ServiceStatusSnapshot status) {
            emitServiceState(status.toJsonString());
        }

        @Override
        public void onNodeEvent(String eventEnvelopeJson) {
            emitNodeEvent(eventEnvelopeJson);
        }
    };

    private final ServiceConnection serviceConnection = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName name, IBinder service) {
            if (!(service instanceof ReticulumNodeService.LocalBinder)) {
                signalBindCompleted(null);
                return;
            }

            ReticulumNodeService.LocalBinder binder = (ReticulumNodeService.LocalBinder) service;
            ReticulumNodeService resolvedService = binder.getService();
            signalBindCompleted(resolvedService);
            resolvedService.addListener(serviceListener, true);
            emitCurrentSnapshots(resolvedService);
            Logger.info(TAG, "ReticulumNode service connected.");
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            ReticulumNodeService serviceSnapshot;
            synchronized (serviceLock) {
                serviceSnapshot = boundService;
                boundService = null;
                bindingRequested = false;
                if (bindLatch != null) {
                    bindLatch.countDown();
                }
            }
            if (serviceSnapshot != null) {
                serviceSnapshot.removeListener(serviceListener);
            }
            emitSyntheticServiceState(
                    NodeServiceManager.ServiceState.Stopped.name(),
                    false,
                    false,
                    "ServiceDisconnected",
                    "Node service disconnected unexpectedly."
            );
            Logger.warn(TAG, "ReticulumNode service disconnected.");
        }
    };

    @Override
    public void load() {
        super.load();
        Logger.info(TAG, "ReticulumNode plugin loaded.");
        bindService(false);
    }

    @Override
    protected void handleOnDestroy() {
        unbindService();
        super.handleOnDestroy();
    }

    @PluginMethod
    public void startNode(PluginCall call) {
        JSObject config = call.getObject("config", new JSObject());
        normalizeConfig(config);
        ReticulumNodeService.requestForegroundHost(getContext());
        ReticulumNodeService service = requireService(call, true, "ServiceUnavailable", "Node service is unavailable.");
        if (service == null) {
            return;
        }

        int result = service.startNode(config.toString());
        if (result != 0) {
            rejectFromService(call, service, "NodeStartFailed", "Failed to start native Reticulum node.");
            return;
        }
        call.resolve();
    }

    @PluginMethod
    public void stopNode(PluginCall call) {
        ReticulumNodeService service = requireService(call, false, "ServiceUnavailable", "Node service is unavailable.");
        if (service == null) {
            return;
        }

        int result = service.stopNode();
        if (result != 0) {
            rejectFromService(call, service, "NodeStopFailed", "Failed to stop native Reticulum node.");
            return;
        }
        call.resolve();
    }

    @PluginMethod
    public void restartNode(PluginCall call) {
        JSObject config = call.getObject("config", new JSObject());
        normalizeConfig(config);
        ReticulumNodeService.requestForegroundHost(getContext());
        ReticulumNodeService service = requireService(call, true, "ServiceUnavailable", "Node service is unavailable.");
        if (service == null) {
            return;
        }

        int result = service.restartNode(config.toString());
        if (result != 0) {
            rejectFromService(call, service, "NodeRestartFailed", "Failed to restart native Reticulum node.");
            return;
        }
        call.resolve();
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        ReticulumNodeService service = requireService(call, false, "ServiceUnavailable", "Node service is unavailable.");
        if (service == null) {
            return;
        }

        String raw = service.getStatusJson();
        if (raw == null || raw.isEmpty()) {
            rejectFromService(call, service, "StatusUnavailable", "Failed to fetch node status.");
            return;
        }

        try {
            call.resolve(new JSObject(raw));
        } catch (JSONException ex) {
            call.reject("Native status JSON parse failed.", ex);
        }
    }

    @PluginMethod
    public void getServiceStatus(PluginCall call) {
        ReticulumNodeService service = requireService(call, false, "ServiceUnavailable", "Node service is unavailable.");
        if (service == null) {
            return;
        }

        String raw = service.getServiceStatusJson();
        if (raw == null || raw.isEmpty()) {
            rejectWithCode(call, "ServiceStatusUnavailable", "Failed to fetch service status.");
            return;
        }

        try {
            call.resolve(new JSObject(raw));
        } catch (JSONException ex) {
            call.reject("Service status JSON parse failed.", ex);
        }
    }

    @PluginMethod
    public void connectPeer(PluginCall call) {
        String destinationHex = call.getString("destinationHex");
        if (destinationHex == null || destinationHex.isEmpty()) {
            rejectWithCode(call, "InvalidArgs", "destinationHex is required.");
            return;
        }

        ReticulumNodeService service = requireService(call, false, "ServiceUnavailable", "Node service is unavailable.");
        if (service == null) {
            return;
        }

        int result = service.connectPeer(destinationHex);
        if (result != 0) {
            rejectFromService(call, service, "PeerConnectFailed", "Failed to connect peer.");
            return;
        }
        call.resolve();
    }

    @PluginMethod
    public void disconnectPeer(PluginCall call) {
        String destinationHex = call.getString("destinationHex");
        if (destinationHex == null || destinationHex.isEmpty()) {
            rejectWithCode(call, "InvalidArgs", "destinationHex is required.");
            return;
        }

        ReticulumNodeService service = requireService(call, false, "ServiceUnavailable", "Node service is unavailable.");
        if (service == null) {
            return;
        }

        int result = service.disconnectPeer(destinationHex);
        if (result != 0) {
            rejectFromService(call, service, "PeerDisconnectFailed", "Failed to disconnect peer.");
            return;
        }
        call.resolve();
    }

    @PluginMethod
    public void send(PluginCall call) {
        String destinationHex = call.getString("destinationHex");
        String bytesBase64 = call.getString("bytesBase64");
        if (destinationHex == null || destinationHex.isEmpty()) {
            rejectWithCode(call, "InvalidArgs", "destinationHex is required.");
            return;
        }
        if (bytesBase64 == null) {
            rejectWithCode(call, "InvalidArgs", "bytesBase64 is required.");
            return;
        }

        ReticulumNodeService service = requireService(call, false, "ServiceUnavailable", "Node service is unavailable.");
        if (service == null) {
            return;
        }

        JSObject payload = new JSObject();
        payload.put("destinationHex", destinationHex);
        payload.put("bytesBase64", bytesBase64);

        int result = service.sendJson(payload.toString());
        if (result != 0) {
            rejectFromService(call, service, "PacketSendFailed", "Failed to send bytes.");
            return;
        }
        call.resolve();
    }

    @PluginMethod
    public void broadcast(PluginCall call) {
        String bytesBase64 = call.getString("bytesBase64");
        if (bytesBase64 == null) {
            rejectWithCode(call, "InvalidArgs", "bytesBase64 is required.");
            return;
        }

        ReticulumNodeService service = requireService(call, false, "ServiceUnavailable", "Node service is unavailable.");
        if (service == null) {
            return;
        }

        int result = service.broadcastBase64(bytesBase64);
        if (result != 0) {
            rejectFromService(call, service, "PacketBroadcastFailed", "Failed to broadcast bytes.");
            return;
        }
        call.resolve();
    }

    @PluginMethod
    public void setAnnounceCapabilities(PluginCall call) {
        String capabilityString = call.getString("capabilityString");
        if (capabilityString == null) {
            rejectWithCode(call, "InvalidArgs", "capabilityString is required.");
            return;
        }

        ReticulumNodeService service = requireService(call, false, "ServiceUnavailable", "Node service is unavailable.");
        if (service == null) {
            return;
        }

        int result = service.setAnnounceCapabilities(capabilityString);
        if (result != 0) {
            rejectFromService(call, service, "SetCapabilitiesFailed", "Failed to set announce capabilities.");
            return;
        }
        call.resolve();
    }

    @PluginMethod
    public void setLogLevel(PluginCall call) {
        String level = call.getString("level", "Info");
        ReticulumNodeService service = requireService(call, false, "ServiceUnavailable", "Node service is unavailable.");
        if (service == null) {
            return;
        }

        int result = service.setLogLevel(level);
        if (result != 0) {
            rejectFromService(call, service, "SetLogLevelFailed", "Failed to set log level.");
            return;
        }
        call.resolve();
    }

    @PluginMethod
    public void refreshHubDirectory(PluginCall call) {
        ReticulumNodeService service = requireService(call, false, "ServiceUnavailable", "Node service is unavailable.");
        if (service == null) {
            return;
        }

        int result = service.refreshHubDirectory();
        if (result != 0) {
            rejectFromService(call, service, "HubDirectoryRefreshFailed", "Failed to refresh hub directory.");
            return;
        }
        call.resolve();
    }

    @PluginMethod
    public void executeEnvelope(PluginCall call) {
        String envelopeJson = call.getString("envelopeJson");
        if (envelopeJson == null || envelopeJson.isEmpty()) {
            rejectWithCode(call, "InvalidArgs", "envelopeJson is required.");
            return;
        }

        ReticulumNodeService service = requireService(call, false, "ServiceUnavailable", "Node service is unavailable.");
        if (service == null) {
            return;
        }

        String responseJson;
        try {
            responseJson = service.executeEnvelope(envelopeJson);
        } catch (UnsatisfiedLinkError linkError) {
            Logger.error(TAG, "Native runtime linkage failed while executing envelope.", linkError);
            rejectWithCode(
                    call,
                    "NativeRuntimeUnavailable",
                    "Native runtime linkage failed while executing envelope."
            );
            return;
        } catch (Throwable throwable) {
            Logger.error(TAG, "Unexpected native execution failure.", throwable);
            rejectWithCode(call, "EnvelopeExecutionFailed", "Failed to execute message envelope.");
            return;
        }
        if (responseJson == null || responseJson.isEmpty()) {
            rejectFromService(
                    call,
                    service,
                    "EnvelopeExecutionFailed",
                    "Failed to execute message envelope."
            );
            return;
        }

        JSObject payload = new JSObject();
        payload.put("responseJson", responseJson);
        call.resolve(payload);
    }

    @PluginMethod
    public void getClientOperationCatalog(PluginCall call) {
        String catalogJson = ReticulumBridge.getClientOperationCatalogJson();
        if (catalogJson == null || catalogJson.isEmpty()) {
            rejectWithCode(call, "CatalogUnavailable", "Failed to load client operation catalog.");
            return;
        }

        JSObject payload = new JSObject();
        payload.put("catalogJson", catalogJson);
        call.resolve(payload);
    }

    @PluginMethod
    public void removeAllListeners(PluginCall call) {
        call.resolve();
    }

    private void bindService(boolean ensureCreated) {
        Context context = getContext();
        if (context == null) {
            return;
        }

        if (ensureCreated) {
            ReticulumNodeService.ensureServiceCreated(context);
        }

        synchronized (serviceLock) {
            if (boundService != null || bindingRequested) {
                return;
            }

            bindLatch = new CountDownLatch(1);
            Intent intent = new Intent(context, ReticulumNodeService.class);
            bindingRequested = context.bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE);
            if (!bindingRequested && bindLatch != null) {
                bindLatch.countDown();
            }
        }
    }

    private void unbindService() {
        Context context = getContext();
        ReticulumNodeService serviceSnapshot;
        boolean shouldUnbind;
        synchronized (serviceLock) {
            serviceSnapshot = boundService;
            boundService = null;
            shouldUnbind = bindingRequested || serviceSnapshot != null;
            bindingRequested = false;
            if (bindLatch != null) {
                bindLatch.countDown();
                bindLatch = null;
            }
        }

        if (serviceSnapshot != null) {
            serviceSnapshot.removeListener(serviceListener);
        }

        if (shouldUnbind && context != null) {
            try {
                context.unbindService(serviceConnection);
            } catch (IllegalArgumentException ignored) {
                // Service was already unbound.
            }
        }
    }

    private ReticulumNodeService requireService(
            PluginCall call,
            boolean ensureCreated,
            String errorCode,
            String fallbackMessage
    ) {
        bindService(ensureCreated);
        ReticulumNodeService service = boundService;
        if (service != null) {
            return service;
        }

        CountDownLatch latchSnapshot;
        synchronized (serviceLock) {
            latchSnapshot = bindLatch;
        }

        if (latchSnapshot != null) {
            try {
                latchSnapshot.await(SERVICE_BIND_TIMEOUT_MS, TimeUnit.MILLISECONDS);
            } catch (InterruptedException interruptedException) {
                Thread.currentThread().interrupt();
            }
        }

        service = boundService;
        if (service != null) {
            return service;
        }

        rejectWithCode(call, errorCode, fallbackMessage);
        return null;
    }

    private void signalBindCompleted(ReticulumNodeService service) {
        synchronized (serviceLock) {
            boundService = service;
            bindingRequested = false;
            if (bindLatch != null) {
                bindLatch.countDown();
            }
        }
    }

    private void emitCurrentSnapshots(ReticulumNodeService service) {
        emitServiceState(service.getServiceStatusJson());
        String statusJson = service.getStatusJson();
        if (statusJson == null || statusJson.isEmpty()) {
            return;
        }
        mainHandler.post(() -> {
            try {
                notifyListeners("statusChanged", new JSObject(statusJson));
            } catch (JSONException ex) {
                Logger.error(TAG, "Failed to emit status snapshot on service bind", ex);
            }
        });
    }

    private void emitNodeEvent(String eventEnvelopeJson) {
        if (eventEnvelopeJson == null || eventEnvelopeJson.isEmpty()) {
            return;
        }

        mainHandler.post(() -> {
            try {
                JSObject envelope = new JSObject(eventEnvelopeJson);
                String eventName = envelope.getString("event");
                JSObject payload = envelope.getJSObject("payload", new JSObject());
                if (eventName != null && !eventName.isEmpty()) {
                    notifyListeners(eventName, payload);
                }
            } catch (Exception ex) {
                Logger.error(TAG, "Failed to emit node event from service.", ex);
            }
        });
    }

    private void emitServiceState(String serviceStatusJson) {
        if (serviceStatusJson == null || serviceStatusJson.isEmpty()) {
            return;
        }

        mainHandler.post(() -> {
            try {
                notifyListeners("serviceStateChanged", new JSObject(serviceStatusJson));
            } catch (JSONException ex) {
                Logger.error(TAG, "Failed to emit service state change.", ex);
            }
        });
    }

    private void emitSyntheticServiceState(
            String state,
            boolean running,
            boolean foreground,
            String lastErrorCode,
            String lastErrorMessage
    ) {
        JSObject payload = new JSObject();
        payload.put("state", state);
        payload.put("running", running);
        payload.put("foreground", foreground);
        payload.put("updatedAtMs", System.currentTimeMillis());
        if (lastErrorCode != null && !lastErrorCode.isEmpty()) {
            payload.put("lastErrorCode", lastErrorCode);
        }
        if (lastErrorMessage != null && !lastErrorMessage.isEmpty()) {
            payload.put("lastErrorMessage", lastErrorMessage);
        }
        mainHandler.post(() -> notifyListeners("serviceStateChanged", payload));
    }

    private void rejectFromService(
            PluginCall call,
            ReticulumNodeService service,
            String fallbackCode,
            String fallbackMessage
    ) {
        String raw = service.getLastErrorJson();
        if (raw == null || raw.isEmpty()) {
            rejectWithCode(call, fallbackCode, fallbackMessage);
            return;
        }

        try {
            JSObject payload = new JSObject(raw);
            String code = payload.getString("code", fallbackCode);
            String message = payload.getString("message", fallbackMessage);
            call.reject(message, code);
        } catch (JSONException ex) {
            rejectWithCode(call, fallbackCode, fallbackMessage);
        }
    }

    private void rejectWithCode(PluginCall call, String code, String message) {
        call.reject(message, code);
    }

    private void normalizeConfig(JSObject config) {
        String rawStorageDir = config.getString("storageDir", "");
        String storageDir = rawStorageDir == null ? "" : rawStorageDir.trim();

        File filesDir = getContext().getFilesDir();
        File resolved;
        if (storageDir.isEmpty()) {
            resolved = new File(filesDir, "reticulum-mobile");
        } else {
            File candidate = new File(storageDir);
            resolved = candidate.isAbsolute() ? candidate : new File(filesDir, storageDir);
        }

        config.put("storageDir", resolved.getAbsolutePath());
    }
}
