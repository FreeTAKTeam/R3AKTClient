package network.reticulum.emergency;

interface NodeRuntimeBridge {
    int start(String configJson);

    int stop();

    int restart(String configJson);

    String getStatusJson();

    int connectPeer(String destinationHex);

    int disconnectPeer(String destinationHex);

    int sendJson(String payloadJson);

    int broadcastBase64(String bytesBase64);

    int setAnnounceCapabilities(String capabilityString);

    int setLogLevel(String levelString);

    int refreshHubDirectory();

    String executeEnvelope(String envelopeJson);

    String nextEventJson(int timeoutMs);

    String takeLastErrorJson();
}
