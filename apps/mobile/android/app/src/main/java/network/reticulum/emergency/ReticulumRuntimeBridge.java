package network.reticulum.emergency;

final class ReticulumRuntimeBridge implements NodeRuntimeBridge {
    @Override
    public int start(String configJson) {
        return ReticulumBridge.start(configJson);
    }

    @Override
    public int stop() {
        return ReticulumBridge.stop();
    }

    @Override
    public int restart(String configJson) {
        return ReticulumBridge.restart(configJson);
    }

    @Override
    public String getStatusJson() {
        return ReticulumBridge.getStatusJson();
    }

    @Override
    public int connectPeer(String destinationHex) {
        return ReticulumBridge.connectPeer(destinationHex);
    }

    @Override
    public int disconnectPeer(String destinationHex) {
        return ReticulumBridge.disconnectPeer(destinationHex);
    }

    @Override
    public int sendJson(String payloadJson) {
        return ReticulumBridge.sendJson(payloadJson);
    }

    @Override
    public int broadcastBase64(String bytesBase64) {
        return ReticulumBridge.broadcastBase64(bytesBase64);
    }

    @Override
    public int setAnnounceCapabilities(String capabilityString) {
        return ReticulumBridge.setAnnounceCapabilities(capabilityString);
    }

    @Override
    public int setLogLevel(String levelString) {
        return ReticulumBridge.setLogLevel(levelString);
    }

    @Override
    public int refreshHubDirectory() {
        return ReticulumBridge.refreshHubDirectory();
    }

    @Override
    public String executeEnvelope(String envelopeJson) {
        return ReticulumBridge.executeEnvelope(envelopeJson);
    }

    @Override
    public String sendChatMessage(String requestJson) {
        return ReticulumBridge.sendChatMessage(requestJson);
    }

    @Override
    public String nextEventJson(int timeoutMs) {
        return ReticulumBridge.nextEventJson(timeoutMs);
    }

    @Override
    public String takeLastErrorJson() {
        return ReticulumBridge.takeLastErrorJson();
    }
}
