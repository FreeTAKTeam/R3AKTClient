package network.reticulum.emergency;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingDeque;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

import org.json.JSONException;
import org.json.JSONObject;

public final class NodeServiceManager {
    public enum ServiceState {
        Created,
        Foreground,
        Running,
        Stopping,
        Stopped,
        Error
    }

    public interface Listener {
        void onServiceStateChanged(ServiceStatusSnapshot status);

        void onNodeEvent(String eventEnvelopeJson);
    }

    public static final class ServiceStatusSnapshot {
        private final ServiceState state;
        private final boolean running;
        private final boolean foreground;
        private final long droppedEvents;
        private final long updatedAtMs;
        private final String lastErrorCode;
        private final String lastErrorMessage;

        ServiceStatusSnapshot(
                ServiceState state,
                boolean running,
                boolean foreground,
                long droppedEvents,
                long updatedAtMs,
                String lastErrorCode,
                String lastErrorMessage
        ) {
            this.state = state;
            this.running = running;
            this.foreground = foreground;
            this.droppedEvents = droppedEvents;
            this.updatedAtMs = updatedAtMs;
            this.lastErrorCode = lastErrorCode == null ? "" : lastErrorCode;
            this.lastErrorMessage = lastErrorMessage == null ? "" : lastErrorMessage;
        }

        public ServiceState getState() {
            return state;
        }

        public boolean isRunning() {
            return running;
        }

        public boolean isForeground() {
            return foreground;
        }

        public long getDroppedEvents() {
            return droppedEvents;
        }

        public long getUpdatedAtMs() {
            return updatedAtMs;
        }

        public String getLastErrorCode() {
            return lastErrorCode;
        }

        public String getLastErrorMessage() {
            return lastErrorMessage;
        }

        public JSONObject toJsonObject() {
            JSONObject payload = new JSONObject();
            try {
                payload.put("state", state.name());
                payload.put("running", running);
                payload.put("foreground", foreground);
                payload.put("droppedEvents", droppedEvents);
                payload.put("updatedAtMs", updatedAtMs);
                if (!lastErrorCode.isEmpty()) {
                    payload.put("lastErrorCode", lastErrorCode);
                }
                if (!lastErrorMessage.isEmpty()) {
                    payload.put("lastErrorMessage", lastErrorMessage);
                }
            } catch (JSONException ignored) {
                // JSONObject put() should not fail for scalar values.
            }
            return payload;
        }

        public String toJsonString() {
            return toJsonObject().toString();
        }

        boolean sameAs(ServiceStatusSnapshot other) {
            return other != null
                    && state == other.state
                    && running == other.running
                    && foreground == other.foreground
                    && droppedEvents == other.droppedEvents
                    && lastErrorCode.equals(other.lastErrorCode)
                    && lastErrorMessage.equals(other.lastErrorMessage);
        }
    }

    private static final class NativeError {
        final String code;
        final String message;

        NativeError(String code, String message) {
            this.code = code == null ? "" : code;
            this.message = message == null ? "" : message;
        }
    }

    private static final int EVENT_QUEUE_CAPACITY = 512;
    private static final int EVENT_REPLAY_CAPACITY = 128;
    private static final int EVENT_POLL_TIMEOUT_MS = 500;
    private static final int EVENT_DISPATCH_TIMEOUT_MS = 250;

    private final NodeRuntimeBridge bridge;
    private final LinkedBlockingDeque<String> eventQueue =
            new LinkedBlockingDeque<>(EVENT_QUEUE_CAPACITY);
    private final Set<Listener> listeners = new CopyOnWriteArraySet<>();
    private final ArrayDeque<String> replayEvents = new ArrayDeque<>(EVENT_REPLAY_CAPACITY);
    private final Object replayLock = new Object();
    private final Object commandLock = new Object();
    private final AtomicBoolean eventLoopsRunning = new AtomicBoolean(false);
    private final AtomicLong droppedEventCounter = new AtomicLong(0);

    private volatile ExecutorService pollerExecutor;
    private volatile ExecutorService dispatcherExecutor;
    private volatile String lastConfigJson = "";
    private volatile String lastStatusJson = "";
    private volatile ServiceStatusSnapshot status;

    public NodeServiceManager() {
        this(new ReticulumRuntimeBridge());
    }

