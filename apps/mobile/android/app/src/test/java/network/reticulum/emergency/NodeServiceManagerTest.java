package network.reticulum.emergency;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.util.concurrent.atomic.AtomicReference;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class NodeServiceManagerTest {
    private FakeRuntimeBridge bridge;
    private NodeServiceManager manager;

    @Before
    public void setUp() {
        bridge = new FakeRuntimeBridge();
        manager = new NodeServiceManager(bridge);
    }

    @After
    public void tearDown() {
        manager.shutdown();
    }

    @Test
    public void startNodeTransitionsToRunningState() {
        int result = manager.startNode("{\"name\":\"test\"}");

        assertEquals(0, result);
        assertEquals(NodeServiceManager.ServiceState.Running, manager.getServiceStatus().getState());
        assertTrue(manager.getServiceStatus().isRunning());
        assertEquals("{\"name\":\"test\"}", manager.getLastKnownConfigJson());
    }

    @Test
    public void stopNodeTransitionsToStoppedState() {
        manager.startNode("{\"name\":\"test\"}");

        int result = manager.stopNode();

        assertEquals(0, result);
        assertEquals(NodeServiceManager.ServiceState.Stopped, manager.getServiceStatus().getState());
        assertFalse(manager.getServiceStatus().isRunning());
    }

    @Test
    public void startFailureTransitionsToErrorState() {
        bridge.startResult = 1;
        bridge.lastErrorJson = "{\"code\":\"NodeStartFailed\",\"message\":\"boom\"}";

        int result = manager.startNode("{\"name\":\"test\"}");

        assertEquals(1, result);
        assertEquals(NodeServiceManager.ServiceState.Error, manager.getServiceStatus().getState());
        assertEquals("NodeStartFailed", manager.getServiceStatus().getLastErrorCode());
        assertEquals("boom", manager.getServiceStatus().getLastErrorMessage());
    }

    @Test
    public void replayListenerGetsCurrentServiceStatus() {
        manager.startNode("{\"name\":\"test\"}");
        AtomicReference<NodeServiceManager.ServiceState> observedState = new AtomicReference<>();

        manager.addListener(
                new NodeServiceManager.Listener() {
                    @Override
                    public void onServiceStateChanged(NodeServiceManager.ServiceStatusSnapshot status) {
                        observedState.set(status.getState());
                    }

                    @Override
                    public void onNodeEvent(String eventEnvelopeJson) {
                        // Not needed for this test.
                    }
                },
                true
        );

        assertEquals(NodeServiceManager.ServiceState.Running, observedState.get());
    }

    private static final class FakeRuntimeBridge implements NodeRuntimeBridge {
        int startResult = 0;
        int stopResult = 0;
        int restartResult = 0;
        boolean running = false;
        String lastErrorJson = "";

        @Override
        public int start(String configJson) {
            if (startResult == 0) {
                running = true;
            }
            return startResult;
        }

        @Override
        public int stop() {
            if (stopResult == 0) {
                running = false;
            }
            return stopResult;
        }

        @Override
        public int restart(String configJson) {
            if (restartResult == 0) {
                running = true;
            }
            return restartResult;
        }

        @Override
        public String getStatusJson() {
            return "{\"running\":" + running + "}";
        }

        @Override
        public int connectPeer(String destinationHex) {
            return 0;
        }

        @Override
        public int disconnectPeer(String destinationHex) {
            return 0;
        }

        @Override
        public int sendJson(String payloadJson) {
            return 0;
        }

        @Override
        public int broadcastBase64(String bytesBase64) {
            return 0;
        }

        @Override
        public int setAnnounceCapabilities(String capabilityString) {
            return 0;
        }

        @Override
        public int setLogLevel(String levelString) {
            return 0;
        }

        @Override
        public int refreshHubDirectory() {
            return 0;
        }

        @Override
        public String executeEnvelope(String envelopeJson) {
            return "{\"ok\":true}";
        }

        @Override
        public String nextEventJson(int timeoutMs) {
            try {
                Thread.sleep(Math.min(Math.max(timeoutMs, 1), 10));
            } catch (InterruptedException interruptedException) {
                Thread.currentThread().interrupt();
            }
            return "";
        }

        @Override
        public String takeLastErrorJson() {
            String error = lastErrorJson;
            lastErrorJson = "";
            return error;
        }
    }
}