    NodeServiceManager(NodeRuntimeBridge bridge) {
        this.bridge = bridge;
        this.status = new ServiceStatusSnapshot(
                ServiceState.Created,
                false,
                false,
                0,
                System.currentTimeMillis(),
                "",
                ""
        );
    }

    public void addListener(Listener listener, boolean replayLatest) {
        if (listener == null) {
            return;
        }

        listeners.add(listener);
        if (!replayLatest) {
            return;
        }

        listener.onServiceStateChanged(getServiceStatus());
        for (String eventEnvelope : getReplaySnapshot()) {
            listener.onNodeEvent(eventEnvelope);
        }
    }

    public void removeListener(Listener listener) {
        if (listener == null) {
            return;
        }
        listeners.remove(listener);
    }

    public ServiceStatusSnapshot getServiceStatus() {
        return status;
    }

    public String getServiceStatusJson() {
        return status.toJsonString();
    }

    public String getStatusJson() {
        String raw = bridge.getStatusJson();
        if (raw != null && !raw.isEmpty()) {
            lastStatusJson = raw;
            return raw;
        }
        return lastStatusJson;
    }

    public String getLastKnownConfigJson() {
        return lastConfigJson;
    }

    public void setLastKnownConfigJson(String configJson) {
        lastConfigJson = configJson == null ? "" : configJson;
    }

    public void markCreated() {
        updateState(ServiceState.Created, false, false, "", "");
    }

    public void markForeground() {
        boolean running = readRunningStatus();
        updateState(running ? ServiceState.Running : ServiceState.Foreground, running, true, "", "");
    }

    public void reportServiceError(String code, String message, boolean foreground) {
        updateState(ServiceState.Error, readRunningStatus(), foreground, code, message);
    }

    public int startNode(String configJson) {
        synchronized (commandLock) {
            int result = bridge.start(configJson);
            if (result == 0) {
                lastConfigJson = configJson == null ? "" : configJson;
                startEventLoops();
                updateState(ServiceState.Running, true, true, "", "");
                return result;
            }

            NativeError error = consumeNativeError(
                    "NodeStartFailed",
                    "Failed to start native Reticulum node."
            );
            updateState(ServiceState.Error, readRunningStatus(), true, error.code, error.message);
            return result;
        }
    }

    public int restartNode(String configJson) {
        synchronized (commandLock) {
            int result = bridge.restart(configJson);
            if (result == 0) {
                lastConfigJson = configJson == null ? "" : configJson;
                startEventLoops();
                updateState(ServiceState.Running, true, true, "", "");
                return result;
            }

            NativeError error = consumeNativeError(
                    "NodeRestartFailed",
                    "Failed to restart native Reticulum node."
            );
            updateState(ServiceState.Error, readRunningStatus(), true, error.code, error.message);
            return result;
        }
    }

    public int stopNode() {
        synchronized (commandLock) {
            updateState(ServiceState.Stopping, readRunningStatus(), true, "", "");
            int result = bridge.stop();
            if (result == 0) {
                stopEventLoops();
                updateState(ServiceState.Stopped, false, false, "", "");
                return result;
            }

            boolean running = readRunningStatus();
            if (!running) {
                stopEventLoops();
            }
            NativeError error = consumeNativeError(
                    "NodeStopFailed",
                    "Failed to stop native Reticulum node."
            );
            updateState(ServiceState.Error, running, true, error.code, error.message);
            return result;
        }
    }

    public int connectPeer(String destinationHex) {
        return executeNativeCode(
                () -> bridge.connectPeer(destinationHex),
                "PeerConnectFailed",
                "Failed to connect peer."
        );
    }

    public int disconnectPeer(String destinationHex) {
        return executeNativeCode(
                () -> bridge.disconnectPeer(destinationHex),
                "PeerDisconnectFailed",
                "Failed to disconnect peer."
        );
    }

    public int sendJson(String payloadJson) {
        return executeNativeCode(
                () -> bridge.sendJson(payloadJson),
                "PacketSendFailed",
                "Failed to send bytes."
        );
    }

    public int broadcastBase64(String bytesBase64) {
        return executeNativeCode(
                () -> bridge.broadcastBase64(bytesBase64),
                "PacketBroadcastFailed",
                "Failed to broadcast bytes."
        );
    }

    public int setAnnounceCapabilities(String capabilityString) {
        return executeNativeCode(
                () -> bridge.setAnnounceCapabilities(capabilityString),
                "SetCapabilitiesFailed",
                "Failed to set announce capabilities."
        );
    }

    public int setLogLevel(String levelString) {
        return executeNativeCode(
                () -> bridge.setLogLevel(levelString),
                "SetLogLevelFailed",
                "Failed to set log level."
        );
    }

    public int refreshHubDirectory() {
        return executeNativeCode(
                bridge::refreshHubDirectory,
                "HubDirectoryRefreshFailed",
                "Failed to refresh hub directory."
        );
    }

    public String executeEnvelope(String envelopeJson) {
        String responseJson = bridge.executeEnvelope(envelopeJson);
        if (responseJson != null && !responseJson.isEmpty()) {
            return responseJson;
        }

        NativeError error = consumeNativeError(
                "EnvelopeExecutionFailed",
                "Failed to execute message envelope."
        );
        updateState(ServiceState.Error, readRunningStatus(), status.isForeground(), error.code, error.message);
        return "";
    }

    public String getLastErrorJson() {
        ServiceStatusSnapshot snapshot = status;
        if (snapshot.getLastErrorCode().isEmpty() && snapshot.getLastErrorMessage().isEmpty()) {
            return "";
        }

        JSONObject payload = new JSONObject();
        try {
            payload.put("code", snapshot.getLastErrorCode());
            payload.put("message", snapshot.getLastErrorMessage());
        } catch (JSONException ignored) {
            // JSONObject put() should not fail for scalar values.
        }
        return payload.toString();
    }

    public void shutdown() {
        stopEventLoops();
        listeners.clear();
    }

    private int executeNativeCode(
            NativeIntOperation operation,
            String fallbackCode,
            String fallbackMessage
    ) {
        int result = operation.run();
        if (result == 0) {
            ServiceStatusSnapshot current = status;
            if (current.getState() == ServiceState.Error && current.isRunning()) {
                updateState(ServiceState.Running, true, current.isForeground(), "", "");
            }
            return result;
        }

        NativeError error = consumeNativeError(fallbackCode, fallbackMessage);
        updateState(ServiceState.Error, readRunningStatus(), status.isForeground(), error.code, error.message);
        return result;
    }

    private synchronized void startEventLoops() {
        if (!eventLoopsRunning.compareAndSet(false, true)) {
            return;
        }

        pollerExecutor = Executors.newSingleThreadExecutor(namedThreadFactory("reticulum-node-poller"));
        dispatcherExecutor = Executors.newSingleThreadExecutor(namedThreadFactory("reticulum-node-dispatcher"));
        pollerExecutor.execute(this::pollEventsLoop);
        dispatcherExecutor.execute(this::dispatchEventsLoop);
    }

    private synchronized void stopEventLoops() {
        if (!eventLoopsRunning.compareAndSet(true, false)) {
            return;
        }

        if (pollerExecutor != null) {
            pollerExecutor.shutdownNow();
            pollerExecutor = null;
        }
        if (dispatcherExecutor != null) {
            dispatcherExecutor.shutdownNow();
            dispatcherExecutor = null;
        }
        eventQueue.clear();
    }

    private void pollEventsLoop() {
        while (eventLoopsRunning.get()) {
            try {
                String eventEnvelope = bridge.nextEventJson(EVENT_POLL_TIMEOUT_MS);
                if (eventEnvelope == null || eventEnvelope.isEmpty()) {
                    continue;
                }

                if (!eventQueue.offer(eventEnvelope)) {
                    eventQueue.poll();
                    eventQueue.offer(eventEnvelope);
                    droppedEventCounter.incrementAndGet();
                    refreshDroppedEventCount();
                }
            } catch (Exception ex) {
                reportServiceError("EventPollFailure", ex.getMessage(), status.isForeground());
            }
        }
    }

    private void dispatchEventsLoop() {
        while (eventLoopsRunning.get() || !eventQueue.isEmpty()) {
            try {
                String eventEnvelope = eventQueue.poll(EVENT_DISPATCH_TIMEOUT_MS, TimeUnit.MILLISECONDS);
                if (eventEnvelope == null || eventEnvelope.isEmpty()) {
                    continue;
                }

                captureReplayEvent(eventEnvelope);
                observeServiceTransitionsFromEvent(eventEnvelope);
                dispatchNodeEvent(eventEnvelope);
            } catch (InterruptedException interruptedException) {
                Thread.currentThread().interrupt();
                return;
            } catch (Exception ex) {
                reportServiceError("EventDispatchFailure", ex.getMessage(), status.isForeground());
            }
        }
    }

    private void observeServiceTransitionsFromEvent(String eventEnvelope) {
        try {
            JSONObject envelope = new JSONObject(eventEnvelope);
            String eventName = envelope.optString("event", "");
            JSONObject payload = envelope.optJSONObject("payload");
            if (payload == null) {
                return;
            }

            if ("statusChanged".equals(eventName)) {
                JSONObject statusPayload = payload.optJSONObject("status");
                JSONObject source = statusPayload != null ? statusPayload : payload;
                lastStatusJson = source.toString();
                boolean running = source.optBoolean("running", false);
                if (running) {
                    updateState(ServiceState.Running, true, status.isForeground(), "", "");
                } else if (status.getState() != ServiceState.Stopping) {
                    updateState(
                            status.isForeground() ? ServiceState.Foreground : ServiceState.Stopped,
                            false,
                            status.isForeground(),
                            "",
                            ""
                    );
                }
                return;
            }

            if ("error".equals(eventName)) {
                String code = payload.optString("code", "NodeRuntimeError");
                String message = payload.optString("message", "Native runtime error.");
                updateState(ServiceState.Error, readRunningStatus(), status.isForeground(), code, message);
            }
        } catch (JSONException ignored) {
            // Event payloads are produced by the native runtime. Ignore malformed entries.
        }
    }

    private void dispatchNodeEvent(String eventEnvelope) {
        for (Listener listener : listeners) {
            try {
                listener.onNodeEvent(eventEnvelope);
            } catch (Exception ignored) {
                // Listener exceptions should not break runtime dispatch.
            }
        }
    }

    private void dispatchStateChanged(ServiceStatusSnapshot next) {
        for (Listener listener : listeners) {
            try {
                listener.onServiceStateChanged(next);
            } catch (Exception ignored) {
                // Listener exceptions should not break runtime state notifications.
            }
        }
    }

    private void captureReplayEvent(String eventEnvelope) {
        synchronized (replayLock) {
            if (replayEvents.size() >= EVENT_REPLAY_CAPACITY) {
                replayEvents.removeFirst();
            }
            replayEvents.addLast(eventEnvelope);
        }
    }

    private List<String> getReplaySnapshot() {
        synchronized (replayLock) {
            return new ArrayList<>(replayEvents);
        }
    }

    private void refreshDroppedEventCount() {
        ServiceStatusSnapshot current = status;
        updateState(
                current.getState(),
                current.isRunning(),
                current.isForeground(),
                current.getLastErrorCode(),
                current.getLastErrorMessage()
        );
    }

    private boolean readRunningStatus() {
        String raw = bridge.getStatusJson();
        if (raw == null || raw.isEmpty()) {
            return status.isRunning();
        }

        lastStatusJson = raw;
        try {
            return new JSONObject(raw).optBoolean("running", status.isRunning());
        } catch (JSONException ignored) {
            return status.isRunning();
        }
    }

    private NativeError consumeNativeError(String fallbackCode, String fallbackMessage) {
        String raw = bridge.takeLastErrorJson();
        if (raw == null || raw.isEmpty()) {
            return new NativeError(fallbackCode, fallbackMessage);
        }

        try {
            JSONObject payload = new JSONObject(raw);
            String code = payload.optString("code", fallbackCode);
            String message = payload.optString("message", fallbackMessage);
            return new NativeError(code, message);
        } catch (JSONException ignored) {
            return new NativeError(fallbackCode, fallbackMessage);
        }
    }

    private void updateState(
            ServiceState state,
            boolean running,
            boolean foreground,
            String lastErrorCode,
            String lastErrorMessage
    ) {
        ServiceStatusSnapshot next = new ServiceStatusSnapshot(
                state,
                running,
                foreground,
                droppedEventCounter.get(),
                System.currentTimeMillis(),
                lastErrorCode,
                lastErrorMessage
        );

        ServiceStatusSnapshot previous = this.status;
        this.status = next;
        if (!next.sameAs(previous)) {
            dispatchStateChanged(next);
        }
    }

    private static ThreadFactory namedThreadFactory(String threadName) {
        return runnable -> {
            Thread thread = new Thread(runnable, threadName);
            thread.setDaemon(true);
            return thread;
        };
    }

    private interface NativeIntOperation {
        int run();
    }
}
